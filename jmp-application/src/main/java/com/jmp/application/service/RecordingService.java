package com.jmp.application.service;

import com.jmp.application.dto.RecordingDto;
import com.jmp.domain.entity.Conference;
import com.jmp.domain.entity.Recording;
import com.jmp.domain.repository.ConferenceRepository;
import com.jmp.domain.repository.RecordingRepository;
import com.jmp.domain.repository.TenantRepository;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for recording management operations.
 * Per specification §5.6, §16.1-16.10
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class RecordingService {

    private final RecordingRepository recordingRepository;
    private final ConferenceRepository conferenceRepository;
    private final TenantRepository tenantRepository;
    private final StorageService storageService;

    /**
     * Create a new recording entry.
     * Called when Jibri starts recording.
     */
    @Transactional
    public RecordingDto.Response createRecording(RecordingDto.CreateRequest request) {
        log.info("Creating recording entry for conference: {}", request.conferenceId());

        Conference conference = conferenceRepository.findById(request.conferenceId())
            .orElseThrow(() -> new IllegalArgumentException("Conference not found: " + request.conferenceId()));

        Recording recording = new Recording();
        recording.setConference(conference);
        recording.setTenant(conference.getTenant());
        recording.setRecordingKey(request.recordingKey());
        recording.setOriginalFilename(request.originalFilename());
        recording.setRecordingType(Recording.RecordingType.valueOf(request.recordingType()));
        recording.setFileSizeBytes(request.fileSizeBytes());
        recording.setMimeType(request.mimeType());
        recording.setStatus(Recording.RecordingStatus.PENDING);
        recording.setStartedAt(Instant.now());
        recording.setIsEncrypted(true);
        
        // Set retention period (default 90 days)
        recording.setRetentionUntil(Instant.now().plus(90, ChronoUnit.DAYS));
        
        if (request.metadata() != null) {
            recording.setMetadata(request.metadata());
        }

        Recording saved = recordingRepository.save(recording);
        log.info("Recording created with ID: {}", saved.getId());

        return toResponse(saved);
    }

    /**
     * Mark recording as ready after processing.
     */
    @Transactional
    public RecordingDto.Response markRecordingReady(UUID recordingId, 
                                                     Long fileSizeBytes,
                                                     String fileHashSha256,
                                                     Map<String, Object> metadata) {
        log.info("Marking recording as ready: {}", recordingId);

        Recording recording = recordingRepository.findById(recordingId)
            .orElseThrow(() -> new IllegalArgumentException("Recording not found: " + recordingId));

        recording.setStatus(Recording.RecordingStatus.READY);
        recording.setEndedAt(Instant.now());
        recording.setFileSizeBytes(fileSizeBytes);
        recording.setFileHashSha256(fileHashSha256);
        recording.calculateDuration();
        
        if (metadata != null) {
            recording.getMetadata().putAll(metadata);
        }

        Recording updated = recordingRepository.save(recording);
        log.info("Recording marked as ready: {}", recordingId);

        return toResponse(updated);
    }

    /**
     * Get recording by ID.
     */
    public RecordingDto.Response getRecording(UUID id) {
        Recording recording = recordingRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Recording not found: " + id));
        return toResponse(recording);
    }

    /**
     * List recordings for a tenant.
     */
    public Page<RecordingDto.Summary> listRecordings(UUID tenantId, Pageable pageable) {
        return recordingRepository.findByTenantIdAndDeletedAtIsNull(tenantId, pageable)
            .map(this::toSummary);
    }

    /**
     * Search recordings within a tenant.
     */
    public Page<RecordingDto.Summary> searchRecordings(UUID tenantId, String search, Pageable pageable) {
        return recordingRepository.searchByTenantId(tenantId, search, pageable)
            .map(this::toSummary);
    }

    /**
     * Get recordings for a conference.
     */
    public List<RecordingDto.Summary> getConferenceRecordings(UUID conferenceId) {
        return recordingRepository.findByConferenceIdAndDeletedAtIsNull(conferenceId).stream()
            .map(this::toSummary)
            .toList();
    }

    /**
     * Generate presigned download URL.
     * Per specification §16.4
     */
    @Transactional
    public RecordingDto.DownloadUrlResponse generateDownloadUrl(UUID recordingId, Duration expiration) {
        Recording recording = recordingRepository.findById(recordingId)
            .orElseThrow(() -> new IllegalArgumentException("Recording not found: " + recordingId));

        if (recording.getStatus() != Recording.RecordingStatus.READY) {
            throw new IllegalStateException("Recording is not ready for download");
        }

        if (!recording.isWithinRetention()) {
            throw new IllegalStateException("Recording has exceeded retention period");
        }

        // Generate presigned URL from storage service
        String downloadUrl = storageService.generatePresignedUrl(
            recording.getRecordingKey(),
            expiration
        );

        // Record download
        recording.recordDownload();
        recordingRepository.save(recording);

        log.info("Generated download URL for recording: {}", recordingId);

        return new RecordingDto.DownloadUrlResponse(
            downloadUrl,
            Instant.now().plus(expiration)
        );
    }

    /**
     * Update recording metadata.
     */
    @Transactional
    public RecordingDto.Response updateRecording(UUID id, RecordingDto.UpdateRequest request) {
        log.info("Updating recording: {}", id);

        Recording recording = recordingRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Recording not found: " + id));

        if (request.metadata() != null) {
            recording.getMetadata().putAll(request.metadata());
        }
        
        if (request.retentionUntil() != null) {
            recording.setRetentionUntil(request.retentionUntil());
        }

        Recording updated = recordingRepository.save(recording);
        return toResponse(updated);
    }

    /**
     * Soft delete recording.
     */
    @Transactional
    public void deleteRecording(UUID id) {
        log.info("Deleting recording: {}", id);

        Recording recording = recordingRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Recording not found: " + id));

        recording.setDeletedAt(Instant.now());
        recording.setStatus(Recording.RecordingStatus.DELETED);
        recordingRepository.save(recording);

        // Schedule async deletion from storage
        storageService.scheduleDeletion(recording.getRecordingKey());

        log.info("Recording soft deleted: {}", id);
    }

    /**
     * Get storage statistics for a tenant.
     */
    public RecordingDto.StorageStats getStorageStats(UUID tenantId) {
        Long totalStorage = recordingRepository.calculateTotalStorageUsed(tenantId);
        Long totalRecordings = recordingRepository.countByTenantIdAndStatusAndDeletedAtIsNull(
            tenantId, Recording.RecordingStatus.READY
        );

        // Calculate recordings this month
        Instant startOfMonth = Instant.now().truncatedTo(ChronoUnit.DAYS)
            .atZone(java.time.ZoneId.systemDefault())
            .withDayOfMonth(1)
            .toInstant();

        return new RecordingDto.StorageStats(
            totalStorage != null ? totalStorage : 0L,
            totalRecordings,
            0L // TODO: Implement count by date range
        );
    }

    /**
     * Process expired recordings (called by scheduled job).
     */
    @Transactional
    public void processExpiredRecordings() {
        List<Recording> expired = recordingRepository.findExpiredRecordings(Instant.now());
        
        for (Recording recording : expired) {
            try {
                log.info("Archiving expired recording: {}", recording.getId());
                
                // Move to cold storage or mark as archived
                recording.setStatus(Recording.RecordingStatus.ARCHIVED);
                recordingRepository.save(recording);
                
                // Archive in storage service
                storageService.archiveRecording(recording.getRecordingKey());
                
            } catch (Exception e) {
                log.error("Failed to archive recording: {}", recording.getId(), e);
            }
        }
    }

    /**
     * Handle Jibri recording status webhook.
     */
    @Transactional
    public void handleJibriStatus(String conferenceId, String status, Map<String, Object> data) {
        log.info("Received Jibri status for conference {}: {}", conferenceId, status);

        switch (status.toUpperCase()) {
            case "ON" -> {
                // Recording started
                log.info("Recording started for conference: {}", conferenceId);
            }
            case "OFF" -> {
                // Recording stopped - process the file
                String filePath = (String) data.get("path");
                if (filePath != null) {
                    processCompletedRecording(conferenceId, filePath, data);
                }
            }
            case "FAILED" -> {
                log.error("Recording failed for conference: {}", conferenceId);
                // Update any pending recordings to failed status
            }
        }
    }

    private void processCompletedRecording(String conferenceId, String filePath, Map<String, Object> data) {
        // Find the conference and create/update recording entry
        // This would be called by the webhook controller
        log.info("Processing completed recording: {} for conference: {}", filePath, conferenceId);
    }

    private RecordingDto.Response toResponse(Recording recording) {
        return new RecordingDto.Response(
            recording.getId(),
            recording.getRecordingKey(),
            recording.getOriginalFilename(),
            recording.getStatus().name(),
            recording.getRecordingType().name(),
            recording.getConference().getId(),
            recording.getConference().getDisplayName(),
            recording.getTenant().getId(),
            recording.getStartedAt(),
            recording.getEndedAt(),
            recording.getDurationSeconds(),
            recording.getFileSizeBytes(),
            recording.getFileHashSha256(),
            recording.getMimeType(),
            recording.getResolutionWidth(),
            recording.getResolutionHeight(),
            recording.getThumbnailKey(),
            recording.getMetadata(),
            recording.getRetentionUntil(),
            recording.getIsEncrypted(),
            recording.getDownloadCount(),
            recording.getCreatedAt()
        );
    }

    private RecordingDto.Summary toSummary(Recording recording) {
        return new RecordingDto.Summary(
            recording.getId(),
            recording.getOriginalFilename(),
            recording.getStatus().name(),
            recording.getRecordingType().name(),
            recording.getConference().getDisplayName(),
            recording.getDurationSeconds(),
            recording.getFileSizeBytes(),
            recording.getCreatedAt()
        );
    }
}
