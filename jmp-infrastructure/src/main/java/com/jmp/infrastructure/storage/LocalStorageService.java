package com.jmp.infrastructure.storage;

import com.jmp.application.service.StorageService;
import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

/**
 * Local in-memory implementation of StorageService for dev profile.
 * Per specification §16.1-16.10
 */
@Service
@Profile("dev")
@Slf4j
public class LocalStorageService implements StorageService {

    private final Map<String, String> storage = new HashMap<>();

    @Override
    public String generatePresignedUrl(String recordingKey, Duration expiration) {
        log.debug("Generating presigned URL for: {}", recordingKey);
        return "http://localhost:8080/api/v1/recordings/download/" + recordingKey + "?token=" + UUID.randomUUID();
    }

    @Override
    public String generateUploadUrl(String recordingKey, Duration expiration) {
        log.debug("Generating upload URL for: {}", recordingKey);
        return "http://localhost:8080/api/v1/recordings/upload/" + recordingKey + "?token=" + UUID.randomUUID();
    }

    @Override
    public void deleteRecording(String recordingKey) {
        log.info("Deleting recording: {}", recordingKey);
        storage.remove(recordingKey);
    }

    @Override
    public void scheduleDeletion(String recordingKey) {
        log.info("Scheduled deletion for recording: {}", recordingKey);
        storage.remove(recordingKey);
    }

    @Override
    public void archiveRecording(String recordingKey) {
        log.info("Archiving recording: {}", recordingKey);
    }

    @Override
    public void restoreRecording(String recordingKey) {
        log.info("Restoring recording: {}", recordingKey);
    }

    @Override
    public StorageProvider getProvider() {
        return StorageProvider.LOCAL;
    }
}
