package com.jmp.domain.repository;

import com.jmp.domain.entity.IdentityProvider;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for IdentityProvider entity.
 * Per specification §19.1-19.10
 */
@Repository
public interface IdentityProviderRepository extends JpaRepository<IdentityProvider, UUID> {

    /**
     * Find all identity providers for a tenant.
     */
    List<IdentityProvider> findByTenantId(UUID tenantId);

    /**
     * Find enabled identity providers for a tenant.
     */
    List<IdentityProvider> findByTenantIdAndEnabledTrue(UUID tenantId);

    /**
     * Find identity provider by tenant and name.
     */
    Optional<IdentityProvider> findByTenantIdAndName(UUID tenantId, String name);

    /**
     * Check if identity provider exists for tenant.
     */
    boolean existsByTenantIdAndName(UUID tenantId, String name);
}
