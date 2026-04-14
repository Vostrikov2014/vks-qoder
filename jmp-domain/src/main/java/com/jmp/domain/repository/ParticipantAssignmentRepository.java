package com.jmp.domain.repository;

import com.jmp.domain.entity.ParticipantAssignment;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for ParticipantAssignment entity operations.
 * Per specification §8.1
 */
@Repository
public interface ParticipantAssignmentRepository extends JpaRepository<ParticipantAssignment, UUID> {

    /**
     * Find all assignments for a conference.
     */
    List<ParticipantAssignment> findByConferenceId(UUID conferenceId);

    /**
     * Find assignment by conference and email.
     */
    Optional<ParticipantAssignment> findByConferenceIdAndEmail(UUID conferenceId, String email);

    /**
     * Find assignment by conference and user ID.
     */
    Optional<ParticipantAssignment> findByConferenceIdAndUserId(UUID conferenceId, UUID userId);

    /**
     * Find assignments by conference and status.
     */
    List<ParticipantAssignment> findByConferenceIdAndStatus(UUID conferenceId,
                                                            ParticipantAssignment.AssignmentStatus status);

    /**
     * Count assignments for a conference.
     */
    long countByConferenceId(UUID conferenceId);

    /**
     * Check if assignment exists by conference and email.
     */
    boolean existsByConferenceIdAndEmail(UUID conferenceId, String email);

    /**
     * Find assignment by ID and conference.
     */
    Optional<ParticipantAssignment> findByIdAndConferenceId(UUID id, UUID conferenceId);
}
