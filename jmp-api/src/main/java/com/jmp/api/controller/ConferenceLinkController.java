package com.jmp.api.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.jmp.application.dto.ConferenceLinkDto;
import com.jmp.application.service.ConferenceLinkService;
import com.jmp.infrastructure.security.JwtAuthenticationFilter;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Management of permanent conference join links.
 *
 * <p>The links returned here carry the address that must be shared with participants.
 * Opening that address is handled by {@link JoinController}, which is public.
 */
@RestController
@RequestMapping("/api/v1/conferences/{conferenceId}/links")
@RequiredArgsConstructor
@Slf4j
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Conference links", description = "Permanent join links for a conference")
public class ConferenceLinkController {

    /** Any signed-in platform member may share a conference they are allowed into. */
    private static final String ANY_MEMBER =
        "hasRole('PARTICIPANT') or hasRole('MODERATOR') or hasRole('TENANT_ADMIN') or hasRole('SUPER_ADMIN')";

    private final ConferenceLinkService conferenceLinkService;

    @GetMapping
    @PreAuthorize(ANY_MEMBER)
    @Operation(summary = "List join links of a conference, creating the primary one on first use")
    public ResponseEntity<List<ConferenceLinkDto.Response>> listLinks(
            @PathVariable UUID conferenceId,
            Authentication authentication) {

        return ResponseEntity.ok(conferenceLinkService.listOrCreatePrimary(
            conferenceId, extractTenantId(authentication), extractUserId(authentication), isAdmin(authentication)));
    }

    @PostMapping
    @PreAuthorize(ANY_MEMBER)
    @Operation(summary = "Create an additional join link")
    public ResponseEntity<ConferenceLinkDto.Response> createLink(
            @PathVariable UUID conferenceId,
            @Valid @RequestBody ConferenceLinkDto.CreateRequest request,
            Authentication authentication) {

        ConferenceLinkDto.Response created = conferenceLinkService.createLink(
            conferenceId, request, extractTenantId(authentication), extractUserId(authentication),
            isAdmin(authentication));
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @DeleteMapping("/{linkId}")
    @PreAuthorize(ANY_MEMBER)
    @Operation(summary = "Revoke a join link")
    public ResponseEntity<Void> revokeLink(
            @PathVariable UUID conferenceId,
            @PathVariable UUID linkId,
            Authentication authentication) {

        conferenceLinkService.revokeLink(conferenceId, linkId, extractTenantId(authentication),
            extractUserId(authentication), isAdmin(authentication));
        return ResponseEntity.noContent().build();
    }

    /**
     * Extract the tenant ID of the authenticated user from the {@code tenant_id}
     * JWT claim carried in the authentication details set by
     * {@link JwtAuthenticationFilter}. The details are only present for requests
     * authenticated with a valid JWT access token; anything else indicates an
     * unexpected authentication mechanism.
     */
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

    private boolean isAdmin(Authentication authentication) {
        return authentication.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .anyMatch(role -> role.equals("ROLE_MODERATOR")
                || role.equals("ROLE_TENANT_ADMIN")
                || role.equals("ROLE_SUPER_ADMIN"));
    }
}
