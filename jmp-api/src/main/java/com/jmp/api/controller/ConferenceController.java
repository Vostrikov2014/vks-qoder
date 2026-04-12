package com.jmp.api.controller;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.jmp.application.dto.ConferenceDto;
import com.jmp.application.service.ConferenceService;
import com.jmp.application.service.JwtService;
import com.jmp.domain.entity.Conference;
import com.jmp.domain.entity.User;
import com.jmp.domain.repository.ConferenceRepository;
import com.jmp.domain.repository.UserRepository;
import com.jmp.infrastructure.security.JwtAuthenticationFilter;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Conference management controller.
 * Per specification §5.3, §6.3
 */
@RestController
@RequestMapping("/api/v1/conferences")
@RequiredArgsConstructor
@Slf4j
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Conferences", description = "Conference management endpoints")
public class ConferenceController {

    private final ConferenceService conferenceService;
    private final ConferenceRepository conferenceRepository;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    @PostMapping
    @PreAuthorize("hasRole('MODERATOR') or hasRole('TENANT_ADMIN') or hasRole('SUPER_ADMIN')")
    @Operation(summary = "Create a new conference")
    public ResponseEntity<ConferenceDto.Response> createConference(
            @Valid @RequestBody ConferenceDto.CreateRequest request,
            Authentication authentication) {
        
        UUID tenantId = extractTenantId(authentication);
        UUID userId = extractUserId(authentication);
        
        log.info("Creating conference: {} for tenant: {}", request.roomName(), tenantId);
        
        ConferenceDto.Response conference = conferenceService.createConference(tenantId, userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(conference);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('PARTICIPANT') or hasRole('MODERATOR') or hasRole('TENANT_ADMIN') or hasRole('SUPER_ADMIN')")
    @Operation(summary = "Get conference by ID")
    public ResponseEntity<ConferenceDto.Response> getConference(
            @PathVariable UUID id,
            Authentication authentication) {
        UUID userId = extractUserId(authentication);
        boolean participantOnly = isParticipantOnly(authentication);
        return ResponseEntity.ok(conferenceService.getConference(id, userId, participantOnly));
    }

    @GetMapping
    @PreAuthorize("hasRole('PARTICIPANT') or hasRole('MODERATOR') or hasRole('TENANT_ADMIN') or hasRole('SUPER_ADMIN')")
    @Operation(summary = "List conferences in tenant")
    public ResponseEntity<Page<ConferenceDto.Summary>> listConferences(
            Pageable pageable,
            @RequestParam(required = false) String search,
            Authentication authentication) {
        
        UUID tenantId = extractTenantId(authentication);
        UUID userId = extractUserId(authentication);
        boolean participantOnly = isParticipantOnly(authentication);
        
        Page<ConferenceDto.Summary> conferences;
        if (search != null && !search.isBlank()) {
            conferences = conferenceService.searchConferences(tenantId, userId, participantOnly, search, pageable);
        } else {
            conferences = conferenceService.listConferences(tenantId, userId, participantOnly, pageable);
        }
        
        return ResponseEntity.ok(conferences);
    }

    @GetMapping("/active")
    @PreAuthorize("hasRole('PARTICIPANT') or hasRole('MODERATOR') or hasRole('TENANT_ADMIN') or hasRole('SUPER_ADMIN')")
    @Operation(summary = "Get active conferences")
    public ResponseEntity<List<ConferenceDto.Summary>> getActiveConferences(Authentication authentication) {
        UUID tenantId = extractTenantId(authentication);
        UUID userId = extractUserId(authentication);
        boolean participantOnly = isParticipantOnly(authentication);
        return ResponseEntity.ok(conferenceService.getActiveConferences(tenantId, userId, participantOnly));
    }

    @GetMapping("/upcoming")
    @PreAuthorize("hasRole('PARTICIPANT') or hasRole('MODERATOR') or hasRole('TENANT_ADMIN') or hasRole('SUPER_ADMIN')")
    @Operation(summary = "Get upcoming conferences")
    public ResponseEntity<List<ConferenceDto.Summary>> getUpcomingConferences(Authentication authentication) {
        UUID tenantId = extractTenantId(authentication);
        UUID userId = extractUserId(authentication);
        boolean participantOnly = isParticipantOnly(authentication);
        return ResponseEntity.ok(conferenceService.getUpcomingConferences(tenantId, userId, participantOnly));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('MODERATOR') or hasRole('TENANT_ADMIN') or hasRole('SUPER_ADMIN')")
    @Operation(summary = "Update conference")
    public ResponseEntity<ConferenceDto.Response> updateConference(
            @PathVariable UUID id,
            @Valid @RequestBody ConferenceDto.UpdateRequest request,
            Authentication authentication) {

        UUID userId = extractUserId(authentication);
        boolean isAdmin = isAdmin(authentication);

        return ResponseEntity.ok(conferenceService.updateConference(id, request, userId, isAdmin));
    }

    @PostMapping("/{id}/start")
    @PreAuthorize("hasRole('MODERATOR') or hasRole('TENANT_ADMIN') or hasRole('SUPER_ADMIN')")
    @Operation(summary = "Start a conference")
    public ResponseEntity<ConferenceDto.Response> startConference(@PathVariable UUID id, Authentication authentication) {
        UUID userId = extractUserId(authentication);
        boolean isAdmin = isAdmin(authentication);
        return ResponseEntity.ok(conferenceService.startConference(id, userId, isAdmin));
    }

    @PostMapping("/{id}/end")
    @PreAuthorize("hasRole('MODERATOR') or hasRole('TENANT_ADMIN') or hasRole('SUPER_ADMIN')")
    @Operation(summary = "End a conference")
    public ResponseEntity<ConferenceDto.Response> endConference(@PathVariable UUID id, Authentication authentication) {
        UUID userId = extractUserId(authentication);
        boolean isAdmin = isAdmin(authentication);
        return ResponseEntity.ok(conferenceService.endConference(id, userId, isAdmin));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('MODERATOR') or hasRole('TENANT_ADMIN') or hasRole('SUPER_ADMIN')")
    @Operation(summary = "Delete conference")
    public ResponseEntity<Void> deleteConference(@PathVariable UUID id, Authentication authentication) {
        UUID userId = extractUserId(authentication);
        boolean isAdmin = isAdmin(authentication);
        conferenceService.deleteConference(id, userId, isAdmin);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/token")
    @PreAuthorize("hasRole('PARTICIPANT') or hasRole('MODERATOR') or hasRole('TENANT_ADMIN') or hasRole('SUPER_ADMIN')")
    @Operation(summary = "Generate Jitsi JWT token for conference")
    public ResponseEntity<ConferenceDto.TokenResponse> generateToken(
            @PathVariable UUID id,
            @Valid @RequestBody ConferenceDto.TokenRequest request,
            Authentication authentication) {

        UUID userId = extractUserId(authentication);

        Conference conference = conferenceRepository.findWithDetailsById(id)
            .orElseThrow(() -> new IllegalArgumentException("Conference not found: " + id));

        // Load user from database instead of creating transient object
        User user = userRepository.findWithRolesById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        // Validate jitsiDomain is configured
        String jitsiDomain = conference.getTenant().getJitsiDomain();
        if (jitsiDomain == null || jitsiDomain.isBlank()) {
            throw new IllegalStateException("Jitsi domain not configured for tenant");
        }

        String token = jwtService.generateJitsiToken(conference, user,
            request.isModerator() != null ? request.isModerator() : false);

        String roomUrl = String.format("http://%s/%s?jwt=%s",
            jitsiDomain,
            conference.getRoomName(),
            token);

        return ResponseEntity.ok(new ConferenceDto.TokenResponse(
            token,
            roomUrl,
            jwtService.getExpirationTime(token)
        ));
    }

    @PostMapping("/{id}/share")
    @PreAuthorize("hasRole('PARTICIPANT') or hasRole('MODERATOR') or hasRole('TENANT_ADMIN') or hasRole('SUPER_ADMIN')")
    @Operation(summary = "Generate shareable link for conference")
    public ResponseEntity<ConferenceDto.ShareResponse> generateShareLink(
            @PathVariable UUID id,
            @Valid @RequestBody ConferenceDto.ShareRequest request,
            Authentication authentication) {

        Conference conference = conferenceRepository.findWithDetailsById(id)
            .orElseThrow(() -> new IllegalArgumentException("Conference not found: " + id));

        String displayName = request.displayName() != null ? request.displayName() : "Guest";

        // Validate jitsiDomain is configured
        String jitsiDomain = conference.getTenant().getJitsiDomain();
        if (jitsiDomain == null || jitsiDomain.isBlank()) {
            throw new IllegalStateException("Jitsi domain not configured for tenant");
        }

        String token = jwtService.generateGuestToken(conference, displayName, false);

        String roomUrl = String.format("http://%s/%s?jwt=%s",
            jitsiDomain,
            conference.getRoomName(),
            token);

        Instant expiresAt = jwtService.getGuestTokenExpiration();

        return ResponseEntity.ok(new ConferenceDto.ShareResponse(
            roomUrl,
            expiresAt
        ));
    }

    private UUID extractTenantId(Authentication authentication) {
        if (authentication.getDetails() instanceof JwtAuthenticationFilter.WebAuthenticationDetails details) {
            return details.getTenantId();
        }
        throw new IllegalStateException("Cannot extract tenant ID from authentication");
    }

    private UUID extractUserId(Authentication authentication) {
        if (authentication.getDetails() instanceof JwtAuthenticationFilter.WebAuthenticationDetails details) {
            return details.getUserId();
        }
        throw new IllegalStateException("Cannot extract user ID from authentication");
    }

    private boolean isParticipantOnly(Authentication authentication) {
        return authentication.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .noneMatch(role -> role.equals("ROLE_MODERATOR")
                || role.equals("ROLE_TENANT_ADMIN")
                || role.equals("ROLE_SUPER_ADMIN"));
    }

    private boolean isAdmin(Authentication authentication) {
        return authentication.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .anyMatch(role -> role.equals("ROLE_MODERATOR") || role.equals("ROLE_TENANT_ADMIN") || role.equals("ROLE_SUPER_ADMIN"));
    }
}
