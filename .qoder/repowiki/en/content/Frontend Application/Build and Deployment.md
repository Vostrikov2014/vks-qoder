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
- [prometheus.yml](file://monitoring/prometheus.yml)
- [datasources.yml](file://monitoring/grafana/datasources/datasources.yml)
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
This document explains the frontend build configuration and deployment process for the React-based UI module (jmp-ui). It covers Vite configuration, TypeScript setup, linting, Docker containerization, nginx static serving, and production deployment strategies. It also documents environment variables, build optimization settings, performance tuning, deployment guidelines across environments, CI/CD integration patterns, troubleshooting, and local development best practices.

## Project Structure
The frontend build and deployment artifacts are centered in the jmp-ui module. Key files include:
- Build and dev scripts, dependencies, and plugin configuration
- Vite configuration for React
- TypeScript configurations for app and node contexts
- ESLint flat config for linting
- Dockerfile for multi-stage build and nginx serving
- Nginx configuration for static assets, caching, compression, SPA routing, and API proxying
- docker-compose orchestration for frontend, backend, databases, and monitoring

```mermaid
graph TB
subgraph "Frontend Module (jmp-ui)"
PKG["package.json"]
VCFG["vite.config.ts"]
TSC_APP["tsconfig.app.json"]
TSC_NODE["tsconfig.node.json"]
ESLINT["eslint.config.js"]
DOCKER_UI["Dockerfile (UI)"]
NGINX["nginx.conf"]
end
subgraph "Orchestration"
DCMP["docker-compose.yml"]
end
subgraph "Backend Module"
DOCKER_BE["Dockerfile (Backend)"]
end
subgraph "Monitoring"
PROM["prometheus.yml"]
DS["datasources.yml"]
end
PKG --> VCFG
VCFG --> TSC_APP
VCFG --> ESLINT
DOCKER_UI --> NGINX
DCMP --> DOCKER_UI
DCMP --> DOCKER_BE
DCMP --> PROM
DCMP --> DS
```

**Diagram sources**
- [package.json:1-39](file://jmp-ui/package.json#L1-L39)
- [vite.config.ts:1-8](file://jmp-ui/vite.config.ts#L1-L8)
- [tsconfig.app.json:1-26](file://jmp-ui/tsconfig.app.json#L1-L26)
- [tsconfig.node.json:1-25](file://jmp-ui/tsconfig.node.json#L1-L25)
- [eslint.config.js:1-24](file://jmp-ui/eslint.config.js#L1-L24)
- [Dockerfile (UI):1-33](file://jmp-ui/Dockerfile#L1-L33)
- [nginx.conf:1-37](file://jmp-ui/nginx.conf#L1-L37)
- [docker-compose.yml:1-129](file://docker-compose.yml#L1-L129)
- [Dockerfile (Backend):1-54](file://Dockerfile#L1-L54)
- [prometheus.yml:1-23](file://monitoring/prometheus.yml#L1-L23)
- [datasources.yml:1-11](file://monitoring/grafana/datasources/datasources.yml#L1-L11)

**Section sources**
- [package.json:1-39](file://jmp-ui/package.json#L1-L39)
- [vite.config.ts:1-8](file://jmp-ui/vite.config.ts#L1-L8)
- [tsconfig.json:1-8](file://jmp-ui/tsconfig.json#L1-L8)
- [tsconfig.app.json:1-26](file://jmp-ui/tsconfig.app.json#L1-L26)
- [tsconfig.node.json:1-25](file://jmp-ui/tsconfig.node.json#L1-L25)
- [eslint.config.js:1-24](file://jmp-ui/eslint.config.js#L1-L24)
- [Dockerfile (UI):1-33](file://jmp-ui/Dockerfile#L1-L33)
- [nginx.conf:1-37](file://jmp-ui/nginx.conf#L1-L37)
- [docker-compose.yml:1-129](file://docker-compose.yml#L1-L129)
- [Dockerfile (Backend):1-54](file://Dockerfile#L1-L54)
- [prometheus.yml:1-23](file://monitoring/prometheus.yml#L1-L23)
- [datasources.yml:1-11](file://monitoring/grafana/datasources/datasources.yml#L1-L11)

## Core Components
- Vite build and dev server: Single-plugin React setup with default bundling and dev server behavior.
- TypeScript: Two-project TS configs for app and node contexts with bundler-mode resolution.
- Linting: ESLint flat config with recommended rulesets for TS, React hooks, and React refresh.
- Docker (UI): Multi-stage build producing optimized static assets served by nginx.
- Nginx: Compression, long-lived caching for static assets, SPA routing fallback, and API proxy to backend.
- Orchestration: docker-compose defines services, environment variables, port mappings, and network connectivity.

**Section sources**
- [vite.config.ts:1-8](file://jmp-ui/vite.config.ts#L1-L8)
- [tsconfig.app.json:1-26](file://jmp-ui/tsconfig.app.json#L1-L26)
- [tsconfig.node.json:1-25](file://jmp-ui/tsconfig.node.json#L1-L25)
- [eslint.config.js:1-24](file://jmp-ui/eslint.config.js#L1-L24)
- [Dockerfile (UI):1-33](file://jmp-ui/Dockerfile#L1-L33)
- [nginx.conf:1-37](file://jmp-ui/nginx.conf#L1-L37)
- [docker-compose.yml:73-87](file://docker-compose.yml#L73-L87)

## Architecture Overview
The frontend build pipeline produces static assets packaged inside an nginx container. The UI service proxies API traffic to the backend service. Monitoring services collect metrics from the backend.

```mermaid
graph TB
Dev["Developer Machine"]
ViteDev["Vite Dev Server<br/>Port 5174 (mapped to 80 inside container)"]
Nginx["Nginx Static Server<br/>Port 80"]
API["Backend API Service<br/>Port 8080"]
Postgres["PostgreSQL"]
Redis["Redis"]
Prom["Prometheus"]
Graf["Grafana"]
Dev --> |"npm run dev"| ViteDev
ViteDev --> |"Build"| Nginx
Nginx --> |"SPA fallback"| Nginx
Nginx --> |"Proxy /api/"| API
API --> Postgres
API --> Redis
Prom --> |"Scrape /actuator/prometheus"| API
Graf --> |"Datasource: Prometheus"| Prom
```

**Diagram sources**
- [docker-compose.yml:73-87](file://docker-compose.yml#L73-L87)
- [nginx.conf:24-35](file://jmp-ui/nginx.conf#L24-L35)
- [prometheus.yml:18-22](file://monitoring/prometheus.yml#L18-L22)
- [datasources.yml:4-10](file://monitoring/grafana/datasources/datasources.yml#L4-L10)

## Detailed Component Analysis

### Vite Configuration and Build Pipeline
- Plugin stack: React plugin integrated via Vite.
- Build script: TypeScript project references compiled first, followed by Vite build for optimized production assets.
- Dev script: Starts Vite dev server with default behavior.
- Preview script: Serves the built assets locally for preview.

Optimization and asset handling:
- Vite’s default bundler handles code splitting and asset optimization.
- Assets under public are copied as-is; dynamic imports and module resolution are handled by Vite.
- Environment variables prefixed with VITE_ are embedded at build time; others are ignored.

Development server:
- Default host/port behavior is used; port mapping is configured in docker-compose.

**Section sources**
- [package.json:6-11](file://jmp-ui/package.json#L6-L11)
- [vite.config.ts:1-8](file://jmp-ui/vite.config.ts#L1-L8)

### TypeScript Configuration
- Root tsconfig aggregates app and node configs.
- App config targets modern JS, uses bundler module resolution, JSX transform, and strictness flags suitable for Vite.
- Node config targets tooling and Vite config types.

Recommendations:
- Keep target aligned with deployed browsers.
- Preserve bundler mode for Vite compatibility.

**Section sources**
- [tsconfig.json:1-8](file://jmp-ui/tsconfig.json#L1-L8)
- [tsconfig.app.json:1-26](file://jmp-ui/tsconfig.app.json#L1-L26)
- [tsconfig.node.json:1-25](file://jmp-ui/tsconfig.node.json#L1-L25)

### Linting Setup
- ESLint flat config enables recommended rules for TS, React hooks, and React refresh.
- Ignores dist folder automatically.

Best practices:
- Run lint checks in CI and pre-commit hooks.
- Keep rules consistent across contributors.

**Section sources**
- [eslint.config.js:1-24](file://jmp-ui/eslint.config.js#L1-L24)

### Docker Build and Nginx Serving
Multi-stage build:
- Stage 1: Node base image installs dependencies and builds the app using npm scripts.
- Stage 2: Alpine nginx image copies built assets and nginx.conf, exposes port 80, and starts nginx.

Nginx configuration highlights:
- Gzip compression enabled for common text and JS/CSS MIME types.
- Long-term caching for static assets with immutable cache-control.
- SPA routing fallback to index.html for client-side routes.
- API proxy to backend service at jmp-api:8080 with proper headers and WebSocket upgrade support.

Environment variables:
- VITE_API_URL is set in docker-compose for the UI service to point to the backend API.

Port mappings:
- UI service publishes port 80 mapped to 5174 on host for local dev; in production, expose port 80 externally.

**Section sources**
- [Dockerfile (UI):1-33](file://jmp-ui/Dockerfile#L1-L33)
- [nginx.conf:1-37](file://jmp-ui/nginx.conf#L1-L37)
- [docker-compose.yml:79-82](file://docker-compose.yml#L79-L82)

### Backend Containerization and Orchestration
- Backend Dockerfile uses a multi-stage Maven build with offline dependency download and a minimal JRE runtime.
- docker-compose orchestrates backend, database, cache, monitoring, and frontend services with health checks and network isolation.

Environment variables:
- Database connection, Redis URL, JWT secrets, and Spring profile are defined for the backend service.

**Section sources**
- [Dockerfile (Backend):1-54](file://Dockerfile#L1-L54)
- [docker-compose.yml:44-72](file://docker-compose.yml#L44-L72)

### Monitoring Integration
- Prometheus scrapes backend metrics endpoint at /actuator/prometheus.
- Grafana is provisioned with a Prometheus datasource and default admin credentials.

**Section sources**
- [prometheus.yml:18-22](file://monitoring/prometheus.yml#L18-L22)
- [datasources.yml:4-10](file://monitoring/grafana/datasources/datasources.yml#L4-L10)

## Dependency Analysis
Frontend build-time dependencies include Vite, React plugin, TypeScript, and ESLint ecosystem. Runtime dependencies include React, Material UI, Axios, React Router, and Zustand. The UI service depends on the backend API service for data and authentication flows.

```mermaid
graph LR
PKG["package.json"]
VITE["vite"]
RPLUG["@vitejs/plugin-react"]
TS["typescript"]
ESL["eslint + plugins"]
RUNTIME["React + MUI + Axios + Router + Zustand"]
PKG --> VITE
PKG --> RPLUG
PKG --> TS
PKG --> ESL
PKG --> RUNTIME
```

**Diagram sources**
- [package.json:12-37](file://jmp-ui/package.json#L12-L37)

**Section sources**
- [package.json:12-37](file://jmp-ui/package.json#L12-L37)

## Performance Considerations
- Asset caching: Nginx sets long cache TTLs and immutable flags for static assets to reduce bandwidth and improve load times.
- Compression: Gzip reduces payload sizes for text-based assets.
- SPA routing: Fallback to index.html ensures deep links work without server-side route handling.
- Build optimization: Vite’s default bundler performs code splitting and tree-shaking; keep dependencies lean and avoid unnecessary polyfills.
- Environment variables: Use VITE_ prefix for variables consumed at build time; avoid leaking secrets.
- Browser compatibility: Align TS target with supported browsers; test across devices and versions.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- API requests fail in dev or production:
  - Verify VITE_API_URL points to the correct backend origin.
  - Confirm nginx proxy_pass matches backend service name and path.
- 404 on client-side routes:
  - Ensure nginx location / fallback to index.html is present.
- Assets not cached or stale:
  - Check cache-control headers and expiration directives for static asset locations.
- Health checks failing:
  - Review backend health endpoint and compose healthcheck configuration.
- CORS or WebSocket upgrade failures:
  - Validate proxy headers and upgrade settings in nginx.

**Section sources**
- [docker-compose.yml:79-82](file://docker-compose.yml#L79-L82)
- [nginx.conf:19-22](file://jmp-ui/nginx.conf#L19-L22)
- [nginx.conf:24-35](file://jmp-ui/nginx.conf#L24-L35)

## Conclusion
The frontend build and deployment pipeline leverages Vite for fast development and optimized production builds, TypeScript for type safety, and a multi-stage Docker build with nginx for efficient static serving. docker-compose orchestrates the UI, backend, databases, cache, and monitoring. Following the outlined environment variables, performance tuning tips, and troubleshooting steps ensures reliable local and production deployments.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

### Build Scripts and Commands
- Development: Start Vite dev server.
- Build: Compile TypeScript project references, then run Vite build.
- Lint: Run ESLint across the project.
- Preview: Serve built assets locally for verification.

**Section sources**
- [package.json:6-11](file://jmp-ui/package.json#L6-L11)

### Environment Variables Reference
- Frontend:
  - VITE_API_URL: Base URL for API requests from the UI.
- Backend:
  - SPRING_PROFILES_ACTIVE: Active Spring profile (e.g., docker).
  - DB_URL, DB_USER, DB_PASS: Database connection settings.
  - REDIS_URL: Redis connection URL.
  - JWT_ACCESS_SECRET, JWT_REFRESH_SECRET: Secrets for JWT signing.

**Section sources**
- [docker-compose.yml:79-82](file://docker-compose.yml#L79-L82)
- [docker-compose.yml:49-56](file://docker-compose.yml#L49-L56)

### CI/CD Integration Patterns
- Build stage: Install dependencies, compile TS, run Vite build.
- Test stage: Run linters and unit tests (add test script if needed).
- Package stage: Produce Docker images for UI and backend.
- Deploy stage: Push images to registry and deploy via docker-compose or Kubernetes.

[No sources needed since this section provides general guidance]

### Local Development Best Practices
- Use npm run dev for iterative development.
- Keep VITE_API_URL aligned with backend service name and port.
- Leverage ESLint for consistent code quality.
- Validate SPA routing and API proxy behavior locally before committing.

**Section sources**
- [package.json:6-11](file://jmp-ui/package.json#L6-L11)
- [docker-compose.yml:79-82](file://docker-compose.yml#L79-L82)
- [eslint.config.js:1-24](file://jmp-ui/eslint.config.js#L1-L24)