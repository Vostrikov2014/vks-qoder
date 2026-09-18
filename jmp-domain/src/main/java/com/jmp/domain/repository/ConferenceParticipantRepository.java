package com.jmp.domain.repository;

import com.jmp.domain.entity.ConferenceParticipant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for ConferenceParticipant entity operations.
 */
@Repository
public interface ConferenceParticipantRepository extends JpaRepository<ConferenceParticipant, UUID> {

    Optional<ConferenceParticipant> findByConferenceIdAndExternalId(UUID conferenceId, String externalId);

    List<ConferenceParticipant> findByConferenceIdAndStatus(UUID conferenceId, ConferenceParticipant.ParticipantStatus status);

    long countByConferenceIdAndStatus(UUID conferenceId, ConferenceParticipant.ParticipantStatus status);
}
