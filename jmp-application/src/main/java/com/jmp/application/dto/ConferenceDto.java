package com.jmp.application.dto;

import java.time.Instant;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * DTOs for Conference entity.
 * Per specification §10.2, §5.3
 */
public sealed interface ConferenceDto {

    UUID id();
    String roomName();
    String displayName();
    String description();
    String status();
    String type();
    UUID tenantId();
    UUID createdById();
    String createdByName();
    Instant scheduledStartAt();
    Instant scheduledEndAt();
    Instant actualStartedAt();
    Instant actualEndedAt();
    Boolean isRecurring();
    String recurrenceRule();
    Integer maxParticipants();
    Boolean enableLobby();
    Boolean enableRecording();
    Boolean enableLiveStreaming();
    Boolean enableChat();
    Boolean enableScreenSharing();
    Map<String, Object> jitsiOptions();
    Instant createdAt();

    /**
     * Request DTO for creating a conference.
     */
    record CreateRequest(
        @NotBlank @Size(max = 100) String roomName,
        @NotBlank @Size(max = 255) String displayName,
        @Size(max = 2000) String description,
        @NotNull String type,
        Instant scheduledStartAt,
        Instant scheduledEndAt,
        Boolean isRecurring,
        @Size(max = 100) String recurrenceRule,
        Integer maxParticipants,
        Boolean enableLobby,
        Boolean enableRecording,
        Boolean enableLiveStreaming,
        Boolean enableChat,
        Boolean enableScreenSharing,
        Map<String, Object> jitsiOptions
    ) implements ConferenceDto {
        @Override public UUID id() { return null; }
        @Override public String status() { return null; }
        @Override public UUID tenantId() { return null; }
        @Override public UUID createdById() { return null; }
        @Override public String createdByName() { return null; }
        @Override public Instant actualStartedAt() { return null; }
        @Override public Instant actualEndedAt() { return null; }
        @Override public Instant createdAt() { return null; }
    }

    /**
     * Request DTO for updating a conference.
     */
    record UpdateRequest(
        @Size(max = 255) String displayName,
        @Size(max = 2000) String description,
        String type,
        Instant scheduledStartAt,
        Instant scheduledEndAt,
        Integer maxParticipants,
        Boolean enableLobby,
        Boolean enableRecording,
        Boolean enableLiveStreaming,
        Boolean enableChat,
        Boolean enableScreenSharing,
        Map<String, Object> jitsiOptions
    ) implements ConferenceDto {
        @Override public UUID id() { return null; }
        @Override public String roomName() { return null; }
        @Override public String status() { return null; }
        @Override public UUID tenantId() { return null; }
        @Override public UUID createdById() { return null; }
        @Override public String createdByName() { return null; }
        @Override public Boolean isRecurring() { return null; }
        @Override public String recurrenceRule() { return null; }
        @Override public Instant actualStartedAt() { return null; }
        @Override public Instant actualEndedAt() { return null; }
        @Override public Instant createdAt() { return null; }
    }

    /**
     * Response DTO for conference data.
     */
    record Response(
        UUID id,
        String roomName,
        String displayName,
        String description,
        String status,
        String type,
        UUID tenantId,
        UUID createdById,
        String createdByName,
        Instant scheduledStartAt,
        Instant scheduledEndAt,
        Instant actualStartedAt,
        Instant actualEndedAt,
        Boolean isRecurring,
        String recurrenceRule,
        Integer maxParticipants,
        Boolean enableLobby,
        Boolean enableRecording,
        Boolean enableLiveStreaming,
        Boolean enableChat,
        Boolean enableScreenSharing,
        Map<String, Object> jitsiOptions,
        Integer currentParticipants,
        Instant createdAt
    ) implements ConferenceDto {}

    /**
     * Summary response DTO for list views.
     */
    record Summary(
        UUID id,
        String roomName,
        String displayName,
        String status,
        String type,
        Instant scheduledStartAt,
        Instant scheduledEndAt,
        Integer currentParticipants,
        Integer maxParticipants
    ) implements ConferenceDto {
        @Override public String description() { return null; }
        @Override public UUID tenantId() { return null; }
        @Override public UUID createdById() { return null; }
        @Override public String createdByName() { return null; }
        @Override public Instant actualStartedAt() { return null; }
        @Override public Instant actualEndedAt() { return null; }
        @Override public Boolean isRecurring() { return null; }
        @Override public String recurrenceRule() { return null; }
        @Override public Boolean enableLobby() { return null; }
        @Override public Boolean enableRecording() { return null; }
        @Override public Boolean enableLiveStreaming() { return null; }
        @Override public Boolean enableChat() { return null; }
        @Override public Boolean enableScreenSharing() { return null; }
        @Override public Map<String, Object> jitsiOptions() { return null; }
        @Override public Instant createdAt() { return null; }
    }

    /**
     * DTO for JWT token generation request.
     */
    record TokenRequest(
        @NotNull UUID conferenceId,
        @NotBlank String displayName,
        Boolean isModerator,
        Set<String> features
    ) {}

    /**
     * DTO for JWT token response.
     */
    record TokenResponse(
        String token,
        String roomUrl,
        Instant expiresAt
    ) {}
}
