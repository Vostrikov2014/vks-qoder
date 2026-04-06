# Backend Modules

<cite>
**Referenced Files in This Document**
- [pom.xml](file://pom.xml)
- [jmp-web/pom.xml](file://jmp-web/pom.xml)
- [jmp-domain/pom.xml](file://jmp-domain/pom.xml)
- [jmp-application/pom.xml](file://jmp-application/pom.xml)
- [jmp-infrastructure/pom.xml](file://jmp-infrastructure/pom.xml)
- [jmp-api/pom.xml](file://jmp-api/pom.xml)
- [JmpApplication.java](file://jmp-web/src/main/java/com/jmp/web/JmpApplication.java)
- [User.java](file://jmp-domain/src/main/java/com/jmp/domain/entity/User.java)
- [UserRepository.java](file://jmp-domain/src/main/java/com/jmp/domain/repository/UserRepository.java)
- [UserService.java](file://jmp-application/src/main/java/com/jmp/application/service/UserService.java)
- [UserDto.java](file://jmp-application/src/main/java/com/jmp/application/dto/UserDto.java)
- [UserMapper.java](file://jmp-application/src/main/java/com/jmp/application/mapper/UserMapper.java)
- [SecurityConfig.java](file://jmp-infrastructure/src/main/java/com/jmp/infrastructure/security/SecurityConfig.java)
- [UserDetailsServiceImpl.java](file://jmp-infrastructure/src/main/java/com/jmp/infrastructure/security/UserDetailsServiceImpl.java)
- [UserController.java](file://jmp-api/src/main/java/com/jmp/api/controller/UserController.java)
- [GlobalExceptionHandler.java](file://jmp-api/src/main/java/com/jmp/api/advice/GlobalExceptionHandler.java)
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
This document explains the backend module structure of the Jitsi Management Platform (JMP). The system follows a clean architecture with four focused modules:
- jmp-domain: Core business entities, value objects, repositories, and domain events
- jmp-application: Business logic, services, DTOs, mappers, validators, and use cases
- jmp-infrastructure: Security, persistence, messaging, caching, external integrations, and monitoring
- jmp-api: REST controllers, DTOs, exception handling, and API documentation

These modules are orchestrated by a parent Maven aggregator and a web application module that wires them together. The design enforces separation of concerns, testability, and maintainability while enabling clear integration patterns.

## Project Structure
The repository is a multi-module Maven project centered around a parent POM that defines shared properties, dependency management, and build plugins. Each module encapsulates a layer of responsibility and declares explicit dependencies on other modules.

```mermaid
graph TB
Parent["Parent POM<br/>Shared properties and plugins"] --> Domain["jmp-domain<br/>Entities, repositories"]
Parent --> Application["jmp-application<br/>Services, DTOs, mappers"]
Parent --> Infrastructure["jmp-infrastructure<br/>Security, persistence, messaging"]
Parent --> Api["jmp-api<br/>Controllers, exceptions, docs"]
Parent --> Web["jmp-web<br/>Spring Boot app entry"]
Web --> Api
Api --> Application
Api --> Infrastructure
Application --> Domain
Infrastructure --> Domain
```

**Diagram sources**
- [pom.xml:40-46](file://pom.xml#L40-L46)
- [jmp-web/pom.xml:18-35](file://jmp-web/pom.xml#L18-L35)
- [jmp-api/pom.xml:17-28](file://jmp-api/pom.xml#L17-L28)
- [jmp-application/pom.xml:17-22](file://jmp-application/pom.xml#L17-L22)
- [jmp-infrastructure/pom.xml:17-28](file://jmp-infrastructure/pom.xml#L17-L28)

Key characteristics:
- Parent POM centralizes Java version, Spring Boot version, and dependency versions
- Module dependencies are declared explicitly via Maven dependencies
- jmp-web depends on jmp-api and Spring Boot starters
- jmp-api depends on jmp-application and jmp-infrastructure
- jmp-application depends on jmp-domain
- jmp-infrastructure depends on jmp-domain and jmp-application

**Section sources**
- [pom.xml:40-46](file://pom.xml#L40-L46)
- [pom.xml:79-167](file://pom.xml#L79-L167)
- [jmp-web/pom.xml:18-35](file://jmp-web/pom.xml#L18-L35)
- [jmp-api/pom.xml:17-28](file://jmp-api/pom.xml#L17-L28)
- [jmp-application/pom.xml:17-22](file://jmp-application/pom.xml#L17-L22)
- [jmp-infrastructure/pom.xml:17-28](file://jmp-infrastructure/pom.xml#L17-L28)

## Core Components
This section outlines the responsibilities and key components of each module.

- jmp-domain
  - Responsibilities: Define core business entities, value objects, and repository interfaces. Encapsulate persistence contracts and domain-specific validations.
  - Examples: User entity, UserRepository interface, and related domain enums and annotations.
  - Notable files: [User.java](file://jmp-domain/src/main/java/com/jmp/domain/entity/User.java), [UserRepository.java](file://jmp-domain/src/main/java/com/jmp/domain/repository/UserRepository.java)

- jmp-application
  - Responsibilities: Implement business logic, orchestrate use cases, provide DTOs, mappers, and validators. Coordinate with infrastructure services.
  - Examples: UserService for user lifecycle operations, UserDto for request/response shapes, UserMapper for entity-to-DTO transformations.
  - Notable files: [UserService.java](file://jmp-application/src/main/java/com/jmp/application/service/UserService.java), [UserDto.java](file://jmp-application/src/main/java/com/jmp/application/dto/UserDto.java), [UserMapper.java](file://jmp-application/src/main/java/com/jmp/application/mapper/UserMapper.java)

- jmp-infrastructure
  - Responsibilities: Implement cross-cutting concerns such as security, persistence configuration, external integrations (e.g., S3), caching, messaging, resilience, and monitoring.
  - Examples: SecurityConfig for HTTP security and CORS, UserDetailsServiceImpl for Spring Security integration, and starter dependencies for Redis, WebFlux, Actuator, and Prometheus.
  - Notable files: [SecurityConfig.java](file://jmp-infrastructure/src/main/java/com/jmp/infrastructure/security/SecurityConfig.java), [UserDetailsServiceImpl.java](file://jmp-infrastructure/src/main/java/com/jmp/infrastructure/security/UserDetailsServiceImpl.java)

- jmp-api
  - Responsibilities: Expose REST endpoints, manage API documentation, and provide global exception handling conforming to RFC 7807 Problem Details.
  - Examples: UserController for user operations, GlobalExceptionHandler for standardized error responses.
  - Notable files: [UserController.java](file://jmp-api/src/main/java/com/jmp/api/controller/UserController.java), [GlobalExceptionHandler.java](file://jmp-api/src/main/java/com/jmp/api/advice/GlobalExceptionHandler.java)

**Section sources**
- [User.java:18-164](file://jmp-domain/src/main/java/com/jmp/domain/entity/User.java#L18-L164)
- [UserRepository.java:14-82](file://jmp-domain/src/main/java/com/jmp/domain/repository/UserRepository.java#L14-L82)
- [UserService.java:24-190](file://jmp-application/src/main/java/com/jmp/application/service/UserService.java#L24-L190)
- [UserDto.java:10-97](file://jmp-application/src/main/java/com/jmp/application/dto/UserDto.java#L10-L97)
- [UserMapper.java:14-76](file://jmp-application/src/main/java/com/jmp/application/mapper/UserMapper.java#L14-L76)
- [SecurityConfig.java:24-90](file://jmp-infrastructure/src/main/java/com/jmp/infrastructure/security/SecurityConfig.java#L24-L90)
- [UserDetailsServiceImpl.java:15-48](file://jmp-infrastructure/src/main/java/com/jmp/infrastructure/security/UserDetailsServiceImpl.java#L15-L48)
- [UserController.java:29-123](file://jmp-api/src/main/java/com/jmp/api/controller/UserController.java#L29-L123)
- [GlobalExceptionHandler.java:18-130](file://jmp-api/src/main/java/com/jmp/api/advice/GlobalExceptionHandler.java#L18-L130)

## Architecture Overview
The backend follows a layered architecture with clear boundaries:
- Domain layer defines the model and repository contracts
- Application layer implements business services and DTOs
- Infrastructure layer handles persistence, security, and external systems
- API layer exposes REST endpoints and manages documentation and error handling
- Web module bootstraps the application and enables JPA scanning

```mermaid
graph TB
subgraph "API Layer"
UC["UserController"]
GEH["GlobalExceptionHandler"]
end
subgraph "Application Layer"
USvc["UserService"]
UDto["UserDto"]
UMap["UserMapper"]
end
subgraph "Infrastructure Layer"
SecCfg["SecurityConfig"]
UDS["UserDetailsServiceImpl"]
end
subgraph "Domain Layer"
Ent["User Entity"]
Repo["UserRepository"]
end
subgraph "Bootstrap"
App["JmpApplication"]
end
UC --> USvc
GEH --> UC
USvc --> UDto
USvc --> UMap
USvc --> Repo
UMap --> Ent
SecCfg --> UDS
App --> UC
App --> USvc
App --> Repo
```

**Diagram sources**
- [UserController.java:33-123](file://jmp-api/src/main/java/com/jmp/api/controller/UserController.java#L33-L123)
- [GlobalExceptionHandler.java:22-130](file://jmp-api/src/main/java/com/jmp/api/advice/GlobalExceptionHandler.java#L22-L130)
- [UserService.java:28-190](file://jmp-application/src/main/java/com/jmp/application/service/UserService.java#L28-L190)
- [UserDto.java:14-97](file://jmp-application/src/main/java/com/jmp/application/dto/UserDto.java#L14-L97)
- [UserMapper.java:18-76](file://jmp-application/src/main/java/com/jmp/application/mapper/UserMapper.java#L18-L76)
- [User.java:23-164](file://jmp-domain/src/main/java/com/jmp/domain/entity/User.java#L23-L164)
- [UserRepository.java:18-82](file://jmp-domain/src/main/java/com/jmp/domain/repository/UserRepository.java#L18-L82)
- [SecurityConfig.java:28-90](file://jmp-infrastructure/src/main/java/com/jmp/infrastructure/security/SecurityConfig.java#L28-L90)
- [UserDetailsServiceImpl.java:19-48](file://jmp-infrastructure/src/main/java/com/jmp/infrastructure/security/UserDetailsServiceImpl.java#L19-L48)
- [JmpApplication.java:11-27](file://jmp-web/src/main/java/com/jmp/web/JmpApplication.java#L11-L27)

## Detailed Component Analysis

### Domain Layer: User Entity and Repository
The domain layer encapsulates the core business model and persistence contracts. The User entity models platform users with tenant scoping, role-based access control, and audit metadata. The UserRepository defines queries and fetch strategies for efficient loading of associated data.

```mermaid
classDiagram
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
+hasRole(roleName) boolean
}
class UserRepository {
+findByEmail(email) Optional~User~
+findActiveByEmail(email) Optional~User~
+findWithRolesById(id) Optional~User~
+existsByEmailAndDeletedAtIsNull(email) boolean
+findByTenantIdAndDeletedAtIsNull(tenantId, pageable) Page~User~
+searchByTenantId(tenantId, search, pageable) Page~User~
+countByTenantIdAndStatusAndDeletedAtIsNull(tenantId, status) long
+existsByIdAndTenantIdAndDeletedAtIsNull(id, tenantId) boolean
+findByEmailAndTenantId(email, tenantId) Optional~User~
+findByExternalAuthIdAndExternalAuthProvider(id, provider) Optional~User~
}
UserRepository --> User : "operates on"
```

**Diagram sources**
- [User.java:23-164](file://jmp-domain/src/main/java/com/jmp/domain/entity/User.java#L23-L164)
- [UserRepository.java:18-82](file://jmp-domain/src/main/java/com/jmp/domain/repository/UserRepository.java#L18-L82)

**Section sources**
- [User.java:18-164](file://jmp-domain/src/main/java/com/jmp/domain/entity/User.java#L18-L164)
- [UserRepository.java:14-82](file://jmp-domain/src/main/java/com/jmp/domain/repository/UserRepository.java#L14-L82)

### Application Layer: User Service and DTOs
The application layer implements business operations and data transfer objects. UserService orchestrates user creation, retrieval, updates, and deletion, leveraging repositories and mappers. It also integrates with Spring Security for password encoding and role resolution. DTOs define strict request/response contracts, and UserMapper transforms between entities and DTOs.

```mermaid
classDiagram
class UserService {
+createUser(tenantId, request) UserDto.Response
+getUser(id) UserDto.Response
+getUserByEmail(email) UserDto.Response
+listUsers(tenantId, pageable) Page~UserDto.Summary~
+searchUsers(tenantId, search, pageable) Page~UserDto.Summary~
+updateUser(id, request) UserDto.Response
+deleteUser(id) void
+recordLogin(userId) void
+hasPermission(userId, permission) boolean
-resolveRoles(roleNames, tenant) Set~Role~
}
class UserDto {
}
class UserDto_CreateRequest
class UserDto_UpdateRequest
class UserDto_Response
class UserDto_Summary
class UserMapper {
+toResponse(user) UserDto.Response
+toSummary(user) UserDto.Summary
+toEntity(dto) User
+updateEntityFromDto(dto, target) void
}
UserService --> UserDto : "produces/consumes"
UserService --> UserMapper : "uses"
UserMapper --> UserDto : "maps to/from"
```

**Diagram sources**
- [UserService.java:28-190](file://jmp-application/src/main/java/com/jmp/application/service/UserService.java#L28-L190)
- [UserDto.java:14-97](file://jmp-application/src/main/java/com/jmp/application/dto/UserDto.java#L14-L97)
- [UserMapper.java:18-76](file://jmp-application/src/main/java/com/jmp/application/mapper/UserMapper.java#L18-L76)

**Section sources**
- [UserService.java:24-190](file://jmp-application/src/main/java/com/jmp/application/service/UserService.java#L24-L190)
- [UserDto.java:10-97](file://jmp-application/src/main/java/com/jmp/application/dto/UserDto.java#L10-L97)
- [UserMapper.java:14-76](file://jmp-application/src/main/java/com/jmp/application/mapper/UserMapper.java#L14-L76)

### Infrastructure Layer: Security and User Details
Security is configured at the infrastructure layer with stateless sessions, method-level security, and JWT filter integration. UserDetailsService loads user principals by ID (from JWT subject) and constructs authorities from roles.

```mermaid
classDiagram
class SecurityConfig {
+securityFilterChain(http) SecurityFilterChain
+passwordEncoder() PasswordEncoder
+authenticationManager() AuthenticationManager
+corsConfigurationSource() CorsConfigurationSource
}
class UserDetailsServiceImpl {
+loadUserByUsername(userId) UserDetails
}
SecurityConfig --> UserDetailsServiceImpl : "configured with"
```

**Diagram sources**
- [SecurityConfig.java:28-90](file://jmp-infrastructure/src/main/java/com/jmp/infrastructure/security/SecurityConfig.java#L28-L90)
- [UserDetailsServiceImpl.java:19-48](file://jmp-infrastructure/src/main/java/com/jmp/infrastructure/security/UserDetailsServiceImpl.java#L19-L48)

**Section sources**
- [SecurityConfig.java:24-90](file://jmp-infrastructure/src/main/java/com/jmp/infrastructure/security/SecurityConfig.java#L24-L90)
- [UserDetailsServiceImpl.java:15-48](file://jmp-infrastructure/src/main/java/com/jmp/infrastructure/security/UserDetailsServiceImpl.java#L15-L48)

### API Layer: Controllers and Exception Handling
The API layer exposes REST endpoints and standardizes error responses. UserController delegates to UserService and enforces role-based access control. GlobalExceptionHandler produces RFC 7807 Problem Details for consistent error reporting.

```mermaid
sequenceDiagram
participant Client as "Client"
participant Ctrl as "UserController"
participant Svc as "UserService"
participant Repo as "UserRepository"
Client->>Ctrl : POST /api/v1/users
Ctrl->>Svc : createUser(tenantId, request)
Svc->>Repo : save(user)
Repo-->>Svc : persisted user
Svc-->>Ctrl : UserDto.Response
Ctrl-->>Client : 201 Created
```

**Diagram sources**
- [UserController.java:43-55](file://jmp-api/src/main/java/com/jmp/api/controller/UserController.java#L43-L55)
- [UserService.java:44-70](file://jmp-application/src/main/java/com/jmp/application/service/UserService.java#L44-L70)
- [UserRepository.java:18-82](file://jmp-domain/src/main/java/com/jmp/domain/repository/UserRepository.java#L18-L82)

**Section sources**
- [UserController.java:29-123](file://jmp-api/src/main/java/com/jmp/api/controller/UserController.java#L29-L123)
- [GlobalExceptionHandler.java:18-130](file://jmp-api/src/main/java/com/jmp/api/advice/GlobalExceptionHandler.java#L18-L130)

### Conceptual Overview
The following conceptual flow illustrates how a request moves through the system from API to persistence and back.

```mermaid
flowchart TD
Start(["Incoming Request"]) --> Auth["Security Filter Chain"]
Auth --> Controller["Controller Endpoint"]
Controller --> Service["Application Service"]
Service --> Mapper["DTO Mapping"]
Service --> Repo["Domain Repository"]
Repo --> DB["Database"]
DB --> Repo
Repo --> Service
Service --> Mapper
Service --> Controller
Controller --> Response(["HTTP Response"])
Auth --> |Unauthorized/Forbidden| Error["Global Exception Handler"]
Error --> Response
```

[No sources needed since this diagram shows conceptual workflow, not actual code structure]

## Dependency Analysis
Module dependencies are declared explicitly in each module’s POM. The parent POM centralizes dependency versions and plugin configurations, ensuring consistency across modules.

```mermaid
graph LR
Domain["jmp-domain"] --> |depends on| Persistence["Jakarta Persistence<br/>Spring Data JPA"]
Domain --> Validation["Jakarta Validation"]
Domain --> SecurityCore["Spring Security Core"]
Application["jmp-application"] --> Domain
Application --> SpringContext["Spring Context"]
Application --> SecurityCrypto["Spring Security Crypto"]
Application --> SecurityCore2["Spring Security Core"]
Application --> MapStruct["MapStruct"]
Application --> JWT["JWT API"]
Application --> Validation2["Jakarta Validation"]
Application --> Logging["SLF4J API"]
Application --> Web["Spring Web"]
Infrastructure["jmp-infrastructure"] --> Domain
Infrastructure --> Application
Infrastructure --> JPA["Spring Data JPA Starter"]
Infrastructure --> SecurityStarter["Spring Security Starter"]
Infrastructure --> WebStarter["Spring Web Starter"]
Infrastructure --> Redis["Spring Data Redis"]
Infrastructure --> WebFlux["Spring WebFlux"]
Infrastructure --> Postgres["PostgreSQL Driver"]
Infrastructure --> Flyway["Flyway Core/PostgreSQL"]
Infrastructure --> JWTImpl["JWT Impl/Jackson"]
Infrastructure --> Resilience4j["Resilience4j"]
Infrastructure --> Bucket4j["Bucket4j"]
Infrastructure --> S3["AWS S3 SDK"]
Infrastructure --> WS["WebSocket Starter"]
Infrastructure --> OAuth2["OAuth2 Client Starter"]
Infrastructure --> Actuator["Actuator Starter"]
Infrastructure --> Micrometer["Micrometer Prometheus"]
Api["jmp-api"] --> Application
Api --> Infrastructure
Api --> WebStarter2["Spring Web Starter"]
Api --> SecurityStarter2["Spring Security Starter"]
Api --> Validation3["Spring Validation Starter"]
Api --> OpenAPI["SpringDoc OpenAPI"]
Api --> WS2["WebSocket Starter"]
Web["jmp-web"] --> Api
Web --> WebStarter3["Spring Web Starter"]
Web --> Actuator2["Actuator Starter"]
```

**Diagram sources**
- [jmp-domain/pom.xml:17-53](file://jmp-domain/pom.xml#L17-L53)
- [jmp-application/pom.xml:17-71](file://jmp-application/pom.xml#L17-L71)
- [jmp-infrastructure/pom.xml:17-147](file://jmp-infrastructure/pom.xml#L17-L147)
- [jmp-api/pom.xml:17-59](file://jmp-api/pom.xml#L17-L59)
- [jmp-web/pom.xml:18-35](file://jmp-web/pom.xml#L18-L35)

**Section sources**
- [pom.xml:79-167](file://pom.xml#L79-L167)
- [jmp-domain/pom.xml:17-53](file://jmp-domain/pom.xml#L17-L53)
- [jmp-application/pom.xml:17-71](file://jmp-application/pom.xml#L17-L71)
- [jmp-infrastructure/pom.xml:17-147](file://jmp-infrastructure/pom.xml#L17-L147)
- [jmp-api/pom.xml:17-59](file://jmp-api/pom.xml#L17-L59)
- [jmp-web/pom.xml:18-35](file://jmp-web/pom.xml#L18-L35)

## Performance Considerations
- Entity graph fetching: UserRepository uses @EntityGraph to eagerly load roles and permissions, reducing N+1 queries during user retrieval.
- Pagination: UserService leverages Pageable for scalable listing and search operations.
- Password hashing: BCrypt encoder with a cost factor is configured in SecurityConfig for secure but efficient hashing.
- Caching and rate limiting: Bucket4j and Redis are available in infrastructure for request throttling and caching strategies.
- Observability: Micrometer with Prometheus and Spring Boot Actuator enable metrics collection and health checks.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common areas to inspect when diagnosing issues:
- Authentication failures: Review SecurityConfig for filter chain and password encoder configuration; check UserDetailsServiceImpl for user loading and role mapping.
- Validation errors: GlobalExceptionHandler maps constraint violations and binding errors to structured Problem Details responses.
- Repository access: Verify JPA repositories are enabled and scanned by JmpApplication; confirm EntityScan and EnableJpaRepositories are set.
- Build and dependency issues: Confirm parent POM property alignment and dependencyManagement entries; ensure module POMs declare correct dependencies.

**Section sources**
- [SecurityConfig.java:42-90](file://jmp-infrastructure/src/main/java/com/jmp/infrastructure/security/SecurityConfig.java#L42-L90)
- [UserDetailsServiceImpl.java:25-48](file://jmp-infrastructure/src/main/java/com/jmp/infrastructure/security/UserDetailsServiceImpl.java#L25-L48)
- [GlobalExceptionHandler.java:26-130](file://jmp-api/src/main/java/com/jmp/api/advice/GlobalExceptionHandler.java#L26-L130)
- [JmpApplication.java:15-21](file://jmp-web/src/main/java/com/jmp/web/JmpApplication.java#L15-L21)

## Conclusion
The Jitsi Management Platform backend employs a clean, modular architecture that separates business logic, persistence, infrastructure concerns, and API exposure. The parent Maven configuration ensures consistent dependency and build management across modules. Explicit module dependencies enforce clear boundaries, while Spring Boot auto-configuration and MapStruct streamline development. This design supports scalability, testability, and maintainability.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

### Maven Configuration Highlights
- Parent POM
  - Centralized properties for Java and Spring Boot versions
  - Dependency management for all modules and third-party libraries
  - Shared plugin management for compilation, testing, and quality gates
- Module POMs
  - jmp-domain: Declares persistence and validation dependencies
  - jmp-application: Depends on jmp-domain and adds application-layer libraries
  - jmp-infrastructure: Depends on jmp-domain and jmp-application plus infrastructure starters
  - jmp-api: Depends on jmp-application and jmp-infrastructure plus web and documentation
  - jmp-web: Depends on jmp-api and Spring Boot starters for packaging

**Section sources**
- [pom.xml:48-77](file://pom.xml#L48-L77)
- [pom.xml:79-167](file://pom.xml#L79-L167)
- [jmp-domain/pom.xml:17-53](file://jmp-domain/pom.xml#L17-L53)
- [jmp-application/pom.xml:17-71](file://jmp-application/pom.xml#L17-L71)
- [jmp-infrastructure/pom.xml:17-147](file://jmp-infrastructure/pom.xml#L17-L147)
- [jmp-api/pom.xml:17-59](file://jmp-api/pom.xml#L17-L59)
- [jmp-web/pom.xml:18-35](file://jmp-web/pom.xml#L18-L35)