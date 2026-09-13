package com.jmp.domain.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.jmp.domain.entity.ConferenceLink;

/**
 * Repository for permanent conference join links.
 */
@Repository
public interface ConferenceLinkRepository extends JpaRepository<ConferenceLink, UUID> {

    /**
     * Find a link by its public slug together with the associations needed to resolve
     * a join request (open-in-view is disabled, so they must be fetched eagerly).
     */
    @EntityGraph(attributePaths = {"conference", "conference.tenant", "conference.createdBy", "createdBy"})
    Optional<ConferenceLink> findBySlug(String slug);

    /**
     * All links of a conference, oldest first — the oldest active one is the primary link.
     */
    @EntityGraph(attributePaths = {"createdBy"})
    List<ConferenceLink> findByConferenceIdOrderByCreatedAtAsc(UUID conferenceId);

    Optional<ConferenceLink> findByIdAndConferenceId(UUID id, UUID conferenceId);
}
