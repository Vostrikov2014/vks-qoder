package com.jmp.domain.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

/**
 * Recording entity for conference recordings.
 * Per specification §5.6, §16.1-16.10
 */
@Entity
@Table(name = "recordings", schema = "jmp")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
public class Recording {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conference_id", nullable = false)
    private Conference conference;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @Size(max = 255)
    @Column(name = "recording_key", nullable = false, unique = true, length = 255)
    private String recordingKey; // S3 key or storage path

    @Size(max = 255)
    @Column(name = "original_filename", length = 255)
    private String originalFilename;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private RecordingStatus status = RecordingStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "recording_type", nullable = false, length = 20)
    private RecordingType recordingType = RecordingType.VIDEO;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "ended_at")
    private Instant endedAt;

    @Column(name = "duration_seconds")
    private Long durationSeconds;

    @Column(name = "file_size_bytes")
    private Long fileSizeBytes;

    @Size(max = 64)
    @Column(name = "file_hash_sha256", length = 64)
    private String fileHashSha256;

    @Size(max = 50)
    @Column(name = "mime_type", length = 50)
    private String mimeType;

    @Column(name = "resolution_width")
    private Integer resolutionWidth;

    @Column(name = "resolution_height")
    private Integer resolutionHeight;

    @Size(max = 255)
    @Column(name = "thumbnail_key", length = 255)
    private String thumbnailKey;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "transcription", columnDefinition = "jsonb")
    private Map<String, Object> transcription = new HashMap<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata", columnDefinition = "jsonb")
    private Map<String, Object> metadata = new HashMap<>();

    @Column(name = "retention_until")
    private Instant retentionUntil;

    @Column(name = "is_encrypted")
    private Boolean isEncrypted = true;

    @Size(max = 100)
    @Column(name = "encryption_key_id", length = 100)
    private String encryptionKeyId;

    @Column(name = "download_count")
    private Integer downloadCount = 0;

    @Column(name = "last_downloaded_at")
    private Instant lastDownloadedAt;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    /**
     * Calculate duration from start and end times.
     */
    public void calculateDuration() {
        if (startedAt != null && endedAt != null) {
            this.durationSeconds = Duration.between(startedAt, endedAt).getSeconds();
        }
    }

    /**
     * Mark recording as ready for viewing.
     */
    public void markReady() {
        this.status = RecordingStatus.READY;
        calculateDuration();
    }

    /**
     * Increment download count.
     */
    public void recordDownload() {
        this.downloadCount = (this.downloadCount == null ? 0 : this.downloadCount) + 1;
        this.lastDownloadedAt = Instant.now();
    }

    /**
     * Check if recording is within retention period.
     */
    public boolean isWithinRetention() {
        if (retentionUntil == null) {
            return true;
        }
        return Instant.now().isBefore(retentionUntil);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Recording recording = (Recording) o;
        return Objects.equals(id, recording.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "Recording{" +
            "id=" + id +
            ", recordingKey='" + recordingKey + '\'' +
            ", status=" + status +
            ", durationSeconds=" + durationSeconds +
            '}';
    }

    public enum RecordingStatus {
        PENDING,        // Recording initiated
        PROCESSING,     // Being processed/transcoded
        READY,          // Available for viewing
        FAILED,         // Recording failed
        ARCHIVED,       // Moved to cold storage
        DELETED         // Soft deleted
    }

    public enum RecordingType {
        VIDEO,
        AUDIO,
        TRANSCRIPT,
        SCREEN_SHARE,
        CHAT_LOG
    }
}
