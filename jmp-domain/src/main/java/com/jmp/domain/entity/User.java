package com.jmp.domain.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
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
 * User entity representing a platform user.
 * Implements tenant-scoped identity with role-based access control.
 * Per specification §5.1, §15.1-15.7
 */
@Entity
@Table(name = "users", schema = "jmp")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @NotNull
    @Email
    @Size(max = 255)
    @Column(name = "email", nullable = false, unique = true, length = 255)
    private String email;

    @NotNull
    @Size(max = 100)
    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @NotNull
    @Size(max = 100)
    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Size(max = 255)
    @Column(name = "password_hash", length = 255)
    private String passwordHash;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private UserStatus status = UserStatus.PENDING_VERIFICATION;

    @Column(name = "email_verified")
    private Boolean emailVerified = false;

    @Column(name = "email_verified_at")
    private Instant emailVerifiedAt;

    @Column(name = "last_login_at")
    private Instant lastLoginAt;

    @Column(name = "two_factor_enabled")
    private Boolean twoFactorEnabled = false;

    @Size(max = 255)
    @Column(name = "two_factor_secret", length = 255)
    private String twoFactorSecret;

    @Size(max = 255)
    @Column(name = "external_auth_id", length = 255)
    private String externalAuthId;

    @Size(max = 50)
    @Column(name = "external_auth_provider", length = 50)
    private String externalAuthProvider;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "user_roles",
        schema = "jmp",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private Set<Role> roles = new HashSet<>();

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    /**
     * Soft delete the user.
     */
    public void softDelete() {
        this.deletedAt = Instant.now();
        this.status = UserStatus.DELETED;
    }

    /**
     * Check if user is active and can access the platform.
     */
    public boolean isActive() {
        return status == UserStatus.ACTIVE && deletedAt == null;
    }

    /**
     * Check if user has a specific role.
     */
    public boolean hasRole(String roleName) {
        return roles.stream()
            .anyMatch(role -> role.getName().equals(roleName));
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        User user = (User) o;
        return Objects.equals(id, user.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "User{" +
            "id=" + id +
            ", email='" + email + '\'' +
            ", firstName='" + firstName + '\'' +
            ", lastName='" + lastName + '\'' +
            ", status=" + status +
            ", tenantId=" + (tenant != null ? tenant.getId() : null) +
            '}';
    }

    public enum UserStatus {
        PENDING_VERIFICATION,
        ACTIVE,
        SUSPENDED,
        DELETED
    }
}
