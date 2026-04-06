# AWS S3 Integration

<cite>
**Referenced Files in This Document**
- [S3StorageService.java](file://jmp-infrastructure/src/main/java/com/jmp/infrastructure/storage/S3StorageService.java)
- [StorageService.java](file://jmp-application/src/main/java/com/jmp/application/service/StorageService.java)
- [RecordingService.java](file://jmp-application/src/main/java/com/jmp/application/service/RecordingService.java)
- [RecordingDto.java](file://jmp-application/src/main/java/com/jmp/application/dto/RecordingDto.java)
- [pom.xml (jmp-infrastructure)](file://jmp-infrastructure/pom.xml)
- [application.yml](file://jmp-web/src/main/resources/application.yml)
- [application.properties](file://src/main/resources/application.properties)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Security Considerations](#security-considerations)
9. [Configuration Examples](#configuration-examples)
10. [Troubleshooting Guide](#troubleshooting-guide)
11. [Conclusion](#conclusion)

## Introduction
This document explains the AWS S3 integration within the storage management system. It focuses on the S3StorageService implementation, including bucket configuration, credential setup, and client initialization. It documents presigned URL generation for secure uploads and downloads with configurable expiration times, the S3 client builder pattern, region configuration, and endpoint override for MinIO compatibility. It also covers file operations such as upload, download, delete, and scheduled deletion, and explains how S3 integrates with the broader storage service architecture via a provider abstraction.

## Project Structure
The S3 integration spans two modules:
- Application module: Defines the StorageService interface and higher-level orchestration in RecordingService.
- Infrastructure module: Implements S3-specific storage operations and exposes them as a Spring-managed bean.

```mermaid
graph TB
subgraph "Application Layer"
RS["RecordingService.java"]
SI["StorageService.java"]
DTO["RecordingDto.java"]
end
subgraph "Infrastructure Layer"
S3["S3StorageService.java"]
end
RS --> SI
RS --> DTO
SI --> S3
```

**Diagram sources**
- [RecordingService.java](file://jmp-application/src/main/java/com/jmp/application/service/RecordingService.java)
- [StorageService.java](file://jmp-application/src/main/java/com/jmp/application/service/StorageService.java)
- [RecordingDto.java](file://jmp-application/src/main/java/com/jmp/application/dto/RecordingDto.java)
- [S3StorageService.java](file://jmp-infrastructure/src/main/java/com/jmp/infrastructure/storage/S3StorageService.java)

**Section sources**
- [RecordingService.java](file://jmp-application/src/main/java/com/jmp/application/service/RecordingService.java)
- [StorageService.java](file://jmp-application/src/main/java/com/jmp/application/service/StorageService.java)
- [RecordingDto.java](file://jmp-application/src/main/java/com/jmp/application/dto/RecordingDto.java)
- [S3StorageService.java](file://jmp-infrastructure/src/main/java/com/jmp/infrastructure/storage/S3StorageService.java)

## Core Components
- StorageService interface defines the contract for storage operations, including presigned URL generation for downloads and uploads, deletion, scheduling deletion, archiving, restoring, and provider identification.
- S3StorageService implements StorageService using the AWS SDK v2 S3 client and presigner, supporting region configuration and optional endpoint override for MinIO compatibility.
- RecordingService orchestrates domain workflows and delegates storage operations to StorageService, including generating download URLs and scheduling deletions.

Key capabilities:
- Presigned download URL generation with configurable expiration.
- Presigned upload URL generation with configurable expiration.
- Direct object deletion from S3.
- Scheduled deletion hook for asynchronous cleanup.
- Provider identification for S3/MINIO.

**Section sources**
- [StorageService.java](file://jmp-application/src/main/java/com/jmp/application/service/StorageService.java)
- [S3StorageService.java](file://jmp-infrastructure/src/main/java/com/jmp/infrastructure/storage/S3StorageService.java)
- [RecordingService.java](file://jmp-application/src/main/java/com/jmp/application/service/RecordingService.java)

## Architecture Overview
The storage architecture separates domain logic from infrastructure concerns. RecordingService depends on StorageService, which is implemented by S3StorageService. S3StorageService encapsulates AWS SDK clients and presigner, enabling secure, time-limited access to S3 objects.

```mermaid
classDiagram
class StorageService {
+generatePresignedUrl(recordingKey, expiration) String
+generateUploadUrl(recordingKey, expiration) String
+deleteRecording(recordingKey) void
+scheduleDeletion(recordingKey) void
+archiveRecording(recordingKey) void
+restoreRecording(recordingKey) void
+getProvider() StorageProvider
}
class S3StorageService {
-s3Client
-s3Presigner
-bucketName
+generatePresignedUrl(...)
+generateUploadUrl(...)
+deleteRecording(...)
+scheduleDeletion(...)
+archiveRecording(...)
+restoreRecording(...)
+getProvider()
}
class RecordingService {
+generateDownloadUrl(recordingId, expiration)
+deleteRecording(id)
+processExpiredRecordings()
}
StorageService <|.. S3StorageService
RecordingService --> StorageService : "uses"
```

**Diagram sources**
- [StorageService.java](file://jmp-application/src/main/java/com/jmp/application/service/StorageService.java)
- [S3StorageService.java](file://jmp-infrastructure/src/main/java/com/jmp/infrastructure/storage/S3StorageService.java)
- [RecordingService.java](file://jmp-application/src/main/java/com/jmp/application/service/RecordingService.java)

## Detailed Component Analysis

### S3StorageService Implementation
Responsibilities:
- Initialize S3Client and S3Presigner with region and static credentials.
- Support endpoint override for MinIO or compatible S3 endpoints.
- Generate presigned URLs for downloads and uploads with configurable expiration.
- Delete objects from S3.
- Provide provider identification and placeholder methods for archive/restore.

Configuration inputs:
- Bucket name, region, access key, secret key, and optional endpoint.
- Region defaults to us-east-1 if not provided.
- Endpoint override enables MinIO compatibility.

Presigned URL generation:
- Downloads: Uses GetObjectPresignRequest with signatureDuration.
- Uploads: Uses PutObjectPresignRequest with signatureDuration.

Deletion:
- Deletes the object identified by recordingKey from the configured bucket.

Scheduled deletion:
- Logs the intent and currently deletes immediately; production-grade deployments should integrate with message queues for delayed execution.

Archive/Restore:
- Placeholders for future implementation using S3 lifecycle policies or archive storage classes.

```mermaid
sequenceDiagram
participant RS as "RecordingService"
participant SS as "StorageService (S3StorageService)"
participant Pre as "S3Presigner"
participant S3 as "S3Client"
RS->>SS : generatePresignedUrl(recordingKey, expiration)
SS->>Pre : presignGetObject(GetObjectPresignRequest)
Pre-->>SS : presigned URL
SS-->>RS : URL string
RS->>SS : generateUploadUrl(recordingKey, expiration)
SS->>Pre : presignPutObject(PutObjectPresignRequest)
Pre-->>SS : presigned URL
SS-->>RS : URL string
RS->>SS : deleteRecording(recordingKey)
SS->>S3 : deleteObject(DeleteObjectRequest)
S3-->>SS : success
```

**Diagram sources**
- [RecordingService.java](file://jmp-application/src/main/java/com/jmp/application/service/RecordingService.java)
- [S3StorageService.java](file://jmp-infrastructure/src/main/java/com/jmp/infrastructure/storage/S3StorageService.java)

**Section sources**
- [S3StorageService.java](file://jmp-infrastructure/src/main/java/com/jmp/infrastructure/storage/S3StorageService.java)

### StorageService Interface and Provider Abstraction
The interface defines the contract for storage operations and enumerates supported providers. S3StorageService identifies itself as S3, while the enum includes Azure Blob, GCP Storage, MINIO, and LOCAL, enabling future provider swaps.

```mermaid
classDiagram
class StorageService {
<<interface>>
+generatePresignedUrl(...)
+generateUploadUrl(...)
+deleteRecording(...)
+scheduleDeletion(...)
+archiveRecording(...)
+restoreRecording(...)
+getProvider() StorageProvider
}
class StorageProvider {
<<enumeration>>
S3
AZURE_BLOB
GCP_STORAGE
MINIO
LOCAL
}
StorageService --> StorageProvider : "returns"
```

**Diagram sources**
- [StorageService.java](file://jmp-application/src/main/java/com/jmp/application/service/StorageService.java)

**Section sources**
- [StorageService.java](file://jmp-application/src/main/java/com/jmp/application/service/StorageService.java)

### RecordingService Orchestration
RecordingService coordinates domain workflows and interacts with StorageService:
- Validates recording readiness and retention before generating download URLs.
- Records download events upon successful URL generation.
- Schedules asynchronous deletion of storage objects when recordings are soft-deleted.
- Triggers archival of expired recordings and delegates archive operations to the storage provider.

```mermaid
sequenceDiagram
participant Client as "Client"
participant RS as "RecordingService"
participant SS as "StorageService (S3StorageService)"
Client->>RS : generateDownloadUrl(recordingId, expiration)
RS->>RS : validate status and retention
RS->>SS : generatePresignedUrl(recordingKey, expiration)
SS-->>RS : presigned URL
RS->>RS : record download
RS-->>Client : {downloadUrl, expiresAt}
Client->>RS : deleteRecording(id)
RS->>RS : soft-delete recording
RS->>SS : scheduleDeletion(recordingKey)
SS-->>RS : ack
```

**Diagram sources**
- [RecordingService.java](file://jmp-application/src/main/java/com/jmp/application/service/RecordingService.java)
- [RecordingDto.java](file://jmp-application/src/main/java/com/jmp/application/dto/RecordingDto.java)
- [S3StorageService.java](file://jmp-infrastructure/src/main/java/com/jmp/infrastructure/storage/S3StorageService.java)

**Section sources**
- [RecordingService.java](file://jmp-application/src/main/java/com/jmp/application/service/RecordingService.java)
- [RecordingDto.java](file://jmp-application/src/main/java/com/jmp/application/dto/RecordingDto.java)

## Dependency Analysis
External dependencies:
- AWS SDK v2 S3 artifact is included in the infrastructure module’s build configuration.

Internal dependencies:
- S3StorageService implements StorageService.
- RecordingService depends on StorageService for storage operations.

```mermaid
graph LR
POM["jmp-infrastructure/pom.xml"] --> AWS["software.amazon.awssdk:s3"]
S3Svc["S3StorageService.java"] --> AWS
RecSvc["RecordingService.java"] --> SvcIntf["StorageService.java"]
S3Svc --> SvcIntf
```

**Diagram sources**
- [pom.xml (jmp-infrastructure)](file://jmp-infrastructure/pom.xml)
- [S3StorageService.java](file://jmp-infrastructure/src/main/java/com/jmp/infrastructure/storage/S3StorageService.java)
- [StorageService.java](file://jmp-application/src/main/java/com/jmp/application/service/StorageService.java)
- [RecordingService.java](file://jmp-application/src/main/java/com/jmp/application/service/RecordingService.java)

**Section sources**
- [pom.xml (jmp-infrastructure)](file://jmp-infrastructure/pom.xml)
- [S3StorageService.java](file://jmp-infrastructure/src/main/java/com/jmp/infrastructure/storage/S3StorageService.java)
- [StorageService.java](file://jmp-application/src/main/java/com/jmp/application/service/StorageService.java)
- [RecordingService.java](file://jmp-application/src/main/java/com/jmp/application/service/RecordingService.java)

## Performance Considerations
- Presigned URLs eliminate server bandwidth for large file transfers by delegating directly to S3.
- Using presigner reduces latency compared to server-side proxying.
- For high-throughput scenarios, consider:
  - Optimizing expiration windows to balance security and usability.
  - Leveraging S3 Transfer Acceleration or regional endpoints for improved latency.
  - Implementing asynchronous deletion via message queues to avoid blocking operations.

## Security Considerations
- Credentials are supplied via configuration and used to construct static credentials for the AWS SDK clients. Ensure secrets are managed securely (e.g., environment variables or secret managers).
- Presigned URLs grant time-limited access; keep expiration durations minimal for sensitive content.
- When using MinIO or compatible endpoints, ensure TLS termination and network-level controls are in place.
- Restrict IAM permissions to the minimum required scope for bucket access.

## Configuration Examples
Environment variables and configuration keys used by S3StorageService:
- jmp.storage.s3.bucket: Target S3 bucket name.
- jmp.storage.s3.region: AWS region (defaults to us-east-1 if omitted).
- jmp.storage.s3.access-key: Access key ID.
- jmp.storage.s3.secret-key: Secret access key.
- jmp.storage.s3.endpoint: Optional endpoint URL for MinIO or S3-compatible services.

Example environment variables:
- jmp.storage.s3.bucket=my-recording-bucket
- jmp.storage.s3.region=us-west-2
- jmp.storage.s3.access-key=AKIAIOSFODNN7EXAMPLE
- jmp.storage.s3.secret-key=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
- jmp.storage.s3.endpoint=https://minio.example.com

Notes:
- Region defaults to us-east-1 if not provided.
- Endpoint override enables MinIO compatibility by setting endpointOverride on both S3Client and S3Presigner builders.

**Section sources**
- [S3StorageService.java](file://jmp-infrastructure/src/main/java/com/jmp/infrastructure/storage/S3StorageService.java)

## Troubleshooting Guide
Common S3 connectivity issues and resolutions:
- Invalid credentials or insufficient permissions:
  - Verify access-key and secret-key values and IAM policy grants for the bucket.
- Incorrect region or endpoint:
  - Ensure region matches the bucket’s location.
  - If using MinIO or a self-hosted S3-compatible service, set endpoint to the service URL.
- Bucket does not exist or name mismatch:
  - Confirm bucket name and that the bucket exists in the specified region.
- Presigned URL expiration or signature errors:
  - Validate expiration duration and ensure local time is synchronized.
- Network connectivity or TLS issues:
  - For MinIO, confirm TLS certificate configuration and firewall rules.

Operational checks:
- Confirm S3StorageService is initialized with expected configuration values.
- Review logs for S3-related exceptions during presigning or object deletion.
- For scheduled deletion, ensure asynchronous processing is configured in production environments.

**Section sources**
- [S3StorageService.java](file://jmp-infrastructure/src/main/java/com/jmp/infrastructure/storage/S3StorageService.java)

## Conclusion
The S3 integration provides a clean abstraction layer for storage operations, enabling secure, time-limited access to recordings via presigned URLs and straightforward object lifecycle management. The implementation supports region configuration and endpoint overrides for compatibility with MinIO. By leveraging the StorageService interface, the system remains extensible for alternative storage providers while maintaining consistent behavior across the application.