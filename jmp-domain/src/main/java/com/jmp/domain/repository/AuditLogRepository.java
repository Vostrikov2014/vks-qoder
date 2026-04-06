package com.jmp.domain.repository;

import com.jmp.domain.entity.AuditLog;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Repository for AuditLog entity operations.
 * Per specification §17.1-17.10
 */
@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    /**
     * Find audit logs by tenant with pagination.
     */
    Page<AuditLog> findByTenantIdOrderByCreatedAtDesc(UUID tenantId, Pageable pageable);

    /**
     * Find audit logs by user.
     */
    Page<AuditLog> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    /**
     * Find audit logs by event type.
     */
    Page<AuditLog> findByEventTypeOrderByCreatedAtDesc(AuditLog.AuditEventType eventType, Pageable pageable);

    /**
     * Find audit logs by entity.
     */
    List<AuditLog> findByEntityTypeAndEntityIdOrderByCreatedAtDesc(String entityType, UUID entityId);

    /**
     * Search audit logs with filters.
     */
    @Query("SELECT a FROM AuditLog a WHERE " +
           "(:tenantId IS NULL OR a.tenantId = :tenantId) AND " +
           "(:eventType IS NULL OR a.eventType = :eventType) AND " +
           "(:userId IS NULL OR a.user.id = :userId) AND " +
           "(:startDate IS NULL OR a.createdAt >= :startDate) AND " +
           "(:endDate IS NULL OR a.createdAt <= :endDate) " +
           "ORDER BY a.createdAt DESC")
    Page<AuditLog> searchAuditLogs(
        @Param("tenantId") UUID tenantId,
        @Param("eventType") AuditLog.AuditEventType eventType,
        @Param("userId") UUID userId,
        @Param("startDate") Instant startDate,
        @Param("endDate") Instant endDate,
        Pageable pageable
    );

    /**
     * Find failed operations.
     */
    Page<AuditLog> findBySuccessFalseOrderByCreatedAtDesc(Pageable pageable);

    /**
     * Find security events.
     */
    @Query("SELECT a FROM AuditLog a WHERE a.eventType IN ('SECURITY', 'AUTHENTICATION') " +
           "AND a.createdAt >= :since ORDER BY a.createdAt DESC")
    List<AuditLog> findSecurityEvents(@Param("since") Instant since);

    /**
     * Count events by type in date range.
     */
    @Query("SELECT a.eventType, COUNT(a) FROM AuditLog a WHERE " +
           "a.createdAt BETWEEN :start AND :end " +
           "GROUP BY a.eventType")
    List<Object[]> countEventsByType(@Param("start") Instant start, @Param("end") Instant end);

    /**
     * Delete old audit logs (for retention policy).
     */
    void deleteByCreatedAtBefore(Instant before);
}
