package com.jmp.api.controller;

import com.jmp.application.service.AnalyticsService;
import com.jmp.infrastructure.security.JwtAuthenticationFilter;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Analytics and reporting controller.
 * Per specification §18.1-18.10
 */
@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
@Slf4j
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Analytics", description = "Analytics and reporting endpoints")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('TENANT_ADMIN') or hasRole('SUPER_ADMIN') or hasRole('AUDITOR')")
    @Operation(summary = "Get dashboard metrics")
    public ResponseEntity<AnalyticsService.DashboardMetrics> getDashboardMetrics(
            Authentication authentication) {
        
        UUID tenantId = extractTenantId(authentication);
        return ResponseEntity.ok(analyticsService.getDashboardMetrics(tenantId));
    }

    @GetMapping("/usage-report")
    @PreAuthorize("hasRole('TENANT_ADMIN') or hasRole('SUPER_ADMIN') or hasRole('AUDITOR')")
    @Operation(summary = "Get usage report for date range")
    public ResponseEntity<AnalyticsService.UsageReport> getUsageReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant endDate,
            Authentication authentication) {
        
        UUID tenantId = extractTenantId(authentication);
        return ResponseEntity.ok(analyticsService.getUsageReport(tenantId, startDate, endDate));
    }

    @GetMapping("/participants")
    @PreAuthorize("hasRole('TENANT_ADMIN') or hasRole('SUPER_ADMIN') or hasRole('AUDITOR')")
    @Operation(summary = "Get participant analytics")
    public ResponseEntity<AnalyticsService.ParticipantAnalytics> getParticipantAnalytics(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant endDate,
            Authentication authentication) {
        
        UUID tenantId = extractTenantId(authentication);
        return ResponseEntity.ok(analyticsService.getParticipantAnalytics(tenantId, startDate, endDate));
    }

    @GetMapping("/recordings")
    @PreAuthorize("hasRole('TENANT_ADMIN') or hasRole('SUPER_ADMIN') or hasRole('AUDITOR')")
    @Operation(summary = "Get recording analytics")
    public ResponseEntity<AnalyticsService.RecordingAnalytics> getRecordingAnalytics(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant endDate,
            Authentication authentication) {
        
        UUID tenantId = extractTenantId(authentication);
        return ResponseEntity.ok(analyticsService.getRecordingAnalytics(tenantId, startDate, endDate));
    }

    @GetMapping("/system-health")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Get system health metrics")
    public ResponseEntity<AnalyticsService.SystemHealthMetrics> getSystemHealthMetrics() {
        return ResponseEntity.ok(analyticsService.getSystemHealthMetrics());
    }

    private UUID extractTenantId(Authentication authentication) {
        if (authentication.getDetails() instanceof JwtAuthenticationFilter.WebAuthenticationDetails details) {
            return details.getTenantId();
        }
        throw new IllegalStateException("Cannot extract tenant ID from authentication");
    }
}
