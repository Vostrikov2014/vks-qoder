package com.jmp.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * DTOs for Recording entity.
 * Per specification §16.1-16.10
 */
public sealed interface RecordingDto {

    UUID id();
    String recordingKey();
    String originalFilename();
    String status();
    String recordingType();
    UUID conferenceId();
    String conferenceName();
    UUID tenantId();
    Instant startedAt();
    Instant endedAt();
    Long durationSeconds();
    Long fileSizeBytes();
    String fileHashSha256();
    String mimeType();
    Integer resolutionWidth();
    Integer resolutionHeight();
    String thumbnailKey();
    Map<String, Object> metadata();
    Instant retentionUntil();
    Boolean isEncrypted();
    Integer downloadCount();
    Instant createdAt();

    /**
     * Request DTO for creating a recording entry.
     */
    record CreateRequest(
        @NotNull UUID conferenceId,
        @NotBlank String recordingKey,
        String originalFilename,
        String recordingType,
        Long fileSizeBytes,
        String mimeType,
        Map<String, Object> metadata
    ) implements RecordingDto {
        @Override public UUID id() { return null; }
        @Override public String status() { return null; }
        @Override public String conferenceName() { return null; }
        @Override public UUID tenantId() { return null; }
        @Override public Instant startedAt() { return null; }
        @Override public Instant endedAt() { return null; }
        @Override public Long durationSeconds() { return null; }
        @Override public String fileHashSha256() { return null; }
        @Override public Integer resolutionWidth() { return null; }
        @Override public Integer resolutionHeight() { return null; }
        @Override public String thumbnailKey() { return null; }
        @Override public Instant retentionUntil() { return null; }
        @Override public Boolean isEncrypted() { return null; }
        @Override public Integer downloadCount() { return null; }
        @Override public Instant createdAt() { return null; }
    }

    /**
     * Request DTO for updating recording metadata.
     */
    record UpdateRequest(
        Map<String, Object> metadata,
        Instant retentionUntil
    ) implements RecordingDto {
        @Override public UUID id() { return null; }
        @Override public String recordingKey() { return null; }
        @Override public String originalFilename() { return null; }
        @Override public String status() { return null; }
        @Override public String recordingType() { return null; }
        @Override public UUID conferenceId() { return null; }
        @Override public String conferenceName() { return null; }
        @Override public UUID tenantId() { return null; }
        @Override public Instant startedAt() { return null; }
        @Override public Instant endedAt() { return null; }
        @Override public Long durationSeconds() { return null; }
        @Override public Long fileSizeBytes() { return null; }
        @Override public String fileHashSha256() { return null; }
        @Override public String mimeType() { return null; }
        @Override public Integer resolutionWidth() { return null; }
        @Override public Integer resolutionHeight() { return null; }
        @Override public String thumbnailKey() { return null; }
        @Override public Boolean isEncrypted() { return null; }
        @Override public Integer downloadCount() { return null; }
        @Override public Instant createdAt() { return null; }
    }

    /**
     * Response DTO for recording data.
     */
    record Response(
        UUID id,
        String recordingKey,
        String originalFilename,
        String status,
        String recordingType,
        UUID conferenceId,
        String conferenceName,
        UUID tenantId,
        Instant startedAt,
        Instant endedAt,
        Long durationSeconds,
        Long fileSizeBytes,
        String fileHashSha256,
        String mimeType,
        Integer resolutionWidth,
        Integer resolutionHeight,
        String thumbnailKey,
        Map<String, Object> metadata,
        Instant retentionUntil,
        Boolean isEncrypted,
        Integer downloadCount,
        Instant createdAt
    ) implements RecordingDto {}

    /**
     * Summary response DTO for list views.
     */
    record Summary(
        UUID id,
        String originalFilename,
        String status,
        String recordingType,
        String conferenceName,
        Long durationSeconds,
        Long fileSizeBytes,
        Instant createdAt
    ) implements RecordingDto {
        @Override public String recordingKey() { return null; }
        @Override public UUID conferenceId() { return null; }
        @Override public UUID tenantId() { return null; }
        @Override public Instant startedAt() { return null; }
        @Override public Instant endedAt() { return null; }
        @Override public String fileHashSha256() { return null; }
        @Override public String mimeType() { return null; }
        @Override public Integer resolutionWidth() { return null; }
        @Override public Integer resolutionHeight() { return null; }
        @Override public String thumbnailKey() { return null; }
        @Override public Map<String, Object> metadata() { return null; }
        @Override public Instant retentionUntil() { return null; }
        @Override public Boolean isEncrypted() { return null; }
        @Override public Integer downloadCount() { return null; }
    }

    /**
     * DTO for presigned download URL response.
     */
    record DownloadUrlResponse(
        String downloadUrl,
        Instant expiresAt
    ) {}

    /**
     * DTO for storage statistics.
     */
    record StorageStats(
        Long totalStorageBytes,
        Long totalRecordings,
        Long recordingsThisMonth
    ) {}
}
