package com.jmp.application.service;

import java.util.List;
import java.util.UUID;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.jmp.application.dto.ConferenceDto;
import com.jmp.application.dto.ConferenceLinkDto;
import com.jmp.application.dto.ParticipantAssignmentDto;
import com.jmp.domain.entity.Conference;
import com.jmp.domain.entity.ConferenceLink;
import com.jmp.domain.entity.User;
import com.jmp.domain.repository.ConferenceLinkRepository;
import com.jmp.domain.repository.ConferenceRepository;
import com.jmp.domain.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Use cases for permanent conference join links.
 *
 * <p>Replaces the previous "assemble a Jitsi URL with an embedded 4-hour token and hand
 * it out" approach. A link is a real, addressable object now: it is stable, it can be
 * revoked, it records how often it was used, and — most importantly — every visit goes
 * through {@link #resolveJoin} where the conference access policy is actually applied
 * before a Jitsi token is minted.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ConferenceLinkService {

    /** Guard against unbounded link creation per conference. */
    private static final int MAX_LINKS_PER_CONFERENCE = 20;

    private static final int MAX_DISPLAY_NAME_LENGTH = 100;

    private static final String ACTION_ALLOW = "allow";
    private static final String ACTION_LOGIN = "redirect_to_login";

    private final ConferenceLinkRepository linkRepository;
    private final ConferenceRepository conferenceRepository;
    private final UserRepository userRepository;
    private final ParticipantAssignmentService assignmentService;
    private final ParticipantPresenceService participantPresenceService;
    private final JwtService jwtService;
    private final JitsiLinkBuilder linkBuilder;

    // -------------------------------------------------------------------------
    // Management (authenticated)
    // -------------------------------------------------------------------------

    /**
     * List the links of a conference. The first call for a conference that predates join
     * links — or where every link was revoked — transparently creates the primary
     * moderator link, so a conference always has an address that can be shared.
     */
    @Transactional
    public List<ConferenceLinkDto.Response> listOrCreatePrimary(UUID conferenceId, UUID actorTenantId,
                                                                UUID actorId, boolean isAdmin) {
        Conference conference = loadScopedConference(conferenceId, actorTenantId);

        List<ConferenceLink> links = linkRepository.findByConferenceIdOrderByCreatedAtAsc(conferenceId);
        if (links.isEmpty()) {
            User actor = loadUser(actorId);
            ConferenceLink primary = linkRepository.save(
                ConferenceLink.create(conference, actor, ConferenceLink.LinkRole.MODERATOR, null, null));
            links = List.of(primary);
            log.info("Created primary join link for conference: {}", conferenceId);
        }

        return links.stream()
            .map(this::toResponse)
            .toList();
    }

    /**
     * Create an additional link, optionally restricted in time and labelled by purpose.
     *
     * @param role {@code "MODERATOR"} grants host capabilities to everyone arriving
     *             through the link and therefore requires moderator rights on the
     *             conference itself; anything else yields a participant link
     */
    @Transactional
    public ConferenceLinkDto.Response createLink(UUID conferenceId, ConferenceLinkDto.CreateRequest request,
                                                 UUID actorTenantId, UUID actorId, boolean isAdmin) {
        Conference conference = loadScopedConference(conferenceId, actorTenantId);

        ConferenceLink.LinkRole role = parseRole(request.role());
        if (role == ConferenceLink.LinkRole.MODERATOR && !canModerate(conference, actorId, isAdmin)) {
            throw new AccessDeniedException("Only a conference moderator can grant moderator rights via a link");
        }

        List<ConferenceLink> existing = linkRepository.findByConferenceIdOrderByCreatedAtAsc(conferenceId);
        if (existing.size() >= MAX_LINKS_PER_CONFERENCE) {
            throw new IllegalStateException(
                "A conference can have at most " + MAX_LINKS_PER_CONFERENCE + " join links");
        }

        ConferenceLink link = ConferenceLink.create(
            conference, loadUser(actorId), role, trimToNull(request.label()), request.expiresAt());
        return toResponse(linkRepository.save(link));
    }

    /**
     * Revoke a link: the shared address stops working immediately.
     */
    @Transactional
    public void revokeLink(UUID conferenceId, UUID linkId, UUID actorTenantId, UUID actorId, boolean isAdmin) {
        Conference conference = loadScopedConference(conferenceId, actorTenantId);

        ConferenceLink link = linkRepository.findByIdAndConferenceId(linkId, conference.getId())
            .orElseThrow(() -> new IllegalArgumentException("Link not found: " + linkId));

        // Revoking somebody else's participant link is harmless; revoking a moderator
        // link or the primary link affects the whole conference and is moderator-only.
        boolean isPrimary = link.getCreatedBy().getId().equals(conference.getCreatedBy().getId());
        if ((isPrimary || link.getRole() == ConferenceLink.LinkRole.MODERATOR)
                && !canModerate(conference, actorId, isAdmin)) {
            throw new AccessDeniedException("Only a conference moderator can revoke this link");
        }

        link.revoke();
        linkRepository.save(link);
        log.info("Revoked join link: {} of conference: {}", linkId, conferenceId);
    }

    /**
     * Mint a Jitsi address for the caller's own entry into a conference — the "start and
     * join" flow of the web UI, where no link is shared with anybody.
     *
     * <p>The caller's tenant must own the conference, and moderator rights are derived
     * from the caller's identity rather than from a request parameter.
     */
    @Transactional
    public ConferenceDto.TokenResponse mintPersonalToken(UUID conferenceId, UUID actorTenantId,
                                                         UUID actorId, boolean isAdmin) {
        Conference conference = loadScopedConference(conferenceId, actorTenantId);
        User user = loadUser(actorId);

        boolean moderator = canModerate(conference, actorId, isAdmin);
        String token = jwtService.generateJitsiToken(conference, user, moderator);

        participantPresenceService.recordEntry(conference, user, userDisplayName(user), moderator);

        log.info("Issued a personal Jitsi token for user: {} in conference: {} ({})",
            actorId, conferenceId, moderator ? "moderator" : "participant");

        return new ConferenceDto.TokenResponse(
            linkBuilder.roomUrlWithPrejoin(conference, token),
            jwtService.jitsiTokenExpiration()
        );
    }

    // -------------------------------------------------------------------------
    // Resolution (public)
    // -------------------------------------------------------------------------

    /**
     * Evaluate a visit to a join link and, when the visitor is allowed in, mint a Jitsi
     * token for them. This is the only place where a share link grants entry, so it is
     * also where the conference access policy is enforced.
     *
     * @param slug                   slug taken from the shared address
     * @param requestedDisplayName   name a guest wants to appear with, optional
     * @param authenticatedUserId    signed-in user, {@code null} for anonymous visitors
     * @param actorIsModerator       whether the signed-in user holds a moderator-ish platform role
     */
    @Transactional
    public ConferenceLinkDto.JoinResponse resolveJoin(String slug, String requestedDisplayName,
                                                      UUID authenticatedUserId, boolean actorIsModerator) {
        ConferenceLink link = linkRepository.findBySlug(slug).orElse(null);
        if (link == null) {
            log.info("Unknown join link requested: {}", slug);
            return ConferenceLinkDto.JoinResponse.of(
                ConferenceLinkDto.Decision.NOT_FOUND, "link_not_found", null);
        }

        Conference conference = link.getConference();
        String conferenceName = conference.getDisplayName();

        if (!link.isActive()) {
            String reason = link.getRevokedAt() != null ? "link_revoked" : "link_expired";
            log.info("Rejected visit to {} join link: {}", reason, slug);
            return ConferenceLinkDto.JoinResponse.of(ConferenceLinkDto.Decision.NOT_FOUND, reason, conferenceName);
        }

        if (conference.getStatus() == Conference.ConferenceStatus.CANCELLED) {
            return ConferenceLinkDto.JoinResponse.of(
                ConferenceLinkDto.Decision.ENDED, "conference_cancelled", conferenceName);
        }

        User visitor = authenticatedUserId != null
            ? userRepository.findWithRolesById(authenticatedUserId).orElse(null)
            : null;

        ParticipantAssignmentDto.AccessCheckResponse access = evaluateAccess(conference, visitor);
        if (!ACTION_ALLOW.equals(access.action())) {
            log.info("Join link {} refused visitor: {}", slug, access.reason());
            return ConferenceLinkDto.JoinResponse.of(
                decisionFor(access.action()), access.reason(), conferenceName);
        }

        boolean moderator = isModeratorFor(link, conference, visitor, actorIsModerator, access);
        String displayName = resolveDisplayName(requestedDisplayName, visitor);

        String token = visitor != null
            ? jwtService.generateJitsiToken(conference, visitor, moderator)
            : jwtService.generateGuestToken(conference, displayName, moderator);

        participantPresenceService.recordEntry(conference, visitor, displayName, moderator);

        link.registerVisit();
        linkRepository.save(link);

        String roomUrl = linkBuilder.roomUrlWithPrejoin(conference, token);
        log.info("Granted access via join link {} to conference {} ({})",
            slug, conference.getId(), moderator ? "moderator" : "participant");

        return ConferenceLinkDto.JoinResponse.redirect(
            roomUrl, jwtService.jitsiTokenExpiration(), access.reason(), displayName, conferenceName);
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    /**
     * Load a conference and make sure it belongs to the tenant of the acting user.
     * This is the check that used to be missing on the token and share endpoints, which
     * let any authenticated user obtain access to any conference by its identifier.
     */
    private Conference loadScopedConference(UUID conferenceId, UUID actorTenantId) {
        Conference conference = conferenceRepository.findWithDetailsById(conferenceId)
            .orElseThrow(() -> new IllegalArgumentException("Conference not found: " + conferenceId));

        if (actorTenantId == null || !conference.getTenant().getId().equals(actorTenantId)) {
            throw new AccessDeniedException("Conference does not belong to your tenant");
        }
        return conference;
    }

    private User loadUser(UUID userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
    }

    private boolean canModerate(Conference conference, UUID actorId, boolean isAdmin) {
        return isAdmin || conference.getCreatedBy().getId().equals(actorId);
    }

    private ParticipantAssignmentDto.AccessCheckResponse evaluateAccess(Conference conference, User visitor) {
        UUID userId = visitor != null ? visitor.getId() : null;
        String email = visitor != null ? visitor.getEmail() : null;
        String authStatus = visitor != null ? "authenticated" : "anonymous";
        return assignmentService.checkAccess(conference.getId(),
            new ParticipantAssignmentDto.AccessCheckRequest(userId, email, null, authStatus));
    }

    /**
     * Translate the action of an access-check verdict into what the SPA should do.
     * A not-assigned visitor is refused outright: the Jitsi lobby is a room-wide feature
     * that cannot be granted to a single visitor through a token.
     */
    private ConferenceLinkDto.Decision decisionFor(String action) {
        if (ACTION_LOGIN.equals(action)) {
            return ConferenceLinkDto.Decision.LOGIN;
        }
        return ConferenceLinkDto.Decision.DENIED;
    }

    /**
     * Decide the Jitsi role on the server: the role baked into the link, elevated for the
     * conference host and for platform moderators. Never taken from the request body.
     */
    private boolean isModeratorFor(ConferenceLink link, Conference conference, User visitor,
                                  boolean actorIsModerator,
                                  ParticipantAssignmentDto.AccessCheckResponse access) {
        if (link.getRole() == ConferenceLink.LinkRole.MODERATOR) {
            return true;
        }
        if (visitor == null) {
            return false;
        }
        if (actorIsModerator || visitor.getId().equals(conference.getCreatedBy().getId())) {
            return true;
        }
        return access.participantInfo() != null
            && ConferenceLink.LinkRole.MODERATOR.name().equals(access.participantInfo().role());
    }

    private String resolveDisplayName(String requestedDisplayName, User visitor) {
        if (visitor != null) {
            return userDisplayName(visitor);
        }
        String requested = trimToNull(requestedDisplayName);
        if (requested == null) {
            return "Guest";
        }
        return requested.length() > MAX_DISPLAY_NAME_LENGTH
            ? requested.substring(0, MAX_DISPLAY_NAME_LENGTH)
            : requested;
    }

    private ConferenceLinkDto.Response toResponse(ConferenceLink link) {
        return new ConferenceLinkDto.Response(
            link.getId(),
            link.getSlug(),
            linkBuilder.joinUrl(link.getSlug()),
            link.getLabel(),
            link.getRole().name(),
            link.getExpiresAt(),
            link.getRevokedAt(),
            link.getVisitCount(),
            link.getLastVisitedAt(),
            userDisplayName(link.getCreatedBy()),
            link.getCreatedAt()
        );
    }

    private String userDisplayName(User user) {
        String firstName = trimToNull(user.getFirstName());
        String lastName = trimToNull(user.getLastName());
        if (firstName == null && lastName == null) {
            return user.getEmail();
        }
        return ((firstName != null ? firstName : "") + (lastName != null ? " " + lastName : "")).trim();
    }

    private ConferenceLink.LinkRole parseRole(String role) {
        if (role == null || role.isBlank()) {
            return ConferenceLink.LinkRole.PARTICIPANT;
        }
        try {
            return ConferenceLink.LinkRole.valueOf(role.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid link role: " + role + ". Valid roles: PARTICIPANT, MODERATOR");
        }
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
