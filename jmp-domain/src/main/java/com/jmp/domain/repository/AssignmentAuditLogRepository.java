package com.jmp.domain.repository;

import com.jmp.domain.entity.AssignmentAuditLog;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for AssignmentAuditLog entity operations.
 * Per specification §8.1
 */
@Repository
public interface AssignmentAuditLogRepository extends JpaRepository<AssignmentAuditLog, UUID> {

    /**
     * Find audit log entries for a conference, ordered by creation date descending.
     */
    List<AssignmentAuditLog> findByConferenceIdOrderByCreatedAtDesc(UUID conferenceId);

    /**
     * Find audit log entries by actor ID.
     */
    List<AssignmentAuditLog> findByActorId(UUID actorId);
}
