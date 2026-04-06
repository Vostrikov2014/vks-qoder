package com.jmp.application.service;

import com.jmp.domain.entity.AuditLog;
import com.jmp.domain.entity.User;
import com.jmp.domain.repository.AuditLogRepository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for audit logging operations.
 * Per specification §17.1-17.10
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    /**
     * Log an audit event asynchronously.
     */
    @Async("auditExecutor")
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logEvent(AuditLog.AuditEventType eventType,
                         String action,
                         String entityType,
                         UUID entityId,
                         User user,
                         UUID tenantId,
                         Object oldValues,
                         Object newValues,
                         String ipAddress,
                         String userAgent,
                         boolean success,
                         String errorMessage) {
        
        try {
            AuditLog auditLog = new AuditLog();
            auditLog.setEventType(eventType);
            auditLog.setAction(action);
            auditLog.setEntityType(entityType);
            auditLog.setEntityId(entityId);
            auditLog.setUser(user);
            auditLog.setTenantId(tenantId);
            auditLog.setUserEmail(user != null ? user.getEmail() : null);
            auditLog.setIpAddress(ipAddress);
            auditLog.setUserAgent(userAgent);
            auditLog.setOldValues(oldValues);
            auditLog.setNewValues(newValues);
            auditLog.setSuccess(success);
            auditLog.setErrorMessage(errorMessage);
            auditLog.setSeverity(success ? "INFO" : "ERROR");

            auditLogRepository.save(auditLog);
            
            if (!success) {
                log.warn("Audit log recorded failure: {} - {}", action, errorMessage);
            }
        } catch (Exception e) {
            log.error("Failed to write audit log", e);
        }
    }

    /**
     * Log authentication event.
     */
    public void logAuthentication(String action, User user, UUID tenantId, 
                                   String ipAddress, boolean success, String errorMessage) {
        logEvent(
            AuditLog.AuditEventType.AUTHENTICATION,
            action,
            "USER",
            user != null ? user.getId() : null,
            user,
            tenantId,
            null,
            null,
            ipAddress,
            null,
            success,
            errorMessage
        );
    }

    /**
     * Log user management event.
     */
    public void logUserManagement(String action, User targetUser, User actor,
                                   UUID tenantId, Object oldValues, Object newValues) {
        logEvent(
            AuditLog.AuditEventType.USER_MANAGEMENT,
            action,
            "USER",
            targetUser.getId(),
            actor,
            tenantId,
            oldValues,
            newValues,
            null,
            null,
            true,
            null
        );
    }

    /**
     * Log conference event.
     */
    public void logConference(String action, UUID conferenceId, UUID tenantId,
                               User user, Object metadata) {
        logEvent(
            AuditLog.AuditEventType.CONFERENCE,
            action,
            "CONFERENCE",
            conferenceId,
            user,
            tenantId,
            null,
            metadata,
            null,
            null,
            true,
            null
        );
    }

    /**
     * Log recording event.
     */
    public void logRecording(String action, UUID recordingId, UUID tenantId,
                              User user, boolean success, String errorMessage) {
        logEvent(
            AuditLog.AuditEventType.RECORDING,
            action,
            "RECORDING",
            recordingId,
            user,
            tenantId,
            null,
            null,
            null,
            null,
            success,
            errorMessage
        );
    }

    /**
     * Log security event.
     */
    public void logSecurity(String action, String details, String ipAddress, boolean success) {
        logEvent(
            AuditLog.AuditEventType.SECURITY,
            action,
            null,
            null,
            null,
            null,
            null,
            details,
            ipAddress,
            null,
            success,
            success ? null : details
        );
    }

    /**
     * Search audit logs.
     */
    @Transactional(readOnly = true)
    public Page<AuditLog> searchAuditLogs(UUID tenantId,
                                          AuditLog.AuditEventType eventType,
                                          UUID userId,
                                          Instant startDate,
                                          Instant endDate,
                                          Pageable pageable) {
        return auditLogRepository.searchAuditLogs(tenantId, eventType, userId, startDate, endDate, pageable);
    }

    /**
     * Get audit logs for entity.
     */
    @Transactional(readOnly = true)
    public List<AuditLog> getEntityAuditLogs(String entityType, UUID entityId) {
        return auditLogRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(entityType, entityId);
    }

    /**
     * Get security events.
     */
    @Transactional(readOnly = true)
    public List<AuditLog> getSecurityEvents(Instant since) {
        return auditLogRepository.findSecurityEvents(since);
    }
}
