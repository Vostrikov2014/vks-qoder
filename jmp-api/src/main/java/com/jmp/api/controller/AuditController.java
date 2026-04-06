package com.jmp.api.controller;

import com.jmp.application.service.AuditService;
import com.jmp.domain.entity.AuditLog;
import com.jmp.infrastructure.security.JwtAuthenticationFilter;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Audit log controller.
 * Per specification §17.1-17.10
 */
@RestController
@RequestMapping("/api/v1/audit")
@RequiredArgsConstructor
@Slf4j
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Audit", description = "Audit log endpoints")
public class AuditController {

    private final AuditService auditService;

    @GetMapping
    @PreAuthorize("hasRole('TENANT_ADMIN') or hasRole('SUPER_ADMIN') or hasRole('AUDITOR')")
    @Operation(summary = "Search audit logs")
    public ResponseEntity<Page<AuditLog>> searchAuditLogs(
            @RequestParam(required = false) AuditLog.AuditEventType eventType,
            @RequestParam(required = false) UUID userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant endDate,
            Pageable pageable,
            Authentication authentication) {
        
        UUID tenantId = extractTenantId(authentication);
        return ResponseEntity.ok(auditService.searchAuditLogs(tenantId, eventType, userId, startDate, endDate, pageable));
    }

    @GetMapping("/entity/{entityType}/{entityId}")
    @PreAuthorize("hasRole('TENANT_ADMIN') or hasRole('SUPER_ADMIN') or hasRole('AUDITOR')")
    @Operation(summary = "Get audit logs for entity")
    public ResponseEntity<List<AuditLog>> getEntityAuditLogs(
            @PathVariable String entityType,
            @PathVariable UUID entityId) {
        
        return ResponseEntity.ok(auditService.getEntityAuditLogs(entityType, entityId));
    }

    @GetMapping("/security-events")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasRole('AUDITOR')")
    @Operation(summary = "Get security events")
    public ResponseEntity<List<AuditLog>> getSecurityEvents(
            @RequestParam(defaultValue = "24") int hoursBack) {
        
        Instant since = Instant.now().minusSeconds(hoursBack * 3600);
        return ResponseEntity.ok(auditService.getSecurityEvents(since));
    }

    private UUID extractTenantId(Authentication authentication) {
        if (authentication.getDetails() instanceof JwtAuthenticationFilter.WebAuthenticationDetails details) {
            return details.getTenantId();
        }
        throw new IllegalStateException("Cannot extract tenant ID from authentication");
    }
}
