# DTO Patterns and Data Transfer

<cite>
**Referenced Files in This Document**
- [UserDto.java](file://jmp-application/src/main/java/com/jmp/application/dto/UserDto.java)
- [ConferenceDto.java](file://jmp-application/src/main/java/com/jmp/application/dto/ConferenceDto.java)
- [RecordingDto.java](file://jmp-application/src/main/java/com/jmp/application/dto/RecordingDto.java)
- [UserMapper.java](file://jmp-application/src/main/java/com/jmp/application/mapper/UserMapper.java)
- [ConferenceMapper.java](file://jmp-application/src/main/java/com/jmp/application/mapper/ConferenceMapper.java)
- [User.java](file://jmp-domain/src/main/java/com/jmp/domain/entity/User.java)
- [Conference.java](file://jmp-domain/src/main/java/com/jmp/domain/entity/Conference.java)
- [Recording.java](file://jmp-domain/src/main/java/com/jmp/domain/entity/Recording.java)
- [UserService.java](file://jmp-application/src/main/java/com/jmp/application/service/UserService.java)
- [ConferenceService.java](file://jmp-application/src/main/java/com/jmp/application/service/ConferenceService.java)
- [RecordingService.java](file://jmp-application/src/main/java/com/jmp/application/service/RecordingService.java)
- [UserController.java](file://jmp-api/src/main/java/com/jmp/api/controller/UserController.java)
- [ConferenceController.java](file://jmp-api/src/main/java/com/jmp/api/controller/ConferenceController.java)
- [RecordingController.java](file://jmp-api/src/main/java/com/jmp/api/controller/RecordingController.java)
</cite>

## Update Summary
**Changes Made**
- Enhanced ConferenceDto with new `type` field across CreateRequest, UpdateRequest, and Response record types
- Updated ConferenceDto Analysis section to document the new type field handling
- Added validation and mapping details for the type field in ConferenceService
- Updated architecture diagrams to reflect the new type field in all DTO records
- Enhanced examples to demonstrate type field usage in API operations

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)

## Introduction
This document explains the Data Transfer Object (DTO) patterns used across the application layer. It focuses on three primary DTO interfaces: UserDto for user-related data, ConferenceDto for conference information, and RecordingDto for recording metadata. The document covers design principles, validation annotations, serialization patterns, and the relationship between DTOs and domain entities. It also documents usage in API responses, service method parameters, and data transformation scenarios, along with versioning, backward compatibility, and performance considerations for large datasets.

**Updated** The ConferenceDto now includes a comprehensive type field system that distinguishes between different conference types (SCHEDULED vs PERMANENT), enhancing type safety and validation throughout the data transfer layers.

## Project Structure
DTOs live in the application module under the dto package. They are accompanied by MapStruct mappers that convert between domain entities and DTOs. Controllers expose DTOs in API responses and accept them as request bodies. Services orchestrate business logic and perform conversions via mappers.

```mermaid
graph TB
subgraph "API Layer"
UC["UserController"]
CC["ConferenceController"]
RC["RecordingController"]
end
subgraph "Application Layer"
UDS["UserDto"]
CDS["ConferenceDto"]
RDS["RecordingDto"]
UM["UserMapper"]
CM["ConferenceMapper"]
US["UserService"]
CS["ConferenceService"]
RS["RecordingService"]
end
subgraph "Domain Layer"
UE["User"]
CE["Conference"]
RE["Recording"]
end
UC --> US
CC --> CS
RC --> RS
US --> UM
CS --> CM
UM --> UE
CM --> CE
RS --> RE
```

**Diagram sources**
- [UserController.java:33-123](file://jmp-api/src/main/java/com/jmp/api/controller/UserController.java#L33-L123)
- [ConferenceController.java:37-189](file://jmp-api/src/main/java/com/jmp/api/controller/ConferenceController.java#L37-L189)
- [RecordingController.java:35-138](file://jmp-api/src/main/java/com/jmp/api/controller/RecordingController.java#L35-L138)
- [UserDto.java:14-96](file://jmp-application/src/main/java/com/jmp/application/dto/UserDto.java#L14-L96)
- [ConferenceDto.java:15-182](file://jmp-application/src/main/java/com/jmp/application/dto/ConferenceDto.java#L15-L182)
- [RecordingDto.java:13-170](file://jmp-application/src/main/java/com/jmp/application/dto/RecordingDto.java#L13-L170)
- [UserMapper.java:18-76](file://jmp-application/src/main/java/com/jmp/application/mapper/UserMapper.java#L18-L76)
- [ConferenceMapper.java:15-77](file://jmp-application/src/main/java/com/jmp/application/mapper/ConferenceMapper.java#L15-L77)
- [UserService.java:28-190](file://jmp-application/src/main/java/com/jmp/application/service/UserService.java#L28-L190)
- [ConferenceService.java:25-255](file://jmp-application/src/main/java/com/jmp/application/service/ConferenceService.java#L25-L255)
- [RecordingService.java:27-332](file://jmp-application/src/main/java/com/jmp/application/service/RecordingService.java#L27-L332)
- [User.java:23-164](file://jmp-domain/src/main/java/com/jmp/domain/entity/User.java#L23-L164)
- [Conference.java:25-245](file://jmp-domain/src/main/java/com/jmp/domain/entity/Conference.java#L25-L245)
- [Recording.java:24-203](file://jmp-domain/src/main/java/com/jmp/domain/entity/Recording.java#L24-L203)

**Section sources**
- [UserDto.java:14-96](file://jmp-application/src/main/java/com/jmp/application/dto/UserDto.java#L14-L96)
- [ConferenceDto.java:15-182](file://jmp-application/src/main/java/com/jmp/application/dto/ConferenceDto.java#L15-L182)
- [RecordingDto.java:13-170](file://jmp-application/src/main/java/com/jmp/application/dto/RecordingDto.java#L13-L170)

## Core Components
- UserDto: Sealed interface with nested records for CreateRequest, UpdateRequest, Response, and Summary. Validation annotations define field constraints. Roles are represented as a set of strings in DTOs but mapped to entity roles via UserMapper.
- ConferenceDto: Sealed interface with nested records for CreateRequest, UpdateRequest, Response, Summary, TokenRequest, and TokenResponse. **Enhanced** with a comprehensive type field system that distinguishes between SCHEDULED and PERMANENT conference types. Includes scheduling, lobby, recording, and Jitsi options fields. Mapped to Conference entity via ConferenceMapper.
- RecordingDto: Sealed interface with nested records for CreateRequest, UpdateRequest, Response, Summary, DownloadUrlResponse, and StorageStats. Handles metadata, retention, encryption, and download counts. Mapped to Recording entity via service-level transformations.

Validation annotations:
- NotBlank, NotNull, Size, Email, and others constrain request payloads at the API boundary.

Serialization patterns:
- DTOs are serializable POJO-like structures suitable for JSON APIs. Records provide immutable, concise data carriers.

**Updated** The ConferenceDto now enforces type validation through the `@NotNull` annotation on the type field in CreateRequest and through ConferenceService validation logic that ensures proper type handling during creation and updates.

**Section sources**
- [UserDto.java:14-96](file://jmp-application/src/main/java/com/jmp/application/dto/UserDto.java#L14-L96)
- [ConferenceDto.java:15-182](file://jmp-application/src/main/java/com/jmp/application/dto/ConferenceDto.java#L15-L182)
- [RecordingDto.java:13-170](file://jmp-application/src/main/java/com/jmp/application/dto/RecordingDto.java#L13-L170)

## Architecture Overview
The application follows clean architecture with DTOs decoupling API controllers from domain entities. Controllers receive DTOs as request bodies and return DTOs as responses. Services encapsulate business logic and coordinate with repositories. Mappers transform between DTOs and entities.

```mermaid
sequenceDiagram
participant Client as "Client"
participant Controller as "ConferenceController"
participant Service as "ConferenceService"
participant Mapper as "ConferenceMapper"
participant Entity as "Conference"
Client->>Controller : POST /api/v1/conferences (ConferenceDto.CreateRequest with type)
Controller->>Service : createConference(tenantId, userId, request)
Service->>Service : validate type field (SCHEDULED vs PERMANENT)
Service->>Mapper : toEntity(request)
Mapper-->>Service : Conference
Service->>Service : set status, assign tenant/user
Service->>Entity : save(Conference)
Entity-->>Service : persisted Conference
Service->>Mapper : toResponse(Conference)
Mapper-->>Service : ConferenceDto.Response (with type)
Service-->>Controller : ConferenceDto.Response
Controller-->>Client : 201 Created + Response
```

**Diagram sources**
- [ConferenceController.java:52-66](file://jmp-api/src/main/java/com/jmp/api/controller/ConferenceController.java#L52-L66)
- [ConferenceService.java:40-78](file://jmp-application/src/main/java/com/jmp/application/service/ConferenceService.java#L40-L78)
- [ConferenceMapper.java:31-47](file://jmp-application/src/main/java/com/jmp/application/mapper/ConferenceMapper.java#L31-L47)
- [Conference.java:76-83](file://jmp-domain/src/main/java/com/jmp/domain/entity/Conference.java#L76-L83)

## Detailed Component Analysis

### UserDto Analysis
UserDto defines a sealed interface with four nested records:
- CreateRequest: Validates email, name lengths, and password strength; includes optional role names.
- UpdateRequest: Allows partial updates to name and roles.
- Response: Full user data for detailed views.
- Summary: Lightweight summary for list views.

Validation annotations:
- Email, NotBlank, Size, and others ensure input correctness.

Conversion strategy:
- UserMapper maps User entity to UserDto.Response and Summary, converting roles to strings and extracting tenant IDs. It ignores sensitive or derived fields during entity creation/update.

Usage examples:
- Controllers accept UserDto.CreateRequest and UserDto.UpdateRequest as request bodies.
- Services return UserDto.Response and Page<UserDto.Summary>.

```mermaid
classDiagram
class UserDto {
<<sealed interface>>
+id() UUID
+email() String
+firstName() String
+lastName() String
+status() String
+emailVerified() Boolean
+lastLoginAt() Instant
+roles() Set~String~
+tenantId() UUID
+createdAt() Instant
}
class CreateRequest
class UpdateRequest
class Response
class Summary
UserDto <|.. CreateRequest
UserDto <|.. UpdateRequest
UserDto <|.. Response
UserDto <|.. Summary
```

**Diagram sources**
- [UserDto.java:14-96](file://jmp-application/src/main/java/com/jmp/application/dto/UserDto.java#L14-L96)

**Section sources**
- [UserDto.java:14-96](file://jmp-application/src/main/java/com/jmp/application/dto/UserDto.java#L14-L96)
- [UserMapper.java:18-76](file://jmp-application/src/main/java/com/jmp/application/mapper/UserMapper.java#L18-L76)
- [UserController.java:43-92](file://jmp-api/src/main/java/com/jmp/api/controller/UserController.java#L43-L92)
- [UserService.java:44-129](file://jmp-application/src/main/java/com/jmp/application/service/UserService.java#L44-L129)

### ConferenceDto Analysis
ConferenceDto defines nested records for conference operations with enhanced type field support:
- CreateRequest: Room name, display name, scheduling, recurring options, participant limits, and feature flags. **Enhanced** with mandatory type field validation.
- UpdateRequest: Partial updates to scheduling and features. **Enhanced** with optional type field for type changes.
- Response: Full conference data including computed current participants and creator details. **Enhanced** with type field in response.
- Summary: List-friendly subset. **Enhanced** with type field for list views.
- TokenRequest/TokenResponse: JWT generation for Jitsi integration.

**Enhanced** The type field is now consistently present across all ConferenceDto records:
- CreateRequest: `@NotNull String type` with validation
- UpdateRequest: `String type` (optional, allows type changes)
- Response: `String type` (always present)
- Summary: `String type` (always present)

Type validation and business logic:
- ConferenceService validates conference types against Conference.ConferenceType enum values
- SCHEDULED conferences require scheduledStartAt when type is SCHEDULED
- Type changes are validated to ensure they're valid ConferenceType values

Conversion strategy:
- ConferenceMapper maps Conference entity to Response and Summary, extracting tenant and creator IDs and computing current participants via entity methods. The type field is mapped from the entity's ConferenceType enum to string representation. It ignores internal fields during creation/update.

Usage examples:
- Controllers accept ConferenceDto.CreateRequest and UpdateRequest with type fields.
- Services return Response and Summary with type information, and generate TokenResponse for JWT issuance.

```mermaid
classDiagram
class ConferenceDto {
<<sealed interface>>
+id() UUID
+roomName() String
+displayName() String
+description() String
+status() String
+type() String
+tenantId() UUID
+createdById() UUID
+createdByName() String
+scheduledStartAt() Instant
+scheduledEndAt() Instant
+actualStartedAt() Instant
+actualEndedAt() Instant
+isRecurring() Boolean
+recurrenceRule() String
+maxParticipants() Integer
+enableLobby() Boolean
+enableRecording() Boolean
+enableLiveStreaming() Boolean
+enableChat() Boolean
+enableScreenSharing() Boolean
+jitsiOptions() Map~String,Object~
+createdAt() Instant
}
class CreateRequest {
+@NotNull String type
}
class UpdateRequest {
+String type
}
class Response {
+String type
+Integer currentParticipants
}
class Summary {
+String type
+Integer currentParticipants
}
class TokenRequest
class TokenResponse
ConferenceDto <|.. CreateRequest
ConferenceDto <|.. UpdateRequest
ConferenceDto <|.. Response
ConferenceDto <|.. Summary
ConferenceDto <|.. TokenRequest
ConferenceDto <|.. TokenResponse
```

**Diagram sources**
- [ConferenceDto.java:16-181](file://jmp-application/src/main/java/com/jmp/application/dto/ConferenceDto.java#L16-L181)

**Section sources**
- [ConferenceDto.java:15-182](file://jmp-application/src/main/java/com/jmp/application/dto/ConferenceDto.java#L15-L182)
- [ConferenceMapper.java:15-77](file://jmp-application/src/main/java/com/jmp/application/mapper/ConferenceMapper.java#L15-L77)
- [ConferenceController.java:52-176](file://jmp-api/src/main/java/com/jmp/api/controller/ConferenceController.java#L52-L176)
- [ConferenceService.java:40-161](file://jmp-application/src/main/java/com/jmp/application/service/ConferenceService.java#L40-L161)

### RecordingDto Analysis
RecordingDto defines nested records for recording lifecycle:
- CreateRequest: Minimal metadata to register a recording entry.
- UpdateRequest: Metadata and retention updates.
- Response: Complete recording metadata including computed fields.
- Summary: List-friendly subset.
- DownloadUrlResponse: Presigned URL and expiry for downloads.
- StorageStats: Aggregated storage metrics.

Conversion strategy:
- RecordingService constructs Response and Summary from Recording entity, handling enums and computed fields.

Usage examples:
- Controllers accept CreateRequest and UpdateRequest.
- Services return Response, Summary, DownloadUrlResponse, and StorageStats.

```mermaid
classDiagram
class RecordingDto {
<<sealed interface>>
+id() UUID
+recordingKey() String
+originalFilename() String
+status() String
+recordingType() String
+conferenceId() UUID
+conferenceName() String
+tenantId() UUID
+startedAt() Instant
+endedAt() Instant
+durationSeconds() Long
+fileSizeBytes() Long
+fileHashSha256() String
+mimeType() String
+resolutionWidth() Integer
+resolutionHeight() Integer
+thumbnailKey() String
+metadata() Map~String,Object~
+retentionUntil() Instant
+isEncrypted() Boolean
+downloadCount() Integer
+createdAt() Instant
}
class CreateRequest
class UpdateRequest
class Response
class Summary
class DownloadUrlResponse
class StorageStats
RecordingDto <|.. CreateRequest
RecordingDto <|.. UpdateRequest
RecordingDto <|.. Response
RecordingDto <|.. Summary
RecordingDto <|.. DownloadUrlResponse
RecordingDto <|.. StorageStats
```

**Diagram sources**
- [RecordingDto.java:13-170](file://jmp-application/src/main/java/com/jmp/application/dto/RecordingDto.java#L13-L170)

**Section sources**
- [RecordingDto.java:13-170](file://jmp-application/src/main/java/com/jmp/application/dto/RecordingDto.java#L13-L170)
- [RecordingService.java:42-330](file://jmp-application/src/main/java/com/jmp/application/service/RecordingService.java#L42-L330)
- [RecordingController.java:45-129](file://jmp-api/src/main/java/com/jmp/api/controller/RecordingController.java#L45-L129)

### DTO-to-Entity Relationship and Conversion Strategies
- User: UserMapper converts User entity to UserDto.Response/Summary, mapping roles to strings and tenant ID. Creation/Update requests map to User with ignored fields to prevent accidental overrides.
- Conference: ConferenceMapper maps Conference to Response/Summary, extracting tenant and creator identifiers and computing current participants. **Enhanced** with type field mapping from ConferenceType enum to string. Requests map to Conference with ignored fields and proper type validation.
- Recording: RecordingService builds Response/Summary from Recording entity, handling enums and metadata.

```mermaid
flowchart TD
Start(["DTO Request Received"]) --> Validate["Validate DTO Fields<br/>(@NotBlank/@Size/@NotNull)"]
Validate --> TypeCheck{"Conference Type?"}
TypeCheck --> |Create| ValidateType["Validate Conference Type<br/>(SCHEDULED vs PERMANENT)"]
TypeCheck --> |Update| ValidateTypeUpdate["Validate Type Change<br/>(if provided)"]
TypeCheck --> |Other| MapToEntity["Map DTO to Domain Entity<br/>(Mappers or Service Construction)"]
ValidateType --> MapToEntity
ValidateTypeUpdate --> MapToEntity
MapToEntity --> BusinessLogic["Execute Business Logic<br/>(Service Methods)"]
BusinessLogic --> MapToResponse["Map Result to DTO Response"]
MapToResponse --> Serialize["Serialize to JSON"]
Serialize --> End(["HTTP Response Sent"])
```

**Diagram sources**
- [ConferenceDto.java:49-78](file://jmp-application/src/main/java/com/jmp/application/dto/ConferenceDto.java#L49-L78)
- [ConferenceService.java:56-62](file://jmp-application/src/main/java/com/jmp/application/service/ConferenceService.java#L56-L62)
- [ConferenceService.java:139-154](file://jmp-application/src/main/java/com/jmp/application/service/ConferenceService.java#L139-L154)
- [ConferenceMapper.java:31-47](file://jmp-application/src/main/java/com/jmp/application/mapper/ConferenceMapper.java#L31-L47)

**Section sources**
- [UserMapper.java:18-76](file://jmp-application/src/main/java/com/jmp/application/mapper/UserMapper.java#L18-L76)
- [ConferenceMapper.java:15-77](file://jmp-application/src/main/java/com/jmp/application/mapper/ConferenceMapper.java#L15-L77)
- [UserService.java:44-129](file://jmp-application/src/main/java/com/jmp/application/service/UserService.java#L44-L129)
- [ConferenceService.java:40-161](file://jmp-application/src/main/java/com/jmp/application/service/ConferenceService.java#L40-L161)
- [RecordingService.java:42-330](file://jmp-application/src/main/java/com/jmp/application/service/RecordingService.java#L42-L330)

### Examples of DTO Usage
- API Responses:
  - UserController returns UserDto.Response for GET /users/{id} and paginated UserDto.Summary for GET /users.
  - ConferenceController returns ConferenceDto.Response for GET /conferences/{id}, ConferenceDto.Summary for lists (now including type field), and ConferenceDto.TokenResponse for JWT generation.
  - RecordingController returns RecordingDto.Response, RecordingDto.Summary, RecordingDto.DownloadUrlResponse, and RecordingDto.StorageStats.
- Service Method Parameters:
  - UserService.createUser accepts UserDto.CreateRequest.
  - ConferenceService.createConference accepts ConferenceDto.CreateRequest plus tenant and user IDs (with type validation).
  - RecordingService.createRecording accepts RecordingDto.CreateRequest.
- Data Transformation Scenarios:
  - UserMapper transforms User to UserDto.Response/Summary.
  - ConferenceMapper transforms Conference to Response/Summary (with type field mapping).
  - RecordingService constructs Response/Summary from Recording.

**Updated** Conference DTO usage now consistently includes type field validation and mapping:
- CreateRequest requires type field with @NotNull validation
- UpdateRequest allows optional type changes with validation
- Response and Summary always include type field for consistent API contracts

**Section sources**
- [UserController.java:43-107](file://jmp-api/src/main/java/com/jmp/api/controller/UserController.java#L43-L107)
- [ConferenceController.java:52-176](file://jmp-api/src/main/java/com/jmp/api/controller/ConferenceController.java#L52-L176)
- [RecordingController.java:45-129](file://jmp-api/src/main/java/com/jmp/api/controller/RecordingController.java#L45-L129)
- [UserService.java:44-129](file://jmp-application/src/main/java/com/jmp/application/service/UserService.java#L44-L129)
- [ConferenceService.java:40-161](file://jmp-application/src/main/java/com/jmp/application/service/ConferenceService.java#L40-L161)
- [RecordingService.java:42-330](file://jmp-application/src/main/java/com/jmp/application/service/RecordingService.java#L42-L330)

### DTO Versioning, Backward Compatibility, and Large Dataset Considerations
- Versioning:
  - DTOs are part of the application layer contract. Introduce new DTO versions by adding new records (e.g., v2 variants) while keeping existing ones to maintain backward compatibility. Update controllers/services to support both versions temporarily.
  - **Enhanced** ConferenceDto type field is backward compatible as it's a new field that doesn't break existing functionality.
- Backward Compatibility:
  - Use Optional fields and defaults in DTOs. Ignore unknown fields on deserialization to avoid breaking changes.
  - Keep field names stable; prefer renaming via aliases if necessary.
  - **Enhanced** The new type field maintains backward compatibility since it's additive and doesn't replace existing functionality.
- Large Datasets:
  - Prefer Summary DTOs for list endpoints to reduce payload size.
  - Use pagination (Pageable) to limit response sizes.
  - Avoid eager loading of large collections; compute derived fields (e.g., participant counts) efficiently in queries or mappers.
  - **Enhanced** ConferenceDto Summary now includes type field for consistent list views without performance impact.

[No sources needed since this section provides general guidance]

## Dependency Analysis
- Controllers depend on services and DTOs.
- Services depend on repositories and mappers.
- Mappers depend on DTOs and entities.
- Entities are pure domain models with JPA annotations.

```mermaid
graph LR
UC["UserController"] --> US["UserService"]
CC["ConferenceController"] --> CS["ConferenceService"]
RC["RecordingController"] --> RS["RecordingService"]
US --> UM["UserMapper"]
CS --> CM["ConferenceMapper"]
UM --> UE["User"]
CM --> CE["Conference"]
RS --> RE["Recording"]
```

**Diagram sources**
- [UserController.java:33-123](file://jmp-api/src/main/java/com/jmp/api/controller/UserController.java#L33-L123)
- [ConferenceController.java:37-189](file://jmp-api/src/main/java/com/jmp/api/controller/ConferenceController.java#L37-L189)
- [RecordingController.java:35-138](file://jmp-api/src/main/java/com/jmp/api/controller/RecordingController.java#L35-L138)
- [UserService.java:28-190](file://jmp-application/src/main/java/com/jmp/application/service/UserService.java#L28-L190)
- [ConferenceService.java:25-255](file://jmp-application/src/main/java/com/jmp/application/service/ConferenceService.java#L25-L255)
- [RecordingService.java:27-332](file://jmp-application/src/main/java/com/jmp/application/service/RecordingService.java#L27-L332)
- [UserMapper.java:18-76](file://jmp-application/src/main/java/com/jmp/application/mapper/UserMapper.java#L18-L76)
- [ConferenceMapper.java:15-77](file://jmp-application/src/main/java/com/jmp/application/mapper/ConferenceMapper.java#L15-L77)
- [User.java:23-164](file://jmp-domain/src/main/java/com/jmp/domain/entity/User.java#L23-L164)
- [Conference.java:25-245](file://jmp-domain/src/main/java/com/jmp/domain/entity/Conference.java#L25-L245)
- [Recording.java:24-203](file://jmp-domain/src/main/java/com/jmp/domain/entity/Recording.java#L24-L203)

**Section sources**
- [UserMapper.java:18-76](file://jmp-application/src/main/java/com/jmp/application/mapper/UserMapper.java#L18-L76)
- [ConferenceMapper.java:15-77](file://jmp-application/src/main/java/com/jmp/application/mapper/ConferenceMapper.java#L15-L77)
- [UserService.java:28-190](file://jmp-application/src/main/java/com/jmp/application/service/UserService.java#L28-L190)
- [ConferenceService.java:25-255](file://jmp-application/src/main/java/com/jmp/application/service/ConferenceService.java#L25-L255)
- [RecordingService.java:27-332](file://jmp-application/src/main/java/com/jmp/application/service/RecordingService.java#L27-L332)

## Performance Considerations
- Prefer lightweight DTOs (Summary) for list endpoints to minimize bandwidth and parsing overhead.
- Use pagination to cap result sets.
- Avoid fetching unnecessary associations; rely on projections or computed fields in mappers/services.
- For large payloads (e.g., metadata maps), consider streaming or chunked responses if applicable.
- Cache frequently accessed small DTOs (e.g., user profiles) at the application level when appropriate.
- **Enhanced** ConferenceDto type field adds minimal overhead as it's a simple string field that doesn't require complex serialization.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Validation failures on DTO fields:
  - Ensure @NotBlank, @Size, and @Email constraints match request payloads.
  - Review DTO constructors and annotations for correctness.
  - **Enhanced** For ConferenceDto, ensure type field is provided for CreateRequest and valid for UpdateRequest.
- Mapping errors:
  - Verify that mappers ignore non-matching fields and handle nulls appropriately.
  - Confirm enum conversions (e.g., status, type) align between DTOs and entities.
  - **Enhanced** For ConferenceDto, verify type field mapping from ConferenceType enum to string.
- Unexpected nulls or missing fields:
  - Check mapper configurations and explicit ignores for derived or sensitive fields.
  - **Enhanced** Ensure type field is properly mapped in ConferenceMapper.
- JWT token generation:
  - Confirm TokenRequest fields and service logic for generating tokens and room URLs.
- **Enhanced** Conference type validation errors:
  - Ensure ConferenceService receives valid ConferenceType values (SCHEDULED, PERMANENT)
  - For SCHEDULED conferences, ensure scheduledStartAt is provided when type is SCHEDULED

**Section sources**
- [ConferenceDto.java:49-78](file://jmp-application/src/main/java/com/jmp/application/dto/ConferenceDto.java#L49-L78)
- [ConferenceService.java:56-62](file://jmp-application/src/main/java/com/jmp/application/service/ConferenceService.java#L56-L62)
- [ConferenceService.java:139-154](file://jmp-application/src/main/java/com/jmp/application/service/ConferenceService.java#L139-L154)
- [ConferenceMapper.java:31-47](file://jmp-application/src/main/java/com/jmp/application/mapper/ConferenceMapper.java#L31-L47)

## Conclusion
The DTO patterns in this application emphasize clarity, validation, and separation of concerns. UserDto, ConferenceDto, and RecordingDto provide structured contracts for data exchange, with mappers ensuring safe and controlled transformations between DTOs and domain entities. **Enhanced** ConferenceDto now includes comprehensive type field support that distinguishes between SCHEDULED and PERMANENT conference types, improving type safety and validation throughout the system. By leveraging Summary DTOs, pagination, and careful validation, the system remains performant and maintainable while supporting future evolution through versioned DTOs and backward-compatible changes.