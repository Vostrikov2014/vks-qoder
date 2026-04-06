package com.jmp.domain.repository;

import com.jmp.domain.entity.Tenant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Repository for Tenant entity operations.
 * Per specification §5.2, §9.2
 */
@Repository
public interface TenantRepository extends JpaRepository<Tenant, UUID> {

    /**
     * Find tenant by slug.
     */
    Optional<Tenant> findBySlug(String slug);

    /**
     * Find tenant by domain.
     */
    Optional<Tenant> findByDomain(String domain);

    /**
     * Find active tenant by slug.
     */
    @Query("SELECT t FROM Tenant t WHERE t.slug = :slug AND t.status = 'ACTIVE'")
    Optional<Tenant> findActiveBySlug(@Param("slug") String slug);

    /**
     * Check if slug exists.
     */
    boolean existsBySlug(String slug);

    /**
     * Check if domain exists.
     */
    boolean existsByDomain(String domain);

    /**
     * Find all active tenants.
     */
    Page<Tenant> findByStatus(Tenant.TenantStatus status, Pageable pageable);

    /**
     * Search tenants by name or slug.
     */
    @Query("SELECT t FROM Tenant t WHERE " +
           "LOWER(t.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(t.slug) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Tenant> search(@Param("search") String search, Pageable pageable);

    /**
     * Find tenant with Jitsi domain.
     */
    Optional<Tenant> findByJitsiDomain(String jitsiDomain);
}
