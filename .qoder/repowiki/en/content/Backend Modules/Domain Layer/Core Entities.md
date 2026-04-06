# Core Entities

<cite>
**Referenced Files in This Document**
- [User.java](file://jmp-domain/src/main/java/com/jmp/domain/entity/User.java)
- [Conference.java](file://jmp-domain/src/main/java/com/jmp/domain/entity/Conference.java)
- [Recording.java](file://jmp-domain/src/main/java/com/jmp/domain/entity/Recording.java)
- [AuditLog.java](file://jmp-domain/src/main/java/com/jmp/domain/entity/AuditLog.java)
- [Tenant.java](file://jmp-domain/src/main/java/com/jmp/domain/entity/Tenant.java)
- [Role.java](file://jmp-domain/src/main/java/com/jmp/domain/entity/Role.java)
- [Permission.java](file://jmp-domain/src/main/java/com/jmp/domain/entity/Permission.java)
- [IdentityProvider.java](file://jmp-domain/src/main/java/com/jmp/domain/entity/IdentityProvider.java)
- [ConferenceParticipant.java](file://jmp-domain/src/main/java/com/jmp/domain/entity/ConferenceParticipant.java)
- [UserRepository.java](file://jmp-domain/src/main/java/com/jmp/domain/repository/UserRepository.java)
- [ConferenceRepository.java](file://jmp-domain/src/main/java/com/jmp/domain/repository/ConferenceRepository.java)
- [RecordingRepository.java](file://jmp-domain/src/main/java/com/jmp/domain/repository/RecordingRepository.java)
- [AuditLogRepository.java](file://jmp-domain/src/main/java/com/jmp/domain/repository/AuditLogRepository.java)
- [RoleRepository.java](file://jmp-domain/src/main/java/com/jmp/domain/repository/RoleRepository.java)
- [V1__init_schema.sql](file://jmp-web/src/main/resources/db/migration/V1__init_schema.sql)
- [V2__seed_data.sql](file://jmp-web/src/main/resources/db/migration/V2__seed_data.sql)
- [V3__create_recordings_table.sql](file://jmp-web/src/main/resources/db/migration/V3__create_recordings_table.sql)
- [V4__create_audit_logs_table.sql](file://jmp-web/src/main/resources/db/migration/V4__create_audit_logs_table.sql)
- [V5__create_identity_providers_table.sql](file://jmp-web/src/main/resources/db/migration/V5__create_identity_providers_table.sql)
</cite>

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
10. [Appendices](#appendices)

## Introduction
This document describes the Core Entities of the Jitsi Management Platform domain layer. It focuses on the persistent JPA entities that model the platform’s business domain: User, Conference, Recording, AuditLog, Tenant, Role, Permission, IdentityProvider, and ConferenceParticipant. For each entity, we explain JPA annotations, field definitions, business significance, validation rules, lifecycle management, and relationships with foreign keys and cardinalities. We also document immutable-like value objects (Role and Permission) that encapsulate business logic, and show how entities enforce business rules and maintain data integrity.

## Project Structure
The domain layer is organized around entities, repositories, and value objects. Entities are annotated for JPA persistence and audited automatically. Repositories define typed queries and EntityGraph loading strategies to optimize access patterns.

```mermaid
graph TB
subgraph "Domain Layer"
E_User["User.java"]
E_Conf["Conference.java"]
E_Rec["Recording.java"]
E_Audit["AuditLog.java"]
E_Tenant["Tenant.java"]
E_Role["Role.java"]
E_Permission["Permission.java"]
E_IDP["IdentityProvider.java"]
E_Part["ConferenceParticipant.java"]
R_UserRepo["UserRepository.java"]
R_ConfRepo["ConferenceRepository.java"]
R_RecRepo["RecordingRepository.java"]
R_AuditRepo["AuditLogRepository.java"]
R_RoleRepo["RoleRepository.java"]
end
subgraph "Persistence Schema"
M_V1["V1__init_schema.sql"]
M_V2["V2__seed_data.sql"]
M_V3["V3__create_recordings_table.sql"]
M_V4["V4__create_audit_logs_table.sql"]
M_V5["V5__create_identity_providers_table.sql"]
end
E_User --- E_Tenant
E_User --- E_Role
E_Conf --- E_Tenant
E_Conf --- E_User
E_Conf --- E_Part
E_Rec --- E_Conf
E_Rec --- E_Tenant
E_Audit --- E_User
E_IDP --- E_Tenant
E_Role --- E_Permission
R_UserRepo --> E_User
R_ConfRepo --> E_Conf
R_RecRepo --> E_Rec
R_AuditRepo --> E_Audit
R_RoleRepo --> E_Role
M_V1 -. defines .- E_Tenant
M_V1 -. defines .- E_User
M_V1 -. defines .- E_Role
M_V1 -. defines .- E_Conf
M_V1 -. defines .- E_Part
M_V3 -. defines .- E_Rec
M_V4 -. defines .- E_Audit
M_V5 -. defines .- E_IDP
```

**Diagram sources**
- [User.java:23-164](file://jmp-domain/src/main/java/com/jmp/domain/entity/User.java#L23-L164)
- [Conference.java:25-217](file://jmp-domain/src/main/java/com/jmp/domain/entity/Conference.java#L25-L217)
- [Recording.java:24-203](file://jmp-domain/src/main/java/com/jmp/domain/entity/Recording.java#L24-L203)
- [AuditLog.java:20-136](file://jmp-domain/src/main/java/com/jmp/domain/entity/AuditLog.java#L20-L136)
- [Tenant.java:24-174](file://jmp-domain/src/main/java/com/jmp/domain/entity/Tenant.java#L24-L174)
- [Role.java:22-131](file://jmp-domain/src/main/java/com/jmp/domain/entity/Role.java#L22-L131)
- [Permission.java:18-128](file://jmp-domain/src/main/java/com/jmp/domain/entity/Permission.java#L18-L128)
- [IdentityProvider.java:23-158](file://jmp-domain/src/main/java/com/jmp/domain/entity/IdentityProvider.java#L23-L158)
- [ConferenceParticipant.java:18-150](file://jmp-domain/src/main/java/com/jmp/domain/entity/ConferenceParticipant.java#L18-L150)
- [UserRepository.java:18-82](file://jmp-domain/src/main/java/com/jmp/domain/repository/UserRepository.java#L18-L82)
- [ConferenceRepository.java:20-110](file://jmp-domain/src/main/java/com/jmp/domain/repository/ConferenceRepository.java#L20-L110)
- [RecordingRepository.java:19-100](file://jmp-domain/src/main/java/com/jmp/domain/repository/RecordingRepository.java#L19-L100)
- [AuditLogRepository.java:18-85](file://jmp-domain/src/main/java/com/jmp/domain/repository/AuditLogRepository.java#L18-L85)
- [RoleRepository.java:13-20](file://jmp-domain/src/main/java/com/jmp/domain/repository/RoleRepository.java#L13-L20)
- [V1__init_schema.sql:10-172](file://jmp-web/src/main/resources/db/migration/V1__init_schema.sql#L10-L172)
- [V2__seed_data.sql:4-131](file://jmp-web/src/main/resources/db/migration/V2__seed_data.sql#L4-L131)
- [V3__create_recordings_table.sql:4-43](file://jmp-web/src/main/resources/db/migration/V3__create_recordings_table.sql#L4-L43)
- [V4__create_audit_logs_table.sql:4-36](file://jmp-web/src/main/resources/db/migration/V4__create_audit_logs_table.sql#L4-L36)
- [V5__create_identity_providers_table.sql:4-45](file://jmp-web/src/main/resources/db/migration/V5__create_identity_providers_table.sql#L4-L45)

**Section sources**
- [User.java:23-164](file://jmp-domain/src/main/java/com/jmp/domain/entity/User.java#L23-L164)
- [Conference.java:25-217](file://jmp-domain/src/main/java/com/jmp/domain/entity/Conference.java#L25-L217)
- [Recording.java:24-203](file://jmp-domain/src/main/java/com/jmp/domain/entity/Recording.java#L24-L203)
- [AuditLog.java:20-136](file://jmp-domain/src/main/java/com/jmp/domain/entity/AuditLog.java#L20-L136)
- [Tenant.java:24-174](file://jmp-domain/src/main/java/com/jmp/domain/entity/Tenant.java#L24-L174)
- [Role.java:22-131](file://jmp-domain/src/main/java/com/jmp/domain/entity/Role.java#L22-L131)
- [Permission.java:18-128](file://jmp-domain/src/main/java/com/jmp/domain/entity/Permission.java#L18-L128)
- [IdentityProvider.java:23-158](file://jmp-domain/src/main/java/com/jmp/domain/entity/IdentityProvider.java#L23-L158)
- [ConferenceParticipant.java:18-150](file://jmp-domain/src/main/java/com/jmp/domain/entity/ConferenceParticipant.java#L18-L150)
- [V1__init_schema.sql:10-172](file://jmp-web/src/main/resources/db/migration/V1__init_schema.sql#L10-L172)
- [V2__seed_data.sql:4-131](file://jmp-web/src/main/resources/db/migration/V2__seed_data.sql#L4-L131)
- [V3__create_recordings_table.sql:4-43](file://jmp-web/src/main/resources/db/migration/V3__create_recordings_table.sql#L4-L43)
- [V4__create_audit_logs_table.sql:4-36](file://jmp-web/src/main/resources/db/migration/V4__create_audit_logs_table.sql#L4-L36)
- [V5__create_identity_providers_table.sql:4-45](file://jmp-web/src/main/resources/db/migration/V5__create_identity_providers_table.sql#L4-L45)

## Core Components
This section summarizes each entity’s purpose, annotations, key fields, and business significance.

- User
  - Purpose: Represents a platform user scoped to a Tenant with RBAC via Roles. Supports soft-delete and status lifecycle.
  - Key fields: email (unique), firstName, lastName, passwordHash, status, tenant (many-to-one), roles (many-to-many), externalAuthId/provider, two-factor fields, timestamps.
  - Lifecycle: softDelete(), isActive(), hasRole().
  - Validation: @NotNull, @Email, @Size constraints; unique email enforced by schema.

- Conference
  - Purpose: Represents a Jitsi conference room with scheduling, options, and participant tracking.
  - Key fields: roomName, displayName, description, tenant (many-to-one), createdBy (many-to-one), status, scheduling timestamps, flags (password, lobby, recording, streaming), jitsiOptions/metadata, participants (one-to-many).
  - Lifecycle: start(), end(), softDelete(), isActive(), isEnded(), getCurrentParticipantCount().
  - Validation: @NotNull, @Size; unique roomName per tenant enforced by composite index.

- Recording
  - Purpose: Stores metadata and lifecycle for conference recordings.
  - Key fields: recordingKey (unique), originalFilename, status, recordingType, timestamps, duration, file metrics, encryption flags, thumbnails, transcription/metadata, retention, download stats.
  - Lifecycle: calculateDuration(), markReady(), recordDownload(), isWithinRetention().
  - Validation: @NotNull, @Size; unique recordingKey enforced by schema.

- AuditLog
  - Purpose: Captures system events with context (user, tenant, IP, agent, payload diffs).
  - Key fields: eventType, action, entityType/entityId, user (optional), tenantId, identifiers, ip/userAgent, old/new values, metadata, severity, error message, success, processing time, timestamps.
  - Validation: @NotNull, @Size; JSONB fields for structured data.

- Tenant
  - Purpose: Multi-tenant isolation with quotas and settings.
  - Key fields: name (unique), slug (unique), description, status, domain (unique), jitsiDomain, quotas (embedded), settings/jitsiConfig, suspension fields.
  - Lifecycle: suspend(reason), activate(), isActive().
  - Validation: @NotNull, @Size; embedded quotas with feature gating.

- Role
  - Purpose: RBAC role with hierarchy and permissions; supports global/system roles.
  - Key fields: name (unique), description, roleType, tenant (optional), permissions (many-to-many), parentRole, isSystemRole.
  - Business logic: hasPermission(), isGlobal().
  - Validation: @NotNull, @Size; unique name; parent role self-reference.

- Permission
  - Purpose: Fine-grained permission with resource/action semantics; supports ABAC-style attributes.
  - Key fields: name (unique), description, resourceType, action, isSystemPermission.
  - Constants: predefined permission names for common CRUD and management actions.
  - Validation: @NotNull, @Size; unique name.

- IdentityProvider
  - Purpose: SSO/OIDC provider configuration per tenant.
  - Key fields: tenant (many-to-one), name, description, providerType, endpoints, client credentials, scopes, attribute mapping, additional config, flags (enabled, auto-provision, force SSO), default role.
  - Validation: @NotNull, @Size; JSONB fields; unique tenant+name enforced by composite index.

- ConferenceParticipant
  - Purpose: Tracks who joins a conference, their role/status, and connection details.
  - Key fields: conference (many-to-one), user (optional), displayName, email, externalId, role, status, joined/left timestamps, flags, ip/userAgent.
  - Lifecycle: markJoined(), markLeft(), isActive().
  - Validation: @NotNull, @Size; optional user for guests.

**Section sources**
- [User.java:23-164](file://jmp-domain/src/main/java/com/jmp/domain/entity/User.java#L23-L164)
- [Conference.java:25-217](file://jmp-domain/src/main/java/com/jmp/domain/entity/Conference.java#L25-L217)
- [Recording.java:24-203](file://jmp-domain/src/main/java/com/jmp/domain/entity/Recording.java#L24-L203)
- [AuditLog.java:20-136](file://jmp-domain/src/main/java/com/jmp/domain/entity/AuditLog.java#L20-L136)
- [Tenant.java:24-174](file://jmp-domain/src/main/java/com/jmp/domain/entity/Tenant.java#L24-L174)
- [Role.java:22-131](file://jmp-domain/src/main/java/com/jmp/domain/entity/Role.java#L22-L131)
- [Permission.java:18-128](file://jmp-domain/src/main/java/com/jmp/domain/entity/Permission.java#L18-L128)
- [IdentityProvider.java:23-158](file://jmp-domain/src/main/java/com/jmp/domain/entity/IdentityProvider.java#L23-L158)
- [ConferenceParticipant.java:18-150](file://jmp-domain/src/main/java/com/jmp/domain/entity/ConferenceParticipant.java#L18-L150)

## Architecture Overview
The entities form a cohesive domain model with clear ownership and cascading behavior. Tenants own Users and Conferences. Conferences own Participants and Recordings. Users may be linked to Participants. Roles and Permissions underpin access control. Audit logs capture cross-cutting events.

```mermaid
classDiagram
class Tenant {
+UUID id
+String name
+String slug
+String description
+TenantStatus status
+String domain
+String jitsiDomain
+TenantQuotas quotas
+Map~String,Object~ settings
+Map~String,Object~ jitsiConfig
+Instant createdAt
+Instant updatedAt
+Instant suspendedAt
+String suspensionReason
+suspend(reason)
+activate()
+isActive() boolean
}
class User {
+UUID id
+String email
+String firstName
+String lastName
+String passwordHash
+UserStatus status
+Boolean emailVerified
+Instant emailVerifiedAt
+Instant lastLoginAt
+Boolean twoFactorEnabled
+String twoFactorSecret
+String externalAuthId
+String externalAuthProvider
+Tenant tenant
+Set~Role~ roles
+Instant createdAt
+Instant updatedAt
+Instant deletedAt
+softDelete()
+isActive() boolean
+hasRole(name) boolean
}
class Role {
+UUID id
+String name
+String description
+RoleType roleType
+Tenant tenant
+Set~Permission~ permissions
+Role parentRole
+Boolean isSystemRole
+Instant createdAt
+Instant updatedAt
+hasPermission(name) boolean
+isGlobal() boolean
}
class Permission {
+UUID id
+String name
+String description
+ResourceType resourceType
+Action action
+Boolean isSystemPermission
+Instant createdAt
}
class Conference {
+UUID id
+String roomName
+String displayName
+String description
+Tenant tenant
+User createdBy
+ConferenceStatus status
+Instant scheduledStartAt
+Instant scheduledEndAt
+Instant actualStartedAt
+Instant actualEndedAt
+Boolean isRecurring
+String recurrenceRule
+Integer maxParticipants
+Boolean requirePassword
+String passwordHash
+Boolean enableLobby
+Boolean enableRecording
+Boolean enableLiveStreaming
+Boolean enableChat
+Boolean enableScreenSharing
+Boolean muteUponEntry
+Boolean requireSignedIn
+Map~String,Object~ jitsiOptions
+Map~String,Object~ metadata
+Set~ConferenceParticipant~ participants
+Instant createdAt
+Instant updatedAt
+Instant deletedAt
+start()
+end()
+softDelete()
+isActive() boolean
+isEnded() boolean
+getCurrentParticipantCount() int
}
class ConferenceParticipant {
+UUID id
+Conference conference
+User user
+String displayName
+String email
+String externalId
+ParticipantRole role
+ParticipantStatus status
+Instant joinedAt
+Instant leftAt
+Boolean isModerator
+Boolean isRecorder
+Boolean isSilent
+String ipAddress
+String userAgent
+Instant createdAt
+markJoined()
+markLeft()
+isActive() boolean
}
class Recording {
+UUID id
+Conference conference
+Tenant tenant
+String recordingKey
+String originalFilename
+RecordingStatus status
+RecordingType recordingType
+Instant startedAt
+Instant endedAt
+Long durationSeconds
+Long fileSizeBytes
+String fileHashSha256
+String mimeType
+Integer resolutionWidth
+Integer resolutionHeight
+String thumbnailKey
+Map~String,Object~ transcription
+Map~String,Object~ metadata
+Instant retentionUntil
+Boolean isEncrypted
+String encryptionKeyId
+Integer downloadCount
+Instant lastDownloadedAt
+Instant createdAt
+Instant updatedAt
+Instant deletedAt
+calculateDuration()
+markReady()
+recordDownload()
+isWithinRetention() boolean
}
class AuditLog {
+UUID id
+AuditEventType eventType
+String action
+String entityType
+UUID entityId
+User user
+UUID tenantId
+String userEmail
+String ipAddress
+String userAgent
+Object oldValues
+Object newValues
+Object metadata
+String severity
+String errorMessage
+Boolean success
+Long processingTimeMs
+Instant createdAt
}
class IdentityProvider {
+UUID id
+Tenant tenant
+String name
+String description
+ProviderType providerType
+String issuerUrl
+String authorizationEndpoint
+String tokenEndpoint
+String userinfoEndpoint
+String jwksUri
+String clientId
+String clientSecret
+String redirectUri
+String scopes
+Map~String,String~ attributeMapping
+Map~String,Object~ additionalConfig
+Boolean enabled
+Boolean autoProvisionUsers
+Boolean forceSso
+String defaultRole
+Instant createdAt
+Instant updatedAt
}
Tenant "1" --> "*" User : "owns"
Tenant "1" --> "*" Conference : "owns"
Tenant "1" --> "*" Recording : "owns"
Tenant "1" --> "*" IdentityProvider : "has providers"
User "1" --> "*" ConferenceParticipant : "may attend"
Conference "1" --> "*" ConferenceParticipant : "has participants"
Conference "1" --> "*" Recording : "generates"
User "1" --> "*" Role : "has roles"
Role "1" --> "*" Permission : "grants"
```

**Diagram sources**
- [User.java:28-164](file://jmp-domain/src/main/java/com/jmp/domain/entity/User.java#L28-L164)
- [Conference.java:30-217](file://jmp-domain/src/main/java/com/jmp/domain/entity/Conference.java#L30-L217)
- [Recording.java:29-203](file://jmp-domain/src/main/java/com/jmp/domain/entity/Recording.java#L29-L203)
- [AuditLog.java:25-136](file://jmp-domain/src/main/java/com/jmp/domain/entity/AuditLog.java#L25-L136)
- [Tenant.java:29-174](file://jmp-domain/src/main/java/com/jmp/domain/entity/Tenant.java#L29-L174)
- [Role.java:27-131](file://jmp-domain/src/main/java/com/jmp/domain/entity/Role.java#L27-L131)
- [Permission.java:23-128](file://jmp-domain/src/main/java/com/jmp/domain/entity/Permission.java#L23-L128)
- [IdentityProvider.java:28-158](file://jmp-domain/src/main/java/com/jmp/domain/entity/IdentityProvider.java#L28-L158)
- [ConferenceParticipant.java:23-150](file://jmp-domain/src/main/java/com/jmp/domain/entity/ConferenceParticipant.java#L23-L150)

## Detailed Component Analysis

### User
- JPA annotations: @Entity, @Table(schema="jmp"), @EntityListeners(AuditingEntityListener), @Getter/@Setter, @NotNull/@Email/@Size, @CreationTimestamp/@LastModificationTimestamp.
- Fields: id (UUID), email (unique), personal info, passwordHash, status with defaults, verification flags/timestamps, 2FA fields, external auth identifiers, tenant (many-to-one), roles (many-to-many), createdAt/updatedAt/deletedAt.
- Relationships: belongs to Tenant; many-to-many with Role via user_roles junction; participates in ConferenceParticipant.
- Business rules: soft-delete sets deletedAt and status; isActive requires ACTIVE and not deleted; hasRole checks role name membership.
- Validation: email uniqueness enforced by schema; size limits; not-null constraints; tenant required.

**Section sources**
- [User.java:23-164](file://jmp-domain/src/main/java/com/jmp/domain/entity/User.java#L23-L164)
- [V1__init_schema.sql:63-87](file://jmp-web/src/main/resources/db/migration/V1__init_schema.sql#L63-L87)
- [UserRepository.java:18-82](file://jmp-domain/src/main/java/com/jmp/domain/repository/UserRepository.java#L18-L82)

### Conference
- JPA annotations: @Entity, @Table(schema="jmp"), @EntityListeners(AuditingEntityListener), @JdbcTypeCode(Json), @Enumerated.
- Fields: id, roomName (unique per tenant), displayName, description, tenant (many-to-one), createdBy (many-to-one), status with defaults, scheduling timestamps, flags for features, jitsiOptions/metadata, participants (one-to-many), createdAt/updatedAt/deletedAt.
- Relationships: owned by Tenant; owned by User (creator); owns ConferenceParticipant; produces Recording.
- Business rules: start()/end() set status and timestamps; softDelete cancels; isActive/isEnded compute state; participant counting filters by JOINED.
- Validation: not-null room/display name; size limits; composite unique index on roomName+tenant.

**Section sources**
- [Conference.java:25-217](file://jmp-domain/src/main/java/com/jmp/domain/entity/Conference.java#L25-L217)
- [V1__init_schema.sql:89-139](file://jmp-web/src/main/resources/db/migration/V1__init_schema.sql#L89-L139)
- [ConferenceRepository.java:20-110](file://jmp-domain/src/main/java/com/jmp/domain/repository/ConferenceRepository.java#L20-L110)

### Recording
- JPA annotations: @Entity, @Table(schema="jmp"), @EntityListeners(AuditingEntityListener), @JdbcTypeCode(Json).
- Fields: id, conference (many-to-one), tenant (many-to-one), recordingKey (unique), metadata (transcription/metadata), status/type, timestamps, duration/file metrics, encryption fields, thumbnail, retention, download counters.
- Relationships: belongs to Conference and Tenant; one Recording per conference session.
- Business rules: calculateDuration() computes seconds from start/end; markReady() transitions to READY and recalculates; recordDownload() increments counters; isWithinRetention() checks retention window.
- Validation: not-null status/type; unique recordingKey; JSONB fields; size limits.

**Section sources**
- [Recording.java:24-203](file://jmp-domain/src/main/java/com/jmp/domain/entity/Recording.java#L24-L203)
- [V3__create_recordings_table.sql:4-43](file://jmp-web/src/main/resources/db/migration/V3__create_recordings_table.sql#L4-L43)
- [RecordingRepository.java:19-100](file://jmp-domain/src/main/java/com/jmp/domain/repository/RecordingRepository.java#L19-L100)

### AuditLog
- JPA annotations: @Entity, @Table(schema="jmp"), @EntityListeners(AuditingEntityListener), @JdbcTypeCode(Json).
- Fields: id, eventType, action, entityType/entityId, user (optional), tenantId, identifiers, ip/userAgent, old/new values, metadata, severity, error message, success flag, processing time, createdAt.
- Relationships: optional user reference; aggregates system-wide events.
- Business rules: captures pre/post state diffs; severity and success flags; supports filtering by tenant, user, event type, and date ranges.
- Validation: not-null eventType/action; size limits; JSONB fields.

**Section sources**
- [AuditLog.java:20-136](file://jmp-domain/src/main/java/com/jmp/domain/entity/AuditLog.java#L20-L136)
- [V4__create_audit_logs_table.sql:4-36](file://jmp-web/src/main/resources/db/migration/V4__create_audit_logs_table.sql#L4-L36)
- [AuditLogRepository.java:18-85](file://jmp-domain/src/main/java/com/jmp/domain/repository/AuditLogRepository.java#L18-L85)

### Tenant
- JPA annotations: @Entity, @Table(schema="jmp"), @EntityListeners(AuditingEntityListener), @JdbcTypeCode(Json), @Embedded.
- Fields: id, name (unique), slug (unique), description, status, domain (unique), jitsiDomain, quotas (embedded), settings/jitsiConfig, suspension fields, createdAt/updatedAt/suspendedAt.
- Relationships: owns Users, Conferences, Recordings, IdentityProviders.
- Business rules: suspend()/activate() manage status and suspension metadata; isActive() checks status.
- Validation: not-null name/slug; unique constraints; embedded quotas with feature gating.

**Section sources**
- [Tenant.java:24-174](file://jmp-domain/src/main/java/com/jmp/domain/entity/Tenant.java#L24-L174)
- [V1__init_schema.sql:10-30](file://jmp-web/src/main/resources/db/migration/V1__init_schema.sql#L10-L30)

### Role
- JPA annotations: @Entity, @Table(schema="jmp"), @EntityListeners(AuditingEntityListener), @ManyToMany(fetch=EAGER).
- Fields: id, name (unique), description, roleType, tenant (optional), permissions (many-to-many), parentRole (self-referencing), isSystemRole, createdAt/updatedAt.
- Relationships: many-to-many with Permission; many-to-one with Tenant; hierarchical parent relationship.
- Business logic: hasPermission() checks permission membership; isGlobal() indicates tenant-less role.
- Validation: not-null name/type; unique name; parent role self-reference.

**Section sources**
- [Role.java:22-131](file://jmp-domain/src/main/java/com/jmp/domain/entity/Role.java#L22-L131)
- [V1__init_schema.sql:43-61](file://jmp-web/src/main/resources/db/migration/V1__init_schema.sql#L43-L61)
- [RoleRepository.java:13-20](file://jmp-domain/src/main/java/com/jmp/domain/repository/RoleRepository.java#L13-L20)

### Permission
- JPA annotations: @Entity, @Table(schema="jmp"), @EntityListeners(AuditingEntityListener).
- Fields: id, name (unique), description, resourceType, action, isSystemPermission, createdAt.
- Business logic: predefined constants for standard CRUD and management actions; supports ABAC via resource/action semantics.
- Validation: not-null name/resourceType/action; unique name.

**Section sources**
- [Permission.java:18-128](file://jmp-domain/src/main/java/com/jmp/domain/entity/Permission.java#L18-L128)
- [V2__seed_data.sql:13-40](file://jmp-web/src/main/resources/db/migration/V2__seed_data.sql#L13-L40)

### IdentityProvider
- JPA annotations: @Entity, @Table(schema="jmp"), @EntityListeners(AuditingEntityListener), @JdbcTypeCode(Json).
- Fields: id, tenant (many-to-one), name, description, providerType, endpoints, client credentials, redirect URI, scopes, attribute mapping, additional config, flags, default role, createdAt/updatedAt.
- Relationships: belongs to Tenant; enables SSO/OIDC per tenant.
- Validation: not-null provider fields; unique tenant+name; JSONB fields; size limits.

**Section sources**
- [IdentityProvider.java:23-158](file://jmp-domain/src/main/java/com/jmp/domain/entity/IdentityProvider.java#L23-L158)
- [V5__create_identity_providers_table.sql:4-45](file://jmp-web/src/main/resources/db/migration/V5__create_identity_providers_table.sql#L4-L45)

### ConferenceParticipant
- JPA annotations: @Entity, @Table(schema="jmp"), @EntityListeners(AuditingEntityListener).
- Fields: id, conference (many-to-one), user (optional), displayName/email, externalId, role, status, joined/left timestamps, flags, ip/userAgent, createdAt.
- Relationships: belongs to Conference; optionally belongs to User (guests supported).
- Business rules: markJoined()/markLeft() update status and timestamps; isActive() checks JOINED.
- Validation: not-null role/status; size limits.

**Section sources**
- [ConferenceParticipant.java:18-150](file://jmp-domain/src/main/java/com/jmp/domain/entity/ConferenceParticipant.java#L18-L150)
- [V1__init_schema.sql:121-139](file://jmp-web/src/main/resources/db/migration/V1__init_schema.sql#L121-L139)

## Dependency Analysis
This section maps entity dependencies and foreign keys defined in the schema migrations.

```mermaid
erDiagram
TENANTS {
uuid id PK
varchar name
varchar slug UK
varchar description
varchar status
varchar domain UK
varchar jitsi_domain
jsonb settings
jsonb jitsi_config
}
USERS {
uuid id PK
varchar email UK
varchar first_name
varchar last_name
varchar password_hash
varchar status
boolean email_verified
timestamptz email_verified_at
timestamptz last_login_at
boolean two_factor_enabled
varchar two_factor_secret
uuid tenant_id FK
timestamptz created_at
timestamptz updated_at
timestamptz deleted_at
}
ROLES {
uuid id PK
varchar name UK
varchar description
varchar role_type
uuid tenant_id FK
uuid parent_role_id FK
boolean is_system_role
timestamptz created_at
timestamptz updated_at
}
PERMISSIONS {
uuid id PK
varchar name UK
varchar description
varchar resource_type
varchar action
boolean is_system_permission
timestamptz created_at
}
ROLE_PERMISSIONS {
uuid role_id PK,FK
uuid permission_id PK,FK
}
USER_ROLES {
uuid user_id PK,FK
uuid role_id PK,FK
}
CONFERENCES {
uuid id PK
varchar room_name
varchar display_name
text description
uuid tenant_id FK
uuid created_by FK
varchar status
timestamptz scheduled_start_at
timestamptz scheduled_end_at
timestamptz actual_started_at
timestamptz actual_ended_at
boolean is_recurring
varchar recurrence_rule
int max_participants
boolean require_password
varchar password_hash
boolean enable_lobby
boolean enable_recording
boolean enable_live_streaming
boolean enable_chat
boolean enable_screen_sharing
boolean mute_upon_entry
boolean require_signed_in
jsonb jitsi_options
jsonb metadata
timestamptz created_at
timestamptz updated_at
timestamptz deleted_at
}
CONFERENCE_PARTICIPANTS {
uuid id PK
uuid conference_id FK
uuid user_id FK
varchar display_name
varchar email
varchar external_id
varchar role
varchar status
timestamptz joined_at
timestamptz left_at
boolean is_moderator
boolean is_recorder
boolean is_silent
varchar ip_address
varchar user_agent
timestamptz created_at
}
RECORDINGS {
uuid id PK
uuid conference_id FK
uuid tenant_id FK
varchar recording_key UK
varchar original_filename
varchar status
varchar recording_type
timestamptz started_at
timestamptz ended_at
bigint duration_seconds
bigint file_size_bytes
varchar file_hash_sha256
varchar mime_type
int resolution_width
int resolution_height
varchar thumbnail_key
jsonb transcription
jsonb metadata
timestamptz retention_until
boolean is_encrypted
varchar encryption_key_id
int download_count
timestamptz last_downloaded_at
timestamptz created_at
timestamptz updated_at
timestamptz deleted_at
}
AUDIT_LOGS {
uuid id PK
varchar event_type
varchar action
varchar entity_type
uuid entity_id
uuid user_id FK
uuid tenant_id
varchar user_email
varchar ip_address
varchar user_agent
jsonb old_values
jsonb new_values
jsonb metadata
varchar severity
varchar error_message
boolean success
bigint processing_time_ms
timestamptz created_at
}
IDENTITY_PROVIDERS {
uuid id PK
uuid tenant_id FK
varchar name
varchar description
varchar provider_type
varchar issuer_url
varchar authorization_endpoint
varchar token_endpoint
varchar userinfo_endpoint
varchar jwks_uri
varchar client_id
varchar client_secret
varchar redirect_uri
varchar scopes
jsonb attribute_mapping
jsonb additional_config
boolean enabled
boolean auto_provision_users
boolean force_sso
varchar default_role
timestamptz created_at
timestamptz updated_at
}
USERS }o--|| TENANTS : "belongs to"
USERS }o--o| ROLES : "has via USER_ROLES"
ROLES }o--o| PERMISSIONS : "grants via ROLE_PERMISSIONS"
CONFERENCES }o--|| TENANTS : "owned by"
CONFERENCES }o--|| USERS : "created by"
CONFERENCES }o--o| CONFERENCE_PARTICIPANTS : "has"
RECORDINGS }o--|| CONFERENCES : "produced by"
RECORDINGS }o--|| TENANTS : "owned by"
AUDIT_LOGS }o--|| USERS : "logged by"
IDENTITY_PROVIDERS }o--|| TENANTS : "configured by"
```

**Diagram sources**
- [V1__init_schema.sql:10-172](file://jmp-web/src/main/resources/db/migration/V1__init_schema.sql#L10-L172)
- [V3__create_recordings_table.sql:4-43](file://jmp-web/src/main/resources/db/migration/V3__create_recordings_table.sql#L4-L43)
- [V4__create_audit_logs_table.sql:4-36](file://jmp-web/src/main/resources/db/migration/V4__create_audit_logs_table.sql#L4-L36)
- [V5__create_identity_providers_table.sql:4-45](file://jmp-web/src/main/resources/db/migration/V5__create_identity_providers_table.sql#L4-L45)

**Section sources**
- [V1__init_schema.sql:10-172](file://jmp-web/src/main/resources/db/migration/V1__init_schema.sql#L10-L172)
- [V2__seed_data.sql:4-131](file://jmp-web/src/main/resources/db/migration/V2__seed_data.sql#L4-L131)
- [V3__create_recordings_table.sql:4-43](file://jmp-web/src/main/resources/db/migration/V3__create_recordings_table.sql#L4-L43)
- [V4__create_audit_logs_table.sql:4-36](file://jmp-web/src/main/resources/db/migration/V4__create_audit_logs_table.sql#L4-L36)
- [V5__create_identity_providers_table.sql:4-45](file://jmp-web/src/main/resources/db/migration/V5__create_identity_providers_table.sql#L4-L45)

## Performance Considerations
- Indexes and unique constraints are defined in schema migrations to optimize frequent queries:
  - Users: email, tenant, status, plus composite external auth index.
  - Tenants: slug, domain, status.
  - Conferences: tenant, status, created_by, scheduled range, room_name unique per tenant.
  - Participants: conference, user, status.
  - Recordings: conference, tenant, status, retention, created desc, tenant+status.
  - Audit logs: tenant, user, event_type, entity, created desc, tenant+created desc, success=false filter.
  - Identity providers: tenant, enabled, tenant+name unique.
- EntityGraph usage in repositories reduces N+1 selects for related entities during reads.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
- Soft-deleted records:
  - User and Conference include deletedAt and status transitions on softDelete(); queries commonly filter by deletedAt IS NULL to exclude soft-deleted rows.
- Status transitions:
  - Conference lifecycle: SCHEDULED → ACTIVE → ENDED/CANCELLED; use start()/end() helpers to maintain correctness.
  - Recording lifecycle: PENDING → PROCESSING → READY/FAILED/ARCHIVED/DELETED; use markReady() to finalize.
- Access control:
  - Role.hasPermission() and Permission constants help validate authorizations; ensure permissions are seeded and roles assigned.
- Audit trails:
  - Use AuditLogRepository search filters and security event queries to investigate failures and suspicious activity.

**Section sources**
- [User.java:112-122](file://jmp-domain/src/main/java/com/jmp/domain/entity/User.java#L112-L122)
- [Conference.java:140-159](file://jmp-domain/src/main/java/com/jmp/domain/entity/Conference.java#L140-L159)
- [Recording.java:140-151](file://jmp-domain/src/main/java/com/jmp/domain/entity/Recording.java#L140-L151)
- [AuditLogRepository.java:44-70](file://jmp-domain/src/main/java/com/jmp/domain/repository/AuditLogRepository.java#L44-L70)
- [V2__seed_data.sql:42-95](file://jmp-web/src/main/resources/db/migration/V2__seed_data.sql#L42-L95)

## Conclusion
The Core Entities form a robust, validated, and audited domain model for the Jitsi Management Platform. They enforce business rules through lifecycle methods, immutability-like value objects (Role and Permission), and schema-level constraints. Repositories complement entities with optimized queries and eager loading strategies. Together, they ensure data integrity, tenant isolation, and scalable access control.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

### Entity Creation, Modification, and Deletion Patterns
- User
  - Creation: set email, names, tenant, optional roles; persist; verify email and 2FA flags as needed.
  - Modification: update personal info, status, and flags; use isActive() for access checks.
  - Deletion: softDelete() to mark deletedAt and status; keep for auditability.
- Conference
  - Creation: set roomName, tenant, createdBy; schedule or start as needed; enable features via flags.
  - Modification: adjust scheduling, options, and participant policies; track participant counts.
  - Deletion: softDelete() to cancel; rely on status transitions for lifecycle.
- Recording
  - Creation: associate with Conference and Tenant; set recordingKey; process and markReady().
  - Modification: update metadata, retention, and download stats; calculateDuration() post-fact.
  - Deletion: softDelete() to archive; enforce retention policies via isWithinRetention().
- AuditLog
  - Creation: capture event context; include old/new values for diffs; set severity and success.
- Tenant
  - Creation: set quotas and settings; activate(); suspend() with reason for governance.
- Role and Permission
  - Creation: seed predefined roles and permissions; assign via role_permissions; check hasPermission() for runtime decisions.
- IdentityProvider
  - Creation: configure endpoints and credentials; enable/disable; map attributes; set default role.
- ConferenceParticipant
  - Creation: link to Conference and optional User; set role/status; markJoined()/markLeft() on events.

**Section sources**
- [User.java:112-130](file://jmp-domain/src/main/java/com/jmp/domain/entity/User.java#L112-L130)
- [Conference.java:140-184](file://jmp-domain/src/main/java/com/jmp/domain/entity/Conference.java#L140-L184)
- [Recording.java:131-161](file://jmp-domain/src/main/java/com/jmp/domain/entity/Recording.java#L131-L161)
- [AuditLog.java:25-136](file://jmp-domain/src/main/java/com/jmp/domain/entity/AuditLog.java#L25-L136)
- [Tenant.java:92-112](file://jmp-domain/src/main/java/com/jmp/domain/entity/Tenant.java#L92-L112)
- [Role.java:79-89](file://jmp-domain/src/main/java/com/jmp/domain/entity/Role.java#L79-L89)
- [Permission.java:100-127](file://jmp-domain/src/main/java/com/jmp/domain/entity/Permission.java#L100-L127)
- [IdentityProvider.java:28-158](file://jmp-domain/src/main/java/com/jmp/domain/entity/IdentityProvider.java#L28-L158)
- [ConferenceParticipant.java:91-109](file://jmp-domain/src/main/java/com/jmp/domain/entity/ConferenceParticipant.java#L91-L109)

### Validation Rules and Business Constraints
- Not-null constraints on critical fields (e.g., email, names, status, room/display names).
- Size limits for strings to prevent overflow.
- Unique constraints enforced by schema:
  - Users.email
  - Tenants.name, slug, domain
  - Conferences.roomName (per tenant)
  - Recordings.recordingKey
  - IdentityProviders.tenant+name
- Enumerations constrain allowable values for status, role types, actions, and resource types.
- Embedded TenantQuotas gate features and capacity.

**Section sources**
- [V1__init_schema.sql:140-163](file://jmp-web/src/main/resources/db/migration/V1__init_schema.sql#L140-L163)
- [V3__create_recordings_table.sql:8-30](file://jmp-web/src/main/resources/db/migration/V3__create_recordings_table.sql#L8-L30)
- [V5__create_identity_providers_table.sql:33-34](file://jmp-web/src/main/resources/db/migration/V5__create_identity_providers_table.sql#L33-L34)