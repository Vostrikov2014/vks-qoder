package com.jmp.domain.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

/**
 * Audit log entity for tracking system events.
 * Per specification §17.1-17.10
 */
@Entity
@Table(name = "audit_logs", schema = "jmp")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 50)
    private AuditEventType eventType;

    @Size(max = 100)
    @Column(name = "action", nullable = false, length = 100)
    private String action;

    @Size(max = 100)
    @Column(name = "entity_type", length = 100)
    private String entityType;

    @Column(name = "entity_id")
    private UUID entityId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "tenant_id")
    private UUID tenantId;

    @Size(max = 255)
    @Column(name = "user_email", length = 255)
    private String userEmail;

    @Size(max = 50)
    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    @Size(max = 500)
    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "old_values", columnDefinition = "jsonb")
    private Object oldValues;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "new_values", columnDefinition = "jsonb")
    private Object newValues;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata", columnDefinition = "jsonb")
    private Object metadata;

    @Size(max = 20)
    @Column(name = "severity", length = 20)
    private String severity = "INFO";

    @Size(max = 1000)
    @Column(name = "error_message", length = 1000)
    private String errorMessage;

    @Column(name = "success")
    private Boolean success = true;

    @Column(name = "processing_time_ms")
    private Long processingTimeMs;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        AuditLog auditLog = (AuditLog) o;
        return Objects.equals(id, auditLog.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "AuditLog{" +
            "id=" + id +
            ", eventType=" + eventType +
            ", action='" + action + '\'' +
            ", entityType='" + entityType + '\'' +
            ", userEmail='" + userEmail + '\'' +
            ", createdAt=" + createdAt +
            '}';
    }

    public enum AuditEventType {
        AUTHENTICATION,     // Login, logout, token refresh
        AUTHORIZATION,      // Permission checks, access denied
        USER_MANAGEMENT,    // User CRUD operations
        TENANT_MANAGEMENT,  // Tenant CRUD operations
        CONFERENCE,         // Conference operations
        RECORDING,          // Recording operations
        SYSTEM,             // System events
        SECURITY,           // Security-related events
        API_CALL,           // API endpoint calls
        WEBHOOK,            // Webhook events
        CONFIGURATION       // Configuration changes
    }
}
