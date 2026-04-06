package com.jmp.domain.repository;

import com.jmp.domain.entity.Conference;
import java.time.Instant;
import java.util.List;
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
 * Repository for Conference entity operations.
 * Per specification §5.3, §9.2
 */
@Repository
public interface ConferenceRepository extends JpaRepository<Conference, UUID> {

    /**
     * Find conference by ID with all associations.
     */
    @EntityGraph(attributePaths = {"createdBy", "tenant", "participants"})
    Optional<Conference> findWithDetailsById(UUID id);

    /**
     * Find conference by room name and tenant.
     */
    Optional<Conference> findByRoomNameAndTenantId(String roomName, UUID tenantId);

    /**
     * Find all conferences by tenant ID.
     */
    @EntityGraph(attributePaths = {"createdBy"})
    Page<Conference> findByTenantIdAndDeletedAtIsNull(UUID tenantId, Pageable pageable);

    /**
     * Find conferences by status and tenant.
     */
    List<Conference> findByTenantIdAndStatusAndDeletedAtIsNull(UUID tenantId, Conference.ConferenceStatus status);

    /**
     * Find active conferences for a tenant.
     */
    @Query("SELECT c FROM Conference c WHERE c.tenant.id = :tenantId " +
           "AND c.status = 'ACTIVE' AND c.deletedAt IS NULL")
    List<Conference> findActiveByTenantId(@Param("tenantId") UUID tenantId);

    /**
     * Find upcoming conferences (scheduled to start in the future).
     */
    @Query("SELECT c FROM Conference c WHERE c.tenant.id = :tenantId " +
           "AND c.status = 'SCHEDULED' " +
           "AND c.scheduledStartAt > :now " +
           "AND c.deletedAt IS NULL " +
           "ORDER BY c.scheduledStartAt")
    List<Conference> findUpcomingByTenantId(@Param("tenantId") UUID tenantId, @Param("now") Instant now);

    /**
     * Search conferences by name or room name.
     */
    @Query("SELECT c FROM Conference c WHERE c.tenant.id = :tenantId " +
           "AND c.deletedAt IS NULL " +
           "AND (LOWER(c.displayName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(c.roomName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(c.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Conference> searchByTenantId(@Param("tenantId") UUID tenantId,
                                      @Param("search") String search,
                                      Pageable pageable);

    /**
     * Find conferences created by a user.
     */
    Page<Conference> findByCreatedByIdAndDeletedAtIsNull(UUID userId, Pageable pageable);

    /**
     * Count conferences by status and tenant.
     */
    long countByTenantIdAndStatusAndDeletedAtIsNull(UUID tenantId, Conference.ConferenceStatus status);

    /**
     * Find conferences scheduled to start between dates.
     */
    @Query("SELECT c FROM Conference c WHERE c.tenant.id = :tenantId " +
           "AND c.scheduledStartAt BETWEEN :start AND :end " +
           "AND c.deletedAt IS NULL")
    List<Conference> findScheduledBetween(@Param("tenantId") UUID tenantId,
                                          @Param("start") Instant start,
                                          @Param("end") Instant end);

    /**
     * Find conferences that should be auto-started.
     */
    @Query("SELECT c FROM Conference c WHERE c.status = 'SCHEDULED' " +
           "AND c.scheduledStartAt <= :now " +
           "AND c.deletedAt IS NULL")
    List<Conference> findConferencesToStart(@Param("now") Instant now);

    /**
     * Find conferences that should be auto-ended.
     */
    @Query("SELECT c FROM Conference c WHERE c.status = 'ACTIVE' " +
           "AND c.scheduledEndAt <= :now " +
           "AND c.deletedAt IS NULL")
    List<Conference> findConferencesToEnd(@Param("now") Instant now);
}
