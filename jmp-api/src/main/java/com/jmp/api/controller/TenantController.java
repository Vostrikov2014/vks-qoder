package com.jmp.api.controller;

import com.jmp.application.dto.TenantDto;
import com.jmp.application.service.TenantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Tenant management controller.
 * Accessible only to SUPER_ADMIN role.
 */
@RestController
@RequestMapping("/api/v1/tenants")
@RequiredArgsConstructor
@Slf4j
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Tenants", description = "Tenant management endpoints (Super Admin only)")
public class TenantController {

    private final TenantService tenantService;

    @GetMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "List all tenants")
    public ResponseEntity<Page<TenantDto.Summary>> listTenants(
            Pageable pageable,
            @RequestParam(required = false) String search) {
        Page<TenantDto.Summary> tenants = (search != null && !search.isBlank())
            ? tenantService.searchTenants(search, pageable)
            : tenantService.listTenants(pageable);
        return ResponseEntity.ok(tenants);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Get tenant by ID")
    public ResponseEntity<TenantDto.Response> getTenant(@PathVariable UUID id) {
        return ResponseEntity.ok(tenantService.getTenant(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Create a new tenant")
    public ResponseEntity<TenantDto.Response> createTenant(
            @Valid @RequestBody TenantDto.CreateRequest request) {
        TenantDto.Response created = tenantService.createTenant(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Update tenant")
    public ResponseEntity<TenantDto.Response> updateTenant(
            @PathVariable UUID id,
            @Valid @RequestBody TenantDto.UpdateRequest request) {
        return ResponseEntity.ok(tenantService.updateTenant(id, request));
    }

    @PostMapping("/{id}/suspend")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Suspend tenant")
    public ResponseEntity<TenantDto.Response> suspendTenant(
            @PathVariable UUID id,
            @RequestBody(required = false) TenantDto.SuspendRequest request) {
        String reason = request != null ? request.reason() : null;
        return ResponseEntity.ok(tenantService.suspendTenant(id, reason));
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Activate tenant")
    public ResponseEntity<TenantDto.Response> activateTenant(@PathVariable UUID id) {
        return ResponseEntity.ok(tenantService.activateTenant(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Delete tenant (soft delete)")
    public ResponseEntity<Void> deleteTenant(@PathVariable UUID id) {
        tenantService.deleteTenant(id);
        return ResponseEntity.noContent().build();
    }
}
