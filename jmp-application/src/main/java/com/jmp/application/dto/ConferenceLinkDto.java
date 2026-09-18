package com.jmp.application.dto;

import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.UUID;

/**
 * DTOs for permanent conference join links.
 */
public class ConferenceLinkDto {

    /**
     * Request DTO for creating a link. An omitted role means PARTICIPANT: moderator
     * access must always be granted explicitly.
     */
    public record CreateRequest(
        @Size(max = 100) String label,
        @Size(max = 20) String role,
        Instant expiresAt
    ) {}

    /**
     * Response DTO describing a link and the stable address that must be shared.
     */
    public record Response(
        UUID id,
        String slug,
        String joinUrl,
        String label,
        String role,
        Instant expiresAt,
        Instant revokedAt,
        Integer visitCount,
        Instant lastVisitedAt,
        String createdByName,
        Instant createdAt
    ) {}

    /**
     * What the SPA should do with a visitor that opened a join link.
     */
    public enum Decision {
        /** Proceed: {@code roomUrl} holds a freshly signed Jitsi address. */
        REDIRECT,
        /** Sign in first, then retry the same link. */
        LOGIN,
        /** Conference was cancelled or has already ended. */
        ENDED,
        /** Access denied by the conference access policy. */
        DENIED,
        /** Unknown, revoked or expired link. */
        NOT_FOUND
    }

    /**
     * Response DTO of a join request. {@code roomUrl} is filled only when the visitor
     * is allowed in; every other case carries a machine-readable {@code reason} so the
     * SPA can render the right screen.
     */
    public record JoinResponse(
        Decision decision,
        String reason,
        String roomUrl,
        Instant expiresAt,
        String displayName,
        String conferenceName
    ) {
        public static JoinResponse redirect(String roomUrl, Instant expiresAt, String reason,
                                            String displayName, String conferenceName) {
            return new JoinResponse(Decision.REDIRECT, reason, roomUrl, expiresAt, displayName, conferenceName);
        }

        public static JoinResponse of(Decision decision, String reason, String conferenceName) {
            return new JoinResponse(decision, reason, null, null, null, conferenceName);
        }
    }
}
