package com.jmp.domain.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

/**
 * Tenant entity representing an organization/tenant in the multi-tenant platform.
 * Implements tenant isolation and quota management.
 * Per specification §5.2, §3.8
 */
@Entity
@Table(name = "tenants", schema = "jmp")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
public class Tenant {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @NotNull
    @Size(max = 100)
    @Column(name = "name", nullable = false, unique = true, length = 100)
    private String name;

    @NotNull
    @Size(max = 50)
    @Column(name = "slug", nullable = false, unique = true, length = 50)
    private String slug;

    @Size(max = 500)
    @Column(name = "description", length = 500)
    private String description;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private TenantStatus status = TenantStatus.ACTIVE;

    @Size(max = 255)
    @Column(name = "domain", unique = true, length = 255)
    private String domain;

    @Size(max = 255)
    @Column(name = "jitsi_domain", length = 255)
    private String jitsiDomain;

    @Embedded
    private TenantQuotas quotas;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "settings", columnDefinition = "jsonb")
    private Map<String, Object> settings = new HashMap<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "jitsi_config", columnDefinition = "jsonb")
    private Map<String, Object> jitsiConfig = new HashMap<>();

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "suspended_at")
    private Instant suspendedAt;

    @Size(max = 500)
    @Column(name = "suspension_reason", length = 500)
    private String suspensionReason;

    /**
     * Suspend the tenant with a reason.
     */
    public void suspend(String reason) {
        this.status = TenantStatus.SUSPENDED;
        this.suspendedAt = Instant.now();
        this.suspensionReason = reason;
    }

    /**
     * Activate the tenant.
     */
    public void activate() {
        this.status = TenantStatus.ACTIVE;
        this.suspendedAt = null;
        this.suspensionReason = null;
    }

    /**
     * Check if tenant is active.
     */
    public boolean isActive() {
        return status == TenantStatus.ACTIVE;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Tenant tenant = (Tenant) o;
        return Objects.equals(id, tenant.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "Tenant{" +
            "id=" + id +
            ", name='" + name + '\'' +
            ", slug='" + slug + '\'' +
            ", status=" + status +
            '}';
    }

    public enum TenantStatus {
        ACTIVE,
        SUSPENDED,
        DELETED
    }

    /**
     * Embeddable class for tenant quotas.
     */
    @Embeddable
    @Getter
    @Setter
    public static class TenantQuotas {
        
        @Column(name = "max_concurrent_conferences")
        private Integer maxConcurrentConferences = 10;

        @Column(name = "max_participants_per_conference")
        private Integer maxParticipantsPerConference = 100;

        @Column(name = "max_recording_storage_mb")
        private Long maxRecordingStorageMb = 10_240L; // 10 GB

        @Column(name = "max_conference_duration_minutes")
        private Integer maxConferenceDurationMinutes = 240; // 4 hours

        @Column(name = "allowed_features")
        private String allowedFeatures = "chat,screen_share,recording,live_streaming";

        public boolean isFeatureAllowed(String feature) {
            if (allowedFeatures == null || allowedFeatures.isEmpty()) {
                return false;
            }
            return allowedFeatures.toLowerCase().contains(feature.toLowerCase());
        }
    }
}
