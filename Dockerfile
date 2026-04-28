# Jitsi Management Platform - Multi-stage Docker Build
# Per specification §13.3

# Stage 1: Build the application
FROM eclipse-temurin:25-jdk-alpine AS builder

WORKDIR /app

# Copy Maven wrapper and POMs
COPY mvnw pom.xml ./
COPY .mvn .mvn
COPY jmp-domain/pom.xml jmp-domain/
COPY jmp-application/pom.xml jmp-application/
COPY jmp-infrastructure/pom.xml jmp-infrastructure/
COPY jmp-api/pom.xml jmp-api/
COPY jmp-web/pom.xml jmp-web/

# Download dependencies (cache layer)
RUN ./mvnw dependency:go-offline -B

# Copy source code
COPY jmp-domain/src jmp-domain/src
COPY jmp-application/src jmp-application/src
COPY jmp-infrastructure/src jmp-infrastructure/src
COPY jmp-api/src jmp-api/src
COPY jmp-web/src jmp-web/src

# Build the application
RUN ./mvnw clean package -DskipTests -B

# Stage 2: Create the runtime image
FROM eclipse-temurin:25-jre-alpine AS runtime

# Create non-root user
RUN addgroup -S jmp && adduser -S jmp -G jmp

WORKDIR /app

# Copy the built JAR
COPY --from=builder /app/jmp-web/target/*.jar app.jar

# Change ownership to non-root user
RUN chown -R jmp:jmp /app

USER jmp

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:8080/actuator/health || exit 1

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
