package com.jmp.domain.repository;

import com.jmp.domain.entity.Recording;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Repository for Recording entity operations.
 * Per specification §5.6, §16.1-16.10
 */
@Repository
public interface RecordingRepository extends JpaRepository<Recording, UUID> {

    /**
     * Find recording by key.
     */
    Optional<Recording> findByRecordingKey(String recordingKey);

    /**
     * Find all recordings for a conference.
     */
    List<Recording> findByConferenceIdAndDeletedAtIsNull(UUID conferenceId);

    /**
     * Find all recordings for a tenant with pagination.
     */
    Page<Recording> findByTenantIdAndDeletedAtIsNull(UUID tenantId, Pageable pageable);

    /**
     * Find recordings by status.
     */
    List<Recording> findByStatusAndDeletedAtIsNull(Recording.RecordingStatus status);

    /**
     * Find ready recordings for a tenant.
     */
    @Query("SELECT r FROM Recording r WHERE r.tenant.id = :tenantId " +
           "AND r.status = 'READY' AND r.deletedAt IS NULL " +
           "ORDER BY r.createdAt DESC")
    Page<Recording> findReadyByTenantId(@Param("tenantId") UUID tenantId, Pageable pageable);

    /**
     * Search recordings by conference name.
     */
    @Query("SELECT r FROM Recording r WHERE r.tenant.id = :tenantId " +
           "AND r.deletedAt IS NULL " +
           "AND (LOWER(r.conference.displayName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(r.originalFilename) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY r.createdAt DESC")
    Page<Recording> searchByTenantId(@Param("tenantId") UUID tenantId, 
                                     @Param("search") String search, 
                                     Pageable pageable);

    /**
     * Find recordings that have exceeded retention period.
     */
    @Query("SELECT r FROM Recording r WHERE r.retentionUntil IS NOT NULL " +
           "AND r.retentionUntil < :now " +
           "AND r.status NOT IN ('ARCHIVED', 'DELETED') " +
           "AND r.deletedAt IS NULL")
    List<Recording> findExpiredRecordings(@Param("now") Instant now);

    /**
     * Calculate total storage used by tenant.
     */
    @Query("SELECT COALESCE(SUM(r.fileSizeBytes), 0) FROM Recording r " +
           "WHERE r.tenant.id = :tenantId " +
           "AND r.status = 'READY' " +
           "AND r.deletedAt IS NULL")
    Long calculateTotalStorageUsed(@Param("tenantId") UUID tenantId);

    /**
     * Count recordings by status for a tenant.
     */
    long countByTenantIdAndStatusAndDeletedAtIsNull(UUID tenantId, Recording.RecordingStatus status);

    /**
     * Find recordings pending processing.
     */
    List<Recording> findByStatusInAndDeletedAtIsNull(
        List<Recording.RecordingStatus> statuses
    );

    /**
     * Find recordings by conference and type.
     */
    List<Recording> findByConferenceIdAndRecordingTypeAndDeletedAtIsNull(
        UUID conferenceId, 
        Recording.RecordingType type
    );
}
