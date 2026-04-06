package com.jmp.domain.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

/**
 * Role entity for RBAC implementation.
 * Supports role hierarchy and tenant-specific roles.
 * Per specification §15.1-15.7
 */
@Entity
@Table(name = "roles", schema = "jmp")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @NotNull
    @Size(max = 50)
    @Column(name = "name", nullable = false, unique = true, length = 50)
    private String name;

    @Size(max = 255)
    @Column(name = "description", length = 255)
    private String description;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "role_type", nullable = false, length = 20)
    private RoleType roleType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id")
    private Tenant tenant; // null for global roles

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "role_permissions",
        schema = "jmp",
        joinColumns = @JoinColumn(name = "role_id"),
        inverseJoinColumns = @JoinColumn(name = "permission_id")
    )
    private Set<Permission> permissions = new HashSet<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_role_id")
    private Role parentRole; // For role hierarchy

    @Column(name = "is_system_role")
    private Boolean isSystemRole = false;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /**
     * Check if this role has a specific permission.
     */
    public boolean hasPermission(String permissionName) {
        return permissions.stream()
            .anyMatch(p -> p.getName().equals(permissionName));
    }

    /**
     * Check if this role is global (not tenant-specific).
     */
    public boolean isGlobal() {
        return tenant == null;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Role role = (Role) o;
        return Objects.equals(id, role.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "Role{" +
            "id=" + id +
            ", name='" + name + '\'' +
            ", roleType=" + roleType +
            ", isSystemRole=" + isSystemRole +
            '}';
    }

    public enum RoleType {
        SUPER_ADMIN,
        TENANT_ADMIN,
        MODERATOR,
        PARTICIPANT,
        AUDITOR,
        SERVICE_ACCOUNT
    }

    // Predefined role names for use in @PreAuthorize
    public static final String ROLE_SUPER_ADMIN = "ROLE_SUPER_ADMIN";
    public static final String ROLE_TENANT_ADMIN = "ROLE_TENANT_ADMIN";
    public static final String ROLE_MODERATOR = "ROLE_MODERATOR";
    public static final String ROLE_PARTICIPANT = "ROLE_PARTICIPANT";
    public static final String ROLE_AUDITOR = "ROLE_AUDITOR";
    public static final String ROLE_SERVICE_ACCOUNT = "ROLE_SERVICE_ACCOUNT";
}
