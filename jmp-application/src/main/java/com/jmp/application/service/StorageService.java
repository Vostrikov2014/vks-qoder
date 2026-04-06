package com.jmp.application.service;

import java.time.Duration;

/**
 * Interface for storage operations.
 * Per specification §16.1-16.10
 */
public interface StorageService {

    /**
     * Generate a presigned URL for downloading a recording.
     * Per specification §16.4
     */
    String generatePresignedUrl(String recordingKey, Duration expiration);

    /**
     * Generate a presigned URL for uploading a recording.
     */
    String generateUploadUrl(String recordingKey, Duration expiration);

    /**
     * Delete a recording from storage.
     */
    void deleteRecording(String recordingKey);

    /**
     * Schedule deletion of a recording.
     */
    void scheduleDeletion(String recordingKey);

    /**
     * Archive a recording to cold storage.
     * Per specification §16.6
     */
    void archiveRecording(String recordingKey);

    /**
     * Restore a recording from archive.
     */
    void restoreRecording(String recordingKey);

    /**
     * Get the storage provider type.
     */
    StorageProvider getProvider();

    enum StorageProvider {
        S3,
        AZURE_BLOB,
        GCP_STORAGE,
        MINIO,
        LOCAL
    }
}
