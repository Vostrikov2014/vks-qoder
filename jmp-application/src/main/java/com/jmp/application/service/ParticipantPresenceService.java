package com.jmp.application.service;

import com.jmp.domain.entity.Conference;
import com.jmp.domain.entity.ConferenceParticipant;
import com.jmp.domain.entity.User;
import com.jmp.domain.repository.ConferenceParticipantRepository;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Records who is in a conference.
 *
 * <p>Jitsi is not wired to send webhooks in this deployment, so presence is captured at
 * the only moment the platform knows for certain that a person is about to enter the
 * room: when a Jitsi token is minted for them. A re-entry refreshes the existing row
 * instead of appending a new one, which is what keeps "unique participants" in the
 * analytics meaningful.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ParticipantPresenceService {

    private final ConferenceParticipantRepository participantRepository;

    /**
     * Record that a person entered the conference through a freshly minted Jitsi token.
     *
     * @param user nullable — anonymous guests are keyed on their display name
     */
    @Transactional
    public void recordEntry(Conference conference, User user, String displayName, boolean moderator) {
        ConferenceParticipant participant = findExisting(conference, user, displayName)
            .orElseGet(() -> newParticipant(conference, user));

        participant.setDisplayName(displayName);
        participant.setRole(resolveRole(conference, user, moderator));
        participant.setIsModerator(moderator);
        participant.markJoined();
        participantRepository.save(participant);
    }

    /**
     * Close the presence of everybody still marked as joined — called when the conference
     * ends, since the webhooks that would report individual leaves are not in use.
     */
    @Transactional
    public void markAllLeft(UUID conferenceId) {
        for (ConferenceParticipant participant : participantRepository.findByConferenceIdAndStatus(
                conferenceId, ConferenceParticipant.ParticipantStatus.JOINED)) {
            participant.markLeft();
            participantRepository.save(participant);
        }
        log.info("Marked remaining participants as left for conference: {}", conferenceId);
    }

    private Optional<ConferenceParticipant> findExisting(Conference conference, User user, String displayName) {
        if (user != null) {
            return participantRepository
                .findFirstByConferenceIdAndUserIdOrderByCreatedAtDesc(conference.getId(), user.getId());
        }
        return participantRepository
            .findFirstByConferenceIdAndUserIdIsNullAndDisplayNameOrderByCreatedAtDesc(conference.getId(), displayName);
    }

    private ConferenceParticipant newParticipant(Conference conference, User user) {
        ConferenceParticipant participant = new ConferenceParticipant();
        participant.setConference(conference);
        participant.setUser(user);
        if (user != null) {
            participant.setEmail(user.getEmail());
        }
        return participant;
    }

    private ConferenceParticipant.ParticipantRole resolveRole(Conference conference, User user, boolean moderator) {
        if (user == null) {
            return ConferenceParticipant.ParticipantRole.GUEST;
        }
        if (user.getId().equals(conference.getCreatedBy().getId())) {
            return ConferenceParticipant.ParticipantRole.HOST;
        }
        return moderator
            ? ConferenceParticipant.ParticipantRole.MODERATOR
            : ConferenceParticipant.ParticipantRole.PARTICIPANT;
    }
}
