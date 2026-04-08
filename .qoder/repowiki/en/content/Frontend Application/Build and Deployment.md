# Build and Deployment

<cite>
**Referenced Files in This Document**
- [package.json](file://jmp-ui/package.json)
- [vite.config.ts](file://jmp-ui/vite.config.ts)
- [tsconfig.json](file://jmp-ui/tsconfig.json)
- [tsconfig.app.json](file://jmp-ui/tsconfig.app.json)
- [tsconfig.node.json](file://jmp-ui/tsconfig.node.json)
- [eslint.config.js](file://jmp-ui/eslint.config.js)
- [Dockerfile (UI)](file://jmp-ui/Dockerfile)
- [nginx.conf](file://jmp-ui/nginx.conf)
- [docker-compose.yml](file://docker-compose.yml)
- [Dockerfile (Backend)](file://Dockerfile)
- [pom.xml](file://pom.xml)
- [jmp-application/pom.xml](file://jmp-application/pom.xml)
- [UserMapper.java](file://jmp-application/src/main/java/com/jmp/application/mapper/UserMapper.java)
- [UserDto.java](file://jmp-application/src/main/java/com/jmp/application/dto/UserDto.java)
- [User.java](file://jmp-domain/src/main/java/com/jmp/domain/entity/User.java)
- [UserService.java](file://jmp-application/src/main/java/com/jmp/application/service/UserService.java)
- [prometheus.yml](file://monitoring/prometheus.yml)
- [datasources.yml](file://monitoring/grafana/datasources/datasources.yml)
</cite>

## Update Summary
**Changes Made**
- Updated backend build configuration to reflect MapStruct processor integration for compile-time object mapping code generation
- Added Lombok annotation processing configuration for automatic getter/setter generation
- Enhanced Maven compiler plugin configuration with MapStruct and Lombok processors
- Updated architecture diagrams to show compile-time code generation workflow
- Added new sections documenting MapStruct DTO mapping strategy and Lombok annotation processing

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
This document explains the frontend build configuration and deployment process for the React-based UI module (jmp-ui) along with the backend Java build configuration featuring MapStruct processor integration and Lombok annotation processing. It covers Vite configuration, TypeScript setup, Maven build with annotation processors, Docker containerization, nginx static serving, and production deployment strategies. The platform has been modernized with React 19, Material UI 7, Zustand for state management, Framer Motion for animations, and Recharts for data visualization. The backend leverages MapStruct for compile-time object mapping code generation and Lombok for reducing boilerplate code through annotation processing.

## Project Structure
The frontend build and deployment artifacts are centered in the jmp-ui module, while the backend build configuration is managed through Maven with comprehensive annotation processor setup. Key files include:
- Build and dev scripts, dependencies, and plugin configuration for the frontend
- Vite configuration for React 19 with modern plugin stack
- TypeScript configurations for app and node contexts with ES2023 targets
- ESLint flat config for linting with TypeScript and React Refresh
- Dockerfile for multi-stage build and nginx serving
- Nginx configuration for static assets, caching, compression, SPA routing, and API proxying
- docker-compose orchestration for frontend, backend, databases, and monitoring
- Maven parent POM with MapStruct and Lombok processor configuration
- Module-specific Maven configurations with annotation processor paths

```mermaid
graph TB
subgraph "Frontend Module (jmp-ui)"
PKG["package.json<br/>React 19, Material UI 7"]
VCFG["vite.config.ts<br/>Modern React Plugin"]
TSC_APP["tsconfig.app.json<br/>ES2023 Target"]
TSC_NODE["tsconfig.node.json<br/>ES2023 Target"]
ESLINT["eslint.config.js<br/>Flat Config"]
DOCKER_UI["Dockerfile (UI)<br/>Multi-stage Build"]
NGINX["nginx.conf<br/>Compression & Caching"]
end
subgraph "Backend Build Configuration"
POM["pom.xml<br/>Parent POM with Processors"]
APP_POM["jmp-application/pom.xml<br/>Module Processors"]
MAPPER["UserMapper.java<br/>MapStruct Interface"]
DTO["UserDto.java<br/>Sealed DTO Records"]
ENTITY["User.java<br/>Lombok Entity"]
SERVICE["UserService.java<br/>Service Layer"]
end
subgraph "Orchestration"
DCMP["docker-compose.yml<br/>Improved Restart Policies"]
end
subgraph "Backend Module"
DOCKER_BE["Dockerfile (Backend)<br/>Multi-stage Maven Build"]
end
subgraph "Monitoring"
PROM["prometheus.yml<br/>Metrics Scraping"]
DS["datasources.yml<br/>Grafana Datasource"]
end
PKG --> VCFG
VCFG --> TSC_APP
VCFG --> ESLINT
DOCKER_UI --> NGINX
DCMP --> DOCKER_UI
DCMP --> DOCKER_BE
DCMP --> PROM
DCMP --> DS
POM --> MAPPER
POM --> APP_POM
MAPPER --> DTO
MAPPER --> ENTITY
SERVICE --> MAPPER
```

**Diagram sources**
- [package.json:12-26](file://jmp-ui/package.json#L12-L26)
- [vite.config.ts:1-8](file://jmp-ui/vite.config.ts#L1-8)
- [tsconfig.app.json:4-6](file://jmp-ui/tsconfig.app.json#L4-6)
- [tsconfig.node.json:4-6](file://jmp-ui/tsconfig.node.json#L4-6)
- [eslint.config.js:1-24](file://jmp-ui/eslint.config.js#L1-24)
- [Dockerfile (UI):1-33](file://jmp-ui/Dockerfile#L1-33)
- [nginx.conf:1-37](file://jmp-ui/nginx.conf#L1-37)
- [pom.xml:201-233](file://pom.xml#L201-L233)
- [jmp-application/pom.xml:79-105](file://jmp-application/pom.xml#L79-L105)
- [UserMapper.java:18-21](file://jmp-application/src/main/java/com/jmp/application/mapper/UserMapper.java#L18-L21)
- [UserDto.java:14](file://jmp-application/src/main/java/com/jmp/application/dto/UserDto.java#L14)
- [User.java:23-28](file://jmp-domain/src/main/java/com/jmp/domain/entity/User.java#L23-L28)
- [UserService.java:28-38](file://jmp-application/src/main/java/com/jmp/application/service/UserService.java#L28-L38)
- [docker-compose.yml:11, 32, 51, 92:11-11](file://docker-compose.yml#L11-L11)
- [Dockerfile (Backend):1-54](file://Dockerfile#L1-54)
- [prometheus.yml:18-22](file://monitoring/prometheus.yml#L18-22)
- [datasources.yml:4-10](file://monitoring/grafana/datasources/datasources.yml#L4-10)

**Section sources**
- [package.json:1-42](file://jmp-ui/package.json#L1-L42)
- [vite.config.ts:1-8](file://jmp-ui/vite.config.ts#L1-L8)
- [tsconfig.json:1-8](file://jmp-ui/tsconfig.json#L1-L8)
- [tsconfig.app.json:1-26](file://jmp-ui/tsconfig.app.json#L1-L26)
- [tsconfig.node.json:1-25](file://jmp-ui/tsconfig.node.json#L1-L25)
- [eslint.config.js:1-24](file://jmp-ui/eslint.config.js#L1-L24)
- [Dockerfile (UI):1-33](file://jmp-ui/Dockerfile#L1-L33)
- [nginx.conf:1-37](file://jmp-ui/nginx.conf#L1-L37)
- [docker-compose.yml:1-353](file://docker-compose.yml#L1-L353)
- [Dockerfile (Backend):1-54](file://Dockerfile#L1-L54)
- [pom.xml:1-332](file://pom.xml#L1-L332)
- [jmp-application/pom.xml:1-107](file://jmp-application/pom.xml#L1-L107)
- [prometheus.yml:1-23](file://monitoring/prometheus.yml#L1-L23)
- [datasources.yml:1-11](file://monitoring/grafana/datasources/datasources.yml#L1-L11)

## Core Components
- **Vite Build and Dev Server**: Single-plugin React setup with React 19 support and modern plugin stack.
- **TypeScript**: ES2023-targeted configurations for app and node contexts with bundler-mode resolution.
- **Linting**: ESLint flat config with recommended rulesets for TypeScript, React hooks, and React Refresh.
- **Docker (UI)**: Multi-stage build producing optimized static assets served by nginx with improved restart policies.
- **Nginx**: Compression, long-lived caching for static assets, SPA routing fallback, and API proxy to backend.
- **Orchestration**: docker-compose defines services with enhanced restart policies, environment variables, port mappings, and network connectivity.
- **Backend Build**: Maven configuration with MapStruct processor for compile-time object mapping code generation and Lombok annotation processing for boilerplate reduction.

**Section sources**
- [vite.config.ts:1-8](file://jmp-ui/vite.config.ts#L1-L8)
- [tsconfig.app.json:4-6](file://jmp-ui/tsconfig.app.json#L4-L6)
- [tsconfig.node.json:4-6](file://jmp-ui/tsconfig.node.json#L4-L6)
- [eslint.config.js:1-24](file://jmp-ui/eslint.config.js#L1-L24)
- [Dockerfile (UI):1-33](file://jmp-ui/Dockerfile#L1-L33)
- [nginx.conf:1-37](file://jmp-ui/nginx.conf#L1-L37)
- [docker-compose.yml:11, 32, 51, 92:11-11](file://docker-compose.yml#L11-L11)
- [pom.xml:201-233](file://pom.xml#L201-L233)

## Architecture Overview
The frontend build pipeline produces static assets packaged inside an nginx container with enhanced restart policies. The UI service proxies API traffic to the backend service. The backend build process leverages Maven annotation processors to generate MapStruct mapping implementations and Lombok boilerplate code at compile time. Monitoring services collect metrics from the backend with improved configuration.

```mermaid
graph TB
Dev["Developer Machine"]
ViteDev["Vite Dev Server<br/>React 19<br/>Port 5174"]
Nginx["Nginx Static Server<br/>ES2023 Targets<br/>Port 80"]
API["Backend API Service<br/>Material UI 7<br/>Port 8080"]
Postgres["PostgreSQL<br/>Restart: unless-stopped"]
Redis["Redis<br/>Restart: unless-stopped"]
Prom["Prometheus<br/>Improved Metrics"]
Graf["Grafana<br/>Enhanced Datasource"]
MapStruct["MapStruct Processor<br/>Compile-time Mapping"]
Lombok["Lombok Processor<br/>Boilerplate Generation"]
Dev --> |"npm run dev"| ViteDev
ViteDev --> |"Build"| Nginx
Nginx --> |"SPA fallback"| Nginx
Nginx --> |"Proxy /api/"| API
API --> Postgres
API --> Redis
API --> MapStruct
API --> Lombok
Prom --> |"Scrape /actuator/prometheus"| API
Graf --> |"Datasource: Prometheus"| Prom
```

**Diagram sources**
- [docker-compose.yml:11, 32, 51, 92:11-11](file://docker-compose.yml#L11-L11)
- [nginx.conf:24-35](file://jmp-ui/nginx.conf#L24-L35)
- [prometheus.yml:18-22](file://monitoring/prometheus.yml#L18-22)
- [datasources.yml:4-10](file://monitoring/grafana/datasources/datasources.yml#L4-10)
- [pom.xml:211-227](file://pom.xml#L211-L227)

## Detailed Component Analysis

### Vite Configuration and Build Pipeline
- **Plugin Stack**: React plugin integrated via Vite with React 19 support.
- **Build Script**: TypeScript project references compiled first, followed by Vite build for optimized production assets.
- **Dev Script**: Starts Vite dev server with default behavior.
- **Preview Script**: Serves the built assets locally for preview.

**Updated** Enhanced with React 19 support and modern plugin configuration.

Optimization and asset handling:
- Vite's default bundler handles code splitting and asset optimization.
- Assets under public are copied as-is; dynamic imports and module resolution are handled by Vite.
- Environment variables prefixed with VITE_ are embedded at build time; others are ignored.

Development server:
- Default host/port behavior is used; port mapping is configured in docker-compose.

**Section sources**
- [package.json:6-11](file://jmp-ui/package.json#L6-L11)
- [vite.config.ts:1-8](file://jmp-ui/vite.config.ts#L1-L8)

### TypeScript Configuration
- **Root tsconfig**: Aggregates app and node configs.
- **App config**: Targets ES2023, uses bundler module resolution, JSX transform, and strictness flags suitable for Vite.
- **Node config**: Targets ES2023 for tooling and Vite config types.

**Updated** Migrated to ES2023 targets for modern JavaScript features and improved performance.

Recommendations:
- Keep target aligned with deployed browsers.
- Preserve bundler mode for Vite compatibility.

**Section sources**
- [tsconfig.json:1-8](file://jmp-ui/tsconfig.json#L1-L8)
- [tsconfig.app.json:4-6](file://jmp-ui/tsconfig.app.json#L4-L6)
- [tsconfig.node.json:4-6](file://jmp-ui/tsconfig.node.json#L4-L6)

### Linting Setup
- **ESLint Flat Config**: Enables recommended rules for TypeScript, React hooks, and React Refresh.
- **Ignores**: Dist folder automatically ignored.

**Updated** Enhanced with modern ESLint flat configuration and improved plugin support.

Best practices:
- Run lint checks in CI and pre-commit hooks.
- Keep rules consistent across contributors.

**Section sources**
- [eslint.config.js:1-24](file://jmp-ui/eslint.config.js#L1-L24)

### Backend Build Configuration with Annotation Processors
**Updated** Enhanced with comprehensive MapStruct and Lombok processor integration.

**Maven Compiler Plugin Configuration**:
- **Java Version**: Targets Java 21 for modern language features
- **Annotation Processors**: Configured with MapStruct processor and Lombok processor
- **Compiler Arguments**: 
  - `-Amapstruct.defaultComponentModel=spring`: Generates Spring-managed mappers
  - `-Amapstruct.unmappedTargetPolicy=ERROR`: Enforces strict mapping validation

**Module-Specific Configuration**:
- **jmp-application**: Inherits parent configuration with additional MapStruct dependencies
- **Processors Path**: Includes Lombok, MapStruct processor, and lombok-mapstruct-binding

**MapStruct Integration**:
- **Compile-time Code Generation**: Generates implementation classes for mapper interfaces
- **Spring Component Model**: Integrates with Spring IoC container
- **Null Safety**: Configured with NullValuePropertyMappingStrategy.IGNORE

**Lombok Integration**:
- **Automatic Getter/Setter Generation**: Reduces boilerplate code in entities and DTOs
- **Entity Auditing**: Supports @CreatedDate and @LastModifiedDate annotations
- **RequiredArgsConstructor**: Generated constructor with required fields

**Section sources**
- [pom.xml:201-233](file://pom.xml#L201-L233)
- [pom.xml:48-77](file://pom.xml#L48-L77)
- [pom.xml:139-149](file://pom.xml#L139-L149)
- [jmp-application/pom.xml:79-105](file://jmp-application/pom.xml#L79-L105)

### MapStruct DTO Mapping Strategy
**Updated** Enhanced with compile-time code generation workflow.

**Implementation Pattern**:
- **Interface-Based Mappers**: Uses MapStruct interfaces with @Mapper annotation
- **Component Model**: Configured as "spring" for Spring-managed bean creation
- **Null Value Strategy**: IGNORE for safe property mapping
- **Custom Mappings**: Named methods for complex transformations (e.g., rolesToStrings)

**Generated Code Benefits**:
- **Zero Runtime Overhead**: Generated code replaces reflection-based mapping
- **Type Safety**: Compile-time validation of mapping configurations
- **Performance**: Direct field assignment vs. reflection-based copying
- **Maintainability**: Centralized mapping logic in single interface

**Example Usage**:
- **User Creation**: Map CreateRequest DTO to User entity with ignored audit fields
- **User Update**: Partial updates using @MappingTarget for existing entities
- **Response Transformation**: Convert entities to DTOs with computed properties

**Section sources**
- [UserMapper.java:18-75](file://jmp-application/src/main/java/com/jmp/application/mapper/UserMapper.java#L18-L75)
- [UserDto.java:14-96](file://jmp-application/src/main/java/com/jmp/application/dto/UserDto.java#L14-L96)
- [UserService.java:44-70](file://jmp-application/src/main/java/com/jmp/application/service/UserService.java#L44-L70)

### Lombok Annotation Processing
**Updated** Enhanced with comprehensive annotation processing workflow.

**Supported Annotations**:
- **@Getter/@Setter**: Automatic property accessors for all fields
- **@RequiredArgsConstructor**: Constructor with non-null fields
- **@Slf4j**: Logger injection for structured logging
- **@EntityListeners**: JPA auditing support with @CreatedDate and @LastModifiedDate
- **@Transactional**: Service layer transaction management

**Generated Code Benefits**:
- **Reduced Boilerplate**: Eliminates repetitive getter/setter methods
- **Consistent Access Patterns**: Standardized property access across entities
- **Auditing Support**: Automatic timestamp management for entities
- **Logging Integration**: Structured logging without manual logger initialization

**Integration Points**:
- **Entity Classes**: User, Role, Conference, and other JPA entities
- **Service Classes**: Business logic with automatic transaction management
- **DTO Classes**: Immutable records with validation constraints

**Section sources**
- [User.java:12-28](file://jmp-domain/src/main/java/com/jmp/domain/entity/User.java#L12-L28)
- [UserService.java:16-31](file://jmp-application/src/main/java/com/jmp/application/service/UserService.java#L16-L31)
- [UserDto.java:14](file://jmp-application/src/main/java/com/jmp/application/dto/UserDto.java#L14)

### Docker Build and Nginx Serving
**Updated** Enhanced with improved restart policies and modernized build process.

Multi-stage build:
- **Stage 1**: Node 20 Alpine base image installs dependencies and builds the app using npm scripts.
- **Stage 2**: Alpine nginx image copies built assets and nginx.conf, exposes port 80, and starts nginx.

Nginx configuration highlights:
- Gzip compression enabled for common text and JS/CSS MIME types.
- Long-term caching for static assets with immutable cache-control.
- SPA routing fallback to index.html for client-side routes.
- API proxy to backend service at jmp-api:8080 with proper headers and WebSocket upgrade support.

Environment variables:
- VITE_API_URL is set in docker-compose for the UI service to point to the backend API.

**Enhanced** Port mappings now use 5174:80 for development and 8081:8080 for backend.

**Updated** Restart policies improved with "unless-stopped" for database services.

Port mappings:
- UI service publishes port 80 mapped to 5174 on host for local dev; in production, expose port 80 externally.
- Backend service uses 8081:8080 mapping for development.

**Section sources**
- [Dockerfile (UI):1-33](file://jmp-ui/Dockerfile#L1-L33)
- [nginx.conf:1-37](file://jmp-ui/nginx.conf#L1-L37)
- [docker-compose.yml:94-96](file://docker-compose.yml#L94-L96)

### Backend Containerization and Orchestration
- **Backend Dockerfile**: Uses multi-stage Maven build with offline dependency download and minimal JRE runtime.
- **docker-compose**: Orchestrates backend, database, cache, monitoring, and frontend services with health checks and network isolation.

**Updated** Enhanced restart policies with "unless-stopped" for improved reliability.

Environment variables:
- Database connection, Redis URL, JWT secrets, and Spring profile are defined for the backend service.

**Section sources**
- [Dockerfile (Backend):1-54](file://Dockerfile#L1-L54)
- [docker-compose.yml:44-72](file://docker-compose.yml#L44-L72)

### Monitoring Integration
- **Prometheus**: Scrapes backend metrics endpoint at /actuator/prometheus with 5-second intervals.
- **Grafana**: Provisioned with a Prometheus datasource and default admin credentials.

**Updated** Enhanced monitoring configuration with improved scraping intervals.

**Section sources**
- [prometheus.yml:18-22](file://monitoring/prometheus.yml#L18-22)
- [datasources.yml:4-10](file://monitoring/grafana/datasources/datasources.yml#L4-10)

## Dependency Analysis
**Updated** Modernized frontend dependencies with React 19, Material UI 7, and enhanced ecosystem.

Frontend build-time dependencies include Vite, React plugin, TypeScript, and ESLint ecosystem. Runtime dependencies include React 19, Material UI 7, Axios, React Router 7, Zustand 5, Framer Motion 12, Recharts 3, and Lucide React icons. The UI service depends on the backend API service for data and authentication flows.

**Enhanced** New dependencies: Framer Motion for animations, Recharts for data visualization, and Lucide React for modern icons.

**Backend Dependencies**:
- **MapStruct**: Compile-time object mapping framework
- **Lombok**: Annotation processing for boilerplate reduction
- **Spring Boot**: Application framework with auto-configuration
- **Hibernate**: JPA provider with auditing support

```mermaid
graph LR
PKG["package.json"]
VITE["vite"]
RPLUG["@vitejs/plugin-react"]
TS["typescript"]
ESL["eslint + plugins"]
RUNTIME["React 19 + MUI 7 + Zustand 5<br/>Framer Motion 12 + Recharts 3"]
BPKG["Backend Dependencies"]
MAPSTRUCT["MapStruct 1.5.5.Final"]
LOMBOK["Lombok 1.18.32"]
SPRING["Spring Boot 3.2.5"]
BPKG --> MAPSTRUCT
BPKG --> LOMBOK
BPKG --> SPRING
PKG --> VITE
PKG --> RPLUG
PKG --> TS
PKG --> ESL
PKG --> RUNTIME
```

**Diagram sources**
- [package.json:12-26](file://jmp-ui/package.json#L12-L26)
- [pom.xml:60-61](file://pom.xml#L60-L61)

**Section sources**
- [package.json:12-26](file://jmp-ui/package.json#L12-L26)
- [pom.xml:60-61](file://pom.xml#L60-L61)

## Performance Considerations
- **Asset caching**: Nginx sets long cache TTLs and immutable flags for static assets to reduce bandwidth and improve load times.
- **Compression**: Gzip reduces payload sizes for text-based assets.
- **SPA routing**: Fallback to index.html ensures deep links work without server-side route handling.
- **Build optimization**: Vite's default bundler performs code splitting and tree-shaking; keep dependencies lean and avoid unnecessary polyfills.
- **Environment variables**: Use VITE_ prefix for variables consumed at build time; avoid leaking secrets.
- **Browser compatibility**: Align TS target with supported browsers; test across devices and versions.
- **Enhanced** Modern JavaScript features: ES2023 target provides better performance and modern syntax support.
- **Enhanced** Compile-time optimizations: MapStruct generates optimized mapping code at build time, eliminating runtime reflection overhead.
- **Enhanced** Reduced boilerplate: Lombok annotation processing eliminates repetitive code generation, improving maintainability and reducing binary size.

## Troubleshooting Guide
Common issues and resolutions:
- **API requests fail in dev or production**:
  - Verify VITE_API_URL points to the correct backend origin.
  - Confirm nginx proxy_pass matches backend service name and path.
- **404 on client-side routes**:
  - Ensure nginx location / fallback to index.html is present.
- **Assets not cached or stale**:
  - Check cache-control headers and expiration directives for static asset locations.
- **Health checks failing**:
  - Review backend health endpoint and compose healthcheck configuration.
- **CORS or WebSocket upgrade failures**:
  - Validate proxy headers and upgrade settings in nginx.
- **Enhanced** **Database connectivity issues**:
  - Verify PostgreSQL service health and port mapping (5432:5432).
  - Check restart policies for database services.
- **Enhanced** **Frontend not loading**:
  - Verify React 19 compatibility and proper Vite configuration.
  - Check Material UI 7 component imports and styling.
- **Enhanced** **MapStruct compilation errors**:
  - Verify MapStruct processor is included in annotationProcessorPaths.
  - Check that @Mapper interfaces are properly annotated.
  - Ensure DTO and entity field names match mapping expectations.
- **Enhanced** **Lombok annotation processing issues**:
  - Confirm Lombok processor is configured in Maven compiler plugin.
  - Verify Lombok dependency is present in classpath.
  - Check IDE plugin installation for annotation processing support.

**Section sources**
- [docker-compose.yml:18-19, 94-96:18-19](file://docker-compose.yml#L18-L19)
- [nginx.conf:19-22](file://jmp-ui/nginx.conf#L19-L22)
- [nginx.conf:24-35](file://jmp-ui/nginx.conf#L24-L35)
- [pom.xml:211-227](file://pom.xml#L211-L227)

## Conclusion
The frontend build and deployment pipeline leverages Vite for fast development and optimized production builds, TypeScript with ES2023 targets for type safety, and a multi-stage Docker build with nginx for efficient static serving. The platform has been modernized with React 19, Material UI 7, Zustand, Framer Motion, and Recharts for enhanced user experience. The backend build configuration features comprehensive MapStruct processor integration for compile-time object mapping code generation and Lombok annotation processing for boilerplate reduction. docker-compose orchestrates the UI, backend, databases, cache, and monitoring with improved restart policies. Following the outlined environment variables, performance tuning tips, and troubleshooting steps ensures reliable local and production deployments.

## Appendices

### Build Scripts and Commands
- **Development**: Start Vite dev server with React 19 support.
- **Build**: Compile TypeScript project references, then run Vite build.
- **Lint**: Run ESLint across the project with flat configuration.
- **Preview**: Serve built assets locally for verification.
- **Backend Build**: Execute Maven build with annotation processors for MapStruct and Lombok.

**Section sources**
- [package.json:6-11](file://jmp-ui/package.json#L6-L11)
- [pom.xml:201-233](file://pom.xml#L201-L233)

### Environment Variables Reference
- **Frontend**:
  - VITE_API_URL: Base URL for API requests from the UI.
- **Backend**:
  - SPRING_PROFILES_ACTIVE: Active Spring profile (e.g., docker,dev).
  - DB_URL, DB_USER, DB_PASS: Database connection settings.
  - REDIS_URL: Redis connection URL.
  - JWT_ACCESS_SECRET, JWT_REFRESH_SECRET: Secrets for JWT signing.
  - Enhanced** S3 storage configuration for recording management.
- **Enhanced** **MapStruct Configuration**:
  - mapstruct.defaultComponentModel: spring (for Spring-managed mappers)
  - mapstruct.unmappedTargetPolicy: ERROR (strict mapping validation)

**Section sources**
- [docker-compose.yml:94](file://docker-compose.yml#L94)
- [docker-compose.yml:52-67](file://docker-compose.yml#L52-L67)
- [pom.xml:228-231](file://pom.xml#L228-L231)

### CI/CD Integration Patterns
- **Build stage**: Install dependencies, compile TS with ES2023 target, run Vite build.
- **Test stage**: Run linters with ESLint flat config and unit tests.
- **Package stage**: Produce Docker images for UI and backend with multi-stage builds.
- **Deploy stage**: Push images to registry and deploy via docker-compose with enhanced restart policies.
- **Enhanced** **Backend Build Stage**: Execute Maven build with annotation processors for MapStruct and Lombok code generation.

### Local Development Best Practices
- Use npm run dev for iterative development with React 19.
- Keep VITE_API_URL aligned with backend service name and port mapping.
- Leverage ESLint flat config for consistent code quality.
- Validate SPA routing and API proxy behavior locally before committing.
- **Enhanced** Test modern dependencies (React 19, Material UI 7, Zustand) for compatibility.
- **Enhanced** Monitor database connectivity with improved restart policies.
- **Enhanced** **MapStruct Development**: Verify generated mapper implementations are created during Maven build.
- **Enhanced** **Lombok Development**: Ensure IDE recognizes generated methods and constructors.

**Section sources**
- [package.json:6-11](file://jmp-ui/package.json#L6-L11)
- [docker-compose.yml:94](file://docker-compose.yml#L94)
- [eslint.config.js:1-24](file://jmp-ui/eslint.config.js#L1-L24)
- [pom.xml:211-227](file://pom.xml#L211-L227)