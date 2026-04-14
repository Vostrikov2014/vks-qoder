package com.jmp.application.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * DTOs for ParticipantAssignment entity.
 * Per specification §8.1
 */
public sealed interface ParticipantAssignmentDto {

    UUID id();
    UUID conferenceId();
    UUID userId();
    String email();
    String role();
    String status();

    /**
     * Request DTO for creating a participant assignment.
     */
    record CreateRequest(
        @NotBlank @Email String email,
        UUID userId,
        String role,
        Boolean requireAuth,
        Boolean sendInvite
    ) implements ParticipantAssignmentDto {
        @Override public UUID id() { return null; }
        @Override public UUID conferenceId() { return null; }
        @Override public String status() { return null; }
    }

    /**
     * Request DTO for updating a participant assignment.
     */
    record UpdateRequest(
        String role,
        String status,
        Boolean requireAuth
    ) implements ParticipantAssignmentDto {
        @Override public UUID id() { return null; }
        @Override public UUID conferenceId() { return null; }
        @Override public UUID userId() { return null; }
        @Override public String email() { return null; }
    }

    /**
     * Response DTO for participant assignment data.
     */
    record Response(
        UUID id,
        UUID conferenceId,
        UUID userId,
        String email,
        String role,
        String status,
        Boolean requireAuth,
        Instant invitedAt,
        Instant respondedAt,
        Instant joinedAt,
        Instant leftAt,
        Instant createdAt
    ) implements ParticipantAssignmentDto {}

    /**
     * Request DTO for bulk creating participant assignments.
     */
    record BulkCreateRequest(
        @NotNull @Size(min = 1) List<CreateRequest> participants
    ) implements ParticipantAssignmentDto {
        @Override public UUID id() { return null; }
        @Override public UUID conferenceId() { return null; }
        @Override public UUID userId() { return null; }
        @Override public String email() { return null; }
        @Override public String role() { return null; }
        @Override public String status() { return null; }
    }

    /**
     * Request DTO for checking participant access.
     */
    record AccessCheckRequest(
        UUID userId,
        @Email String email,
        String invitationToken,
        String authStatus
    ) implements ParticipantAssignmentDto {
        @Override public UUID id() { return null; }
        @Override public UUID conferenceId() { return null; }
        @Override public String role() { return null; }
        @Override public String status() { return null; }
    }

    /**
     * Response DTO for access check result.
     */
    record AccessCheckResponse(
        boolean allowed,
        String reason,
        String action,
        ParticipantInfo participantInfo
    ) implements ParticipantAssignmentDto {
        @Override public UUID id() { return null; }
        @Override public UUID conferenceId() { return null; }
        @Override public UUID userId() { return null; }
        @Override public String email() { return null; }
        @Override public String role() { return null; }
        @Override public String status() { return null; }
    }

    /**
     * DTO for participant info within access check response.
     */
    record ParticipantInfo(
        String role,
        String displayName
    ) implements ParticipantAssignmentDto {
        @Override public UUID id() { return null; }
        @Override public UUID conferenceId() { return null; }
        @Override public UUID userId() { return null; }
        @Override public String email() { return null; }
        @Override public String status() { return null; }
    }

    /**
     * Response DTO for assignment audit log entries.
     */
    record AuditLogResponse(
        UUID id,
        UUID conferenceId,
        UUID actorId,
        String action,
        UUID targetUserId,
        String targetEmail,
        Object metadata,
        Instant createdAt
    ) implements ParticipantAssignmentDto {
        @Override public UUID userId() { return null; }
        @Override public String email() { return null; }
        @Override public String role() { return null; }
        @Override public String status() { return null; }
    }
}
