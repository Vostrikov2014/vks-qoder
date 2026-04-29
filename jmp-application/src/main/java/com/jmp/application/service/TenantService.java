package com.jmp.application.service;

import com.jmp.application.dto.TenantDto;
import com.jmp.application.mapper.TenantMapper;
import com.jmp.domain.entity.Tenant;
import com.jmp.domain.repository.TenantRepository;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for tenant management operations.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class TenantService {

    private final TenantRepository tenantRepository;
    private final TenantMapper tenantMapper;

    /**
     * Create a new tenant.
     */
    @Transactional
    public TenantDto.Response createTenant(TenantDto.CreateRequest request) {
        log.info("Creating tenant with name: {}, slug: {}", request.name(), request.slug());

        if (tenantRepository.existsBySlug(request.slug())) {
            throw new IllegalArgumentException("Tenant slug already exists: " + request.slug());
        }
        if (request.domain() != null && !request.domain().isBlank()
                && tenantRepository.existsByDomain(request.domain())) {
            throw new IllegalArgumentException("Tenant domain already exists: " + request.domain());
        }

        Tenant tenant = tenantMapper.toEntity(request);
        Tenant saved = tenantRepository.save(tenant);
        log.info("Tenant created with ID: {}", saved.getId());
        return tenantMapper.toResponse(saved);
    }

    /**
     * Get tenant by ID.
     */
    public TenantDto.Response getTenant(UUID id) {
        Tenant tenant = tenantRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Tenant not found: " + id));
        return tenantMapper.toResponse(tenant);
    }

    /**
     * List all tenants with pagination.
     */
    public Page<TenantDto.Summary> listTenants(Pageable pageable) {
        return tenantRepository.findAll(pageable).map(tenantMapper::toSummary);
    }

    /**
     * Search tenants by name or slug.
     */
    public Page<TenantDto.Summary> searchTenants(String search, Pageable pageable) {
        return tenantRepository.search(search, pageable).map(tenantMapper::toSummary);
    }

    /**
     * Update tenant.
     */
    @Transactional
    public TenantDto.Response updateTenant(UUID id, TenantDto.UpdateRequest request) {
        log.info("Updating tenant: {}", id);

        Tenant tenant = tenantRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Tenant not found: " + id));

        tenantMapper.updateEntityFromDto(request, tenant);

        Tenant updated = tenantRepository.save(tenant);
        log.info("Tenant updated: {}", id);
        return tenantMapper.toResponse(updated);
    }

    /**
     * Suspend tenant with reason.
     */
    @Transactional
    public TenantDto.Response suspendTenant(UUID id, String reason) {
        log.info("Suspending tenant: {}", id);

        Tenant tenant = tenantRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Tenant not found: " + id));

        tenant.suspend(reason);
        Tenant updated = tenantRepository.save(tenant);
        log.info("Tenant suspended: {}", id);
        return tenantMapper.toResponse(updated);
    }

    /**
     * Activate a suspended tenant.
     */
    @Transactional
    public TenantDto.Response activateTenant(UUID id) {
        log.info("Activating tenant: {}", id);

        Tenant tenant = tenantRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Tenant not found: " + id));

        tenant.activate();
        Tenant updated = tenantRepository.save(tenant);
        log.info("Tenant activated: {}", id);
        return tenantMapper.toResponse(updated);
    }

    /**
     * Soft delete tenant (set status to DELETED).
     */
    @Transactional
    public void deleteTenant(UUID id) {
        log.info("Deleting tenant: {}", id);

        Tenant tenant = tenantRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Tenant not found: " + id));

        tenant.setStatus(Tenant.TenantStatus.DELETED);
        tenantRepository.save(tenant);
        log.info("Tenant soft deleted: {}", id);
    }
}
