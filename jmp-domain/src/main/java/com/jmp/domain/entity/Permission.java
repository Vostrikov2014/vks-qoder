package com.jmp.domain.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

/**
 * Permission entity for fine-grained access control.
 * Per specification §15.4 (RBAC with ABAC support)
 */
@Entity
@Table(name = "permissions", schema = "jmp")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
public class Permission {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @NotNull
    @Size(max = 100)
    @Column(name = "name", nullable = false, unique = true, length = 100)
    private String name;

    @Size(max = 255)
    @Column(name = "description", length = 255)
    private String description;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "resource_type", nullable = false, length = 30)
    private ResourceType resourceType;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "action", nullable = false, length = 20)
    private Action action;

    @Column(name = "is_system_permission")
    private Boolean isSystemPermission = false;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Permission that = (Permission) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "Permission{" +
            "id=" + id +
            ", name='" + name + '\'' +
            ", resourceType=" + resourceType +
            ", action=" + action +
            '}';
    }

    public enum ResourceType {
        USER,
        TENANT,
        CONFERENCE,
        RECORDING,
        AUDIT_LOG,
        SETTING,
        REPORT,
        SYSTEM
    }

    public enum Action {
        CREATE,
        READ,
        UPDATE,
        DELETE,
        LIST,
        MANAGE,
        ADMIN
    }

    // Predefined permission constants
    public static final String USER_CREATE = "user:create";
    public static final String USER_READ = "user:read";
    public static final String USER_UPDATE = "user:update";
    public static final String USER_DELETE = "user:delete";
    public static final String USER_LIST = "user:list";

    public static final String TENANT_CREATE = "tenant:create";
    public static final String TENANT_READ = "tenant:read";
    public static final String TENANT_UPDATE = "tenant:update";
    public static final String TENANT_DELETE = "tenant:delete";
    public static final String TENANT_MANAGE = "tenant:manage";

    public static final String CONFERENCE_CREATE = "conference:create";
    public static final String CONFERENCE_READ = "conference:read";
    public static final String CONFERENCE_UPDATE = "conference:update";
    public static final String CONFERENCE_DELETE = "conference:delete";
    public static final String CONFERENCE_MANAGE = "conference:manage";

    public static final String RECORDING_READ = "recording:read";
    public static final String RECORDING_DELETE = "recording:delete";
    public static final String RECORDING_MANAGE = "recording:manage";

    public static final String AUDIT_LOG_READ = "audit_log:read";
    public static final String AUDIT_LOG_EXPORT = "audit_log:export";

    public static final String SYSTEM_ADMIN = "system:admin";
}
