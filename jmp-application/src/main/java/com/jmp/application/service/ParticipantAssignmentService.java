package com.jmp.application.service;

import com.jmp.application.dto.ParticipantAssignmentDto;
import com.jmp.application.mapper.ParticipantAssignmentMapper;
import com.jmp.domain.entity.AccessPolicy;
import com.jmp.domain.entity.AssignmentAuditLog;
import com.jmp.domain.entity.Conference;
import com.jmp.domain.entity.ParticipantAssignment;
import com.jmp.domain.repository.AssignmentAuditLogRepository;
import com.jmp.domain.repository.ConferenceRepository;
import com.jmp.domain.repository.ParticipantAssignmentRepository;
import com.jmp.domain.repository.UserRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for participant assignment operations.
 * Per specification §8.1
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class ParticipantAssignmentService {

    private final ConferenceRepository conferenceRepository;
    private final ParticipantAssignmentRepository assignmentRepository;
    private final AssignmentAuditLogRepository auditLogRepository;
    private final UserRepository userRepository;
    private final ParticipantAssignmentMapper mapper;

    /**
     * Assign a participant to a conference.
     */
    @Transactional
    public ParticipantAssignmentDto.Response assignParticipant(
            UUID conferenceId, ParticipantAssignmentDto.CreateRequest request, UUID actorId) {
        log.info("Assigning participant {} to conference: {}", request.email(), conferenceId);

        Conference conference = conferenceRepository.findById(conferenceId)
            .orElseThrow(() -> new IllegalArgumentException("Conference not found: " + conferenceId));

        if (assignmentRepository.existsByConferenceIdAndEmail(conferenceId, request.email())) {
            throw new IllegalArgumentException("Participant already assigned: " + request.email());
        }

        ParticipantAssignment assignment = mapper.toEntity(request);
        assignment.setConference(conference);
        assignment.setInvitedAt(Instant.now());

        if (request.userId() != null) {
            userRepository.findById(request.userId()).ifPresent(assignment::setUser);
        }

        ParticipantAssignment saved = assignmentRepository.save(assignment);
        log.info("Participant assigned with ID: {}", saved.getId());

        logAudit(conferenceId, actorId, "assigned",
            saved.getUser() != null ? saved.getUser().getId() : null,
            saved.getEmail(),
            Map.of("role", saved.getRole().name(), "email", saved.getEmail()));

        return mapper.toResponse(saved);
    }

    /**
     * Remove a participant assignment.
     */
    @Transactional
    public void removeAssignment(UUID conferenceId, UUID assignmentId, UUID actorId) {
        log.info("Removing assignment: {} from conference: {}", assignmentId, conferenceId);

        ParticipantAssignment assignment = assignmentRepository.findByIdAndConferenceId(assignmentId, conferenceId)
            .orElseThrow(() -> new IllegalArgumentException("Assignment not found: " + assignmentId));

        assignment.remove();
        assignmentRepository.save(assignment);

        logAudit(conferenceId, actorId, "removed",
            assignment.getUser() != null ? assignment.getUser().getId() : null,
            assignment.getEmail(),
            null);

        log.info("Assignment removed: {}", assignmentId);
    }

    /**
     * Update a participant assignment.
     */
    @Transactional
    public ParticipantAssignmentDto.Response updateAssignment(
            UUID conferenceId, UUID assignmentId,
            ParticipantAssignmentDto.UpdateRequest request, UUID actorId) {
        log.info("Updating assignment: {} in conference: {}", assignmentId, conferenceId);

        ParticipantAssignment assignment = assignmentRepository.findByIdAndConferenceId(assignmentId, conferenceId)
            .orElseThrow(() -> new IllegalArgumentException("Assignment not found: " + assignmentId));

        String oldRole = assignment.getRole().name();
        String oldStatus = assignment.getStatus().name();

        mapper.updateEntityFromDto(request, assignment);
        ParticipantAssignment saved = assignmentRepository.save(assignment);

        logAudit(conferenceId, actorId, "updated",
            saved.getUser() != null ? saved.getUser().getId() : null,
            saved.getEmail(),
            Map.of(
                "oldRole", oldRole,
                "newRole", saved.getRole().name(),
                "oldStatus", oldStatus,
                "newStatus", saved.getStatus().name()
            ));

        log.info("Assignment updated: {}", assignmentId);
        return mapper.toResponse(saved);
    }

    /**
     * Get all assignments for a conference.
     */
    public List<ParticipantAssignmentDto.Response> getAssignments(UUID conferenceId) {
        return assignmentRepository.findByConferenceId(conferenceId).stream()
            .map(mapper::toResponse)
            .toList();
    }

    /**
     * Get a single assignment by ID and conference.
     */
    public ParticipantAssignmentDto.Response getAssignment(UUID conferenceId, UUID assignmentId) {
        ParticipantAssignment assignment = assignmentRepository.findByIdAndConferenceId(assignmentId, conferenceId)
            .orElseThrow(() -> new IllegalArgumentException("Assignment not found: " + assignmentId));
        return mapper.toResponse(assignment);
    }

    /**
     * Bulk assign participants to a conference. Skips duplicates with a warning.
     */
    @Transactional
    public List<ParticipantAssignmentDto.Response> bulkAssign(
            UUID conferenceId, ParticipantAssignmentDto.BulkCreateRequest request, UUID actorId) {
        log.info("Bulk assigning {} participants to conference: {}", request.participants().size(), conferenceId);

        List<ParticipantAssignmentDto.Response> results = new ArrayList<>();
        for (ParticipantAssignmentDto.CreateRequest participant : request.participants()) {
            try {
                results.add(assignParticipant(conferenceId, participant, actorId));
            } catch (IllegalArgumentException e) {
                log.warn("Skipping duplicate or invalid participant {}: {}", participant.email(), e.getMessage());
            }
        }
        return results;
    }

    /**
     * Check whether a user/email has access to a conference based on its access policy.
     */
    public ParticipantAssignmentDto.AccessCheckResponse checkAccess(
            UUID conferenceId, ParticipantAssignmentDto.AccessCheckRequest request) {

        Conference conference = conferenceRepository.findById(conferenceId)
            .orElseThrow(() -> new IllegalArgumentException("Conference not found: " + conferenceId));

        // Priority 1: Host always has access
        if (request.userId() != null && conference.getCreatedBy() != null
                && request.userId().equals(conference.getCreatedBy().getId())) {
            return new ParticipantAssignmentDto.AccessCheckResponse(true, "host_privilege", "allow", null);
        }

        // Priority 2: Public meetings
        AccessPolicy policy = conference.getAccessPolicy();
        if (policy == AccessPolicy.PUBLIC) {
            return new ParticipantAssignmentDto.AccessCheckResponse(true, "public_meeting", "allow", null);
        }

        // Priority 3: Domain restricted
        if (policy == AccessPolicy.DOMAIN_RESTRICTED) {
            String email = request.email();
            String allowedDomain = conference.getAllowedDomain();

            if (email != null && allowedDomain != null) {
                String normalizedDomain = allowedDomain.trim().toLowerCase();
                if (normalizedDomain.startsWith("@")) {
                    normalizedDomain = normalizedDomain.substring(1);
                }

                String emailLower = email.toLowerCase();
                if (emailLower.endsWith("@" + normalizedDomain)) {
                    return new ParticipantAssignmentDto.AccessCheckResponse(true, "domain_match", "allow", null);
                }
            }

            return new ParticipantAssignmentDto.AccessCheckResponse(false, "domain_mismatch", "deny", null);
        }

        // Priority 4: Assigned only
        if (policy == AccessPolicy.ASSIGNED_ONLY) {
            Optional<ParticipantAssignment> assignment = Optional.empty();
            if (request.userId() != null) {
                assignment = assignmentRepository.findByConferenceIdAndUserId(conferenceId, request.userId());
            }
            if (assignment.isEmpty() && request.email() != null) {
                assignment = assignmentRepository.findByConferenceIdAndEmail(conferenceId, request.email());
            }

            if (assignment.isEmpty()) {
                if (Boolean.TRUE.equals(conference.getWaitingRoomEnabled())) {
                    return new ParticipantAssignmentDto.AccessCheckResponse(false, "not_assigned", "redirect_to_waiting_room", null);
                }
                return new ParticipantAssignmentDto.AccessCheckResponse(false, "not_assigned", "deny", null);
            }

            ParticipantAssignment pa = assignment.get();

            if (pa.getStatus() == ParticipantAssignment.AssignmentStatus.DECLINED
                    || pa.getStatus() == ParticipantAssignment.AssignmentStatus.REMOVED) {
                return new ParticipantAssignmentDto.AccessCheckResponse(
                    false, "assignment_" + pa.getStatus().name().toLowerCase(), "deny", null);
            }

            if (Boolean.TRUE.equals(pa.getRequireAuth()) && !"authenticated".equals(request.authStatus())) {
                return new ParticipantAssignmentDto.AccessCheckResponse(false, "auth_required", "redirect_to_login", null);
            }

            ParticipantAssignmentDto.ParticipantInfo info = new ParticipantAssignmentDto.ParticipantInfo(
                pa.getRole().name(), pa.getEmail()
            );
            return new ParticipantAssignmentDto.AccessCheckResponse(true, "assigned_participant", "allow", info);
        }

        // Fallback
        return new ParticipantAssignmentDto.AccessCheckResponse(false, "unknown_policy", "deny", null);
    }

    /**
     * Get audit log entries for a conference.
     */
    public List<ParticipantAssignmentDto.AuditLogResponse> getAuditLog(UUID conferenceId) {
        return auditLogRepository.findByConferenceIdOrderByCreatedAtDesc(conferenceId).stream()
            .map(mapper::toAuditLogResponse)
            .toList();
    }

    /**
     * Accept a conference invitation.
     */
    @Transactional
    public ParticipantAssignmentDto.Response acceptInvitation(UUID conferenceId, UUID assignmentId) {
        log.info("Accepting invitation: {} for conference: {}", assignmentId, conferenceId);

        ParticipantAssignment assignment = assignmentRepository.findByIdAndConferenceId(assignmentId, conferenceId)
            .orElseThrow(() -> new IllegalArgumentException("Assignment not found: " + assignmentId));

        assignment.accept();
        ParticipantAssignment saved = assignmentRepository.save(assignment);

        logAudit(conferenceId,
            saved.getUser() != null ? saved.getUser().getId() : null,
            "accepted",
            saved.getUser() != null ? saved.getUser().getId() : null,
            saved.getEmail(),
            null);

        log.info("Invitation accepted: {}", assignmentId);
        return mapper.toResponse(saved);
    }

    /**
     * Decline a conference invitation.
     */
    @Transactional
    public ParticipantAssignmentDto.Response declineInvitation(UUID conferenceId, UUID assignmentId) {
        log.info("Declining invitation: {} for conference: {}", assignmentId, conferenceId);

        ParticipantAssignment assignment = assignmentRepository.findByIdAndConferenceId(assignmentId, conferenceId)
            .orElseThrow(() -> new IllegalArgumentException("Assignment not found: " + assignmentId));

        assignment.decline();
        ParticipantAssignment saved = assignmentRepository.save(assignment);

        logAudit(conferenceId,
            saved.getUser() != null ? saved.getUser().getId() : null,
            "declined",
            saved.getUser() != null ? saved.getUser().getId() : null,
            saved.getEmail(),
            null);

        log.info("Invitation declined: {}", assignmentId);
        return mapper.toResponse(saved);
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private void logAudit(UUID conferenceId, UUID actorId, String action,
                          UUID targetUserId, String targetEmail, Object metadata) {
        try {
            AssignmentAuditLog auditLog = new AssignmentAuditLog();
            auditLog.setConferenceId(conferenceId);
            auditLog.setActorId(actorId != null ? actorId : conferenceId); // fallback to conferenceId if actor unknown
            auditLog.setAction(action);
            auditLog.setTargetUserId(targetUserId);
            auditLog.setTargetEmail(targetEmail);
            auditLog.setMetadata(metadata);
            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            log.error("Failed to write assignment audit log for conference: {}", conferenceId, e);
        }
    }
}
