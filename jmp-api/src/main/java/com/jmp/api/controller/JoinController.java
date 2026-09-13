package com.jmp.api.controller;

import java.util.UUID;
import java.util.regex.Pattern;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.jmp.application.dto.ConferenceLinkDto;
import com.jmp.application.service.ConferenceLinkService;
import com.jmp.infrastructure.security.JwtAuthenticationFilter;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Public resolution of conference join links.
 *
 * <p>This is the only endpoint a shared address touches. It is reachable without an
 * account, but it never hands out a Jitsi token without first applying the conference
 * access policy — unlike the old share links, which embedded a token straight into the
 * URL and therefore skipped authorisation altogether.
 *
 * <p>An authenticated visitor is recognised when a valid access token accompanies the
 * request, which is what makes the ASSIGNED_ONLY and DOMAIN_RESTRICTED policies usable.
 */
@RestController
@RequestMapping("/api/v1/join")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Join", description = "Public entry point of conference join links")
public class JoinController {

    /** Shape of a generated slug: 16 random bytes, base64url without padding. */
    private static final Pattern SLUG_PATTERN = Pattern.compile("[A-Za-z0-9_-]{22,32}");

    private final ConferenceLinkService conferenceLinkService;

    @GetMapping("/{slug}")
    @Operation(summary = "Resolve a join link into a short-lived Jitsi address")
    public ResponseEntity<ConferenceLinkDto.JoinResponse> resolve(
            @PathVariable String slug,
            @RequestParam(name = "displayName", required = false) String displayName,
            Authentication authentication) {

        if (!SLUG_PATTERN.matcher(slug).matches()) {
            return ResponseEntity.ok(ConferenceLinkDto.JoinResponse.of(
                ConferenceLinkDto.Decision.NOT_FOUND, "link_not_found", null));
        }

        return ResponseEntity.ok(conferenceLinkService.resolveJoin(
            slug, displayName, extractUserId(authentication), isModerator(authentication)));
    }

    /**
     * Identifier of the signed-in visitor, or {@code null} for an anonymous one. The
     * authentication is absent on purpose here: join links are open to people without an
     * account, so both cases must be handled.
     */
    private UUID extractUserId(Authentication authentication) {
        if (authentication != null
                && authentication.getDetails() instanceof JwtAuthenticationFilter.WebAuthenticationDetails details) {
            return details.getUserId();
        }
        return null;
    }

    private boolean isModerator(Authentication authentication) {
        if (authentication == null) {
            return false;
        }
        return authentication.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .anyMatch(role -> role.equals("ROLE_MODERATOR")
                || role.equals("ROLE_TENANT_ADMIN")
                || role.equals("ROLE_SUPER_ADMIN"));
    }
}
