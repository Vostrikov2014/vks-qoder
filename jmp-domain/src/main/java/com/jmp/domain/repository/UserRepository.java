package com.jmp.domain.repository;

import com.jmp.domain.entity.User;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Repository for User entity operations.
 * Per specification §5.1, §9.2
 */
@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    /**
     * Find user by email with roles loaded.
     */
    @EntityGraph(attributePaths = {"roles", "roles.permissions", "tenant"})
    Optional<User> findByEmail(String email);

    /**
     * Find active user by email.
     */
    @Query("SELECT u FROM User u WHERE u.email = :email AND u.status = 'ACTIVE' AND u.deletedAt IS NULL")
    Optional<User> findActiveByEmail(@Param("email") String email);

    /**
     * Find user by ID with all associations.
     */
    @EntityGraph(attributePaths = {"roles", "roles.permissions", "tenant"})
    Optional<User> findWithRolesById(UUID id);

    /**
     * Check if email exists for any active user.
     */
    boolean existsByEmailAndDeletedAtIsNull(String email);

    /**
     * Find all users by tenant ID.
     */
    @EntityGraph(attributePaths = {"roles"})
    Page<User> findByTenantIdAndDeletedAtIsNull(UUID tenantId, Pageable pageable);

    /**
     * Search users by name or email within a tenant.
     */
    @Query("SELECT u FROM User u WHERE u.tenant.id = :tenantId " +
           "AND u.deletedAt IS NULL " +
           "AND (LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(u.firstName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(u.lastName) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<User> searchByTenantId(@Param("tenantId") UUID tenantId, 
                                @Param("search") String search, 
                                Pageable pageable);

    /**
     * Count active users in a tenant.
     */
    long countByTenantIdAndStatusAndDeletedAtIsNull(UUID tenantId, User.UserStatus status);

    /**
     * Check if user exists and belongs to tenant.
     */
    boolean existsByIdAndTenantIdAndDeletedAtIsNull(UUID id, UUID tenantId);

    /**
     * Find user by email within a tenant.
     */
    Optional<User> findByEmailAndTenantId(String email, UUID tenantId);

    /**
     * Find user by external auth ID and provider.
     */
    Optional<User> findByExternalAuthIdAndExternalAuthProvider(String externalAuthId, String provider);
}
