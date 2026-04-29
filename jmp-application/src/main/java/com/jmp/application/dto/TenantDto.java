package com.jmp.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * DTOs for Tenant entity.
 */
public class TenantDto {

    /**
     * Quotas sub-DTO used in requests and responses.
     */
    public record QuotasDto(
        Integer maxConcurrentConferences,
        Integer maxParticipantsPerConference,
        Long maxRecordingStorageMb,
        Integer maxConferenceDurationMinutes,
        String allowedFeatures
    ) {}

    /**
     * Full response DTO.
     */
    public record Response(
        UUID id,
        String name,
        String slug,
        String description,
        String status,
        String domain,
        String jitsiDomain,
        QuotasDto quotas,
        Map<String, Object> settings,
        Map<String, Object> jitsiConfig,
        Instant createdAt,
        Instant updatedAt,
        Instant suspendedAt,
        String suspensionReason
    ) {}

    /**
     * Summary response DTO for list views.
     */
    public record Summary(
        UUID id,
        String name,
        String slug,
        String status,
        String domain,
        String jitsiDomain,
        Instant createdAt
    ) {}

    /**
     * Request DTO for creating a tenant.
     */
    public record CreateRequest(
        @NotBlank @Size(max = 100) String name,
        @NotBlank @Size(max = 50) String slug,
        @Size(max = 500) String description,
        @Size(max = 255) String domain,
        @Size(max = 255) String jitsiDomain,
        QuotasDto quotas
    ) {}

    /**
     * Request DTO for updating a tenant.
     */
    public record UpdateRequest(
        @Size(max = 100) String name,
        @Size(max = 500) String description,
        @Size(max = 255) String domain,
        @Size(max = 255) String jitsiDomain,
        QuotasDto quotas
    ) {}

    /**
     * Request DTO for suspending a tenant.
     */
    public record SuspendRequest(
        @Size(max = 500) String reason
    ) {}
}
