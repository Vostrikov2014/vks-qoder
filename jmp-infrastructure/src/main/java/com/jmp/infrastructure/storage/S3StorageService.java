package com.jmp.infrastructure.storage;

import com.jmp.application.service.StorageService;
import java.net.URL;
import java.time.Duration;
import java.util.Date;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

/**
 * S3 implementation of StorageService.
 * Per specification §16.1-16.10
 */
@Service
@Profile("!dev")
@Slf4j
public class S3StorageService implements StorageService {

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;
    private final String bucketName;

    public S3StorageService(
            @Value("${jmp.storage.s3.bucket}") String bucketName,
            @Value("${jmp.storage.s3.region:us-east-1}") String region,
            @Value("${jmp.storage.s3.access-key:}") String accessKey,
            @Value("${jmp.storage.s3.secret-key:}") String secretKey,
            @Value("${jmp.storage.s3.endpoint:}") String endpoint) {
        
        this.bucketName = bucketName;

        AwsBasicCredentials credentials = AwsBasicCredentials.create(accessKey, secretKey);

        var s3Builder = S3Client.builder()
            .region(Region.of(region))
            .credentialsProvider(StaticCredentialsProvider.create(credentials));

        var presignerBuilder = S3Presigner.builder()
            .region(Region.of(region))
            .credentialsProvider(StaticCredentialsProvider.create(credentials));

        // Configure for MinIO or other S3-compatible storage
        if (endpoint != null && !endpoint.isEmpty()) {
            s3Builder.endpointOverride(java.net.URI.create(endpoint));
            presignerBuilder.endpointOverride(java.net.URI.create(endpoint));
        }

        this.s3Client = s3Builder.build();
        this.s3Presigner = presignerBuilder.build();
    }

    @Override
    public String generatePresignedUrl(String recordingKey, Duration expiration) {
        log.debug("Generating presigned download URL for: {}", recordingKey);

        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
            .signatureDuration(expiration)
            .getObjectRequest(req -> req.bucket(bucketName).key(recordingKey))
            .build();

        URL presignedUrl = s3Presigner.presignGetObject(presignRequest).url();
        return presignedUrl.toString();
    }

    @Override
    public String generateUploadUrl(String recordingKey, Duration expiration) {
        log.debug("Generating presigned upload URL for: {}", recordingKey);

        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
            .signatureDuration(expiration)
            .putObjectRequest(req -> req.bucket(bucketName).key(recordingKey))
            .build();

        URL presignedUrl = s3Presigner.presignPutObject(presignRequest).url();
        return presignedUrl.toString();
    }

    @Override
    public void deleteRecording(String recordingKey) {
        log.info("Deleting recording from S3: {}", recordingKey);

        DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
            .bucket(bucketName)
            .key(recordingKey)
            .build();

        s3Client.deleteObject(deleteRequest);
    }

    @Override
    public void scheduleDeletion(String recordingKey) {
        // Implement scheduled deletion using S3 lifecycle or delayed queue
        log.info("Scheduled deletion for recording: {}", recordingKey);
        // For now, delete immediately - in production, use SQS/SNS delay
        deleteRecording(recordingKey);
    }

    @Override
    public void archiveRecording(String recordingKey) {
        log.info("Archiving recording to cold storage: {}", recordingKey);
        
        // Copy to Glacier or Glacier Deep Archive
        // This is a placeholder - actual implementation would use S3 lifecycle policies
        // or explicit copy to archive storage class
    }

    @Override
    public void restoreRecording(String recordingKey) {
        log.info("Restoring recording from archive: {}", recordingKey);
        
        // Initiate restore from Glacier
        // This is a placeholder - actual implementation would use S3 restore operations
    }

    @Override
    public StorageProvider getProvider() {
        return StorageProvider.S3;
    }
}
