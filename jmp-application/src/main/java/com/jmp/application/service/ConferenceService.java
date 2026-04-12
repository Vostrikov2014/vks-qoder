package com.jmp.application.service;

import com.jmp.application.dto.ConferenceDto;
import com.jmp.application.mapper.ConferenceMapper;
import com.jmp.domain.entity.Conference;
import com.jmp.domain.entity.ConferenceParticipant;
import com.jmp.domain.entity.Tenant;
import com.jmp.domain.entity.User;
import com.jmp.domain.repository.ConferenceRepository;
import com.jmp.domain.repository.TenantRepository;
import com.jmp.domain.repository.UserRepository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for conference management operations.
 * Per specification §5.3, §6.3
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class ConferenceService {

    private final ConferenceRepository conferenceRepository;
    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final ConferenceMapper conferenceMapper;

    /**
     * Create a new conference.
     * Complexity: O(1) for DB operations
     */
    @Transactional
    public ConferenceDto.Response createConference(UUID tenantId, UUID userId, ConferenceDto.CreateRequest request) {
        log.info("Creating conference: {} for tenant: {}", request.roomName(), tenantId);

        Tenant tenant = tenantRepository.findById(tenantId)
            .orElseThrow(() -> new IllegalArgumentException("Tenant not found: " + tenantId));

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        // Check room name uniqueness within tenant
        conferenceRepository.findByRoomNameAndTenantId(request.roomName(), tenantId)
            .ifPresent(c -> {
                throw new IllegalArgumentException("Room name already exists: " + request.roomName());
            });

        // Validate conference type
        Conference.ConferenceType type;
        try {
            type = Conference.ConferenceType.valueOf(request.type());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid conference type: " + request.type() + ". Valid types: SCHEDULED, PERMANENT");
        }

        // For SCHEDULED type, require scheduled start time
        if (type == Conference.ConferenceType.SCHEDULED && request.scheduledStartAt() == null) {
            throw new IllegalArgumentException("Scheduled conferences must have a scheduledStartAt");
        }

        Conference conference = conferenceMapper.toEntity(request);
        conference.setTenant(tenant);
        conference.setCreatedBy(user);
        conference.setStatus(Conference.ConferenceStatus.SCHEDULED);

        Conference saved = conferenceRepository.save(conference);
        log.info("Conference created with ID: {}", saved.getId());

        return conferenceMapper.toResponse(saved);
    }

    /**
     * Get conference by ID.
     */
    public ConferenceDto.Response getConference(UUID id) {
        Conference conference = conferenceRepository.findWithDetailsById(id)
            .orElseThrow(() -> new IllegalArgumentException("Conference not found: " + id));
        return conferenceMapper.toResponse(conference);
    }

    /**
     * Get conference by ID with participant-only access check.
     */
    public ConferenceDto.Response getConference(UUID id, UUID userId, boolean isParticipantOnly) {
        Conference conference = conferenceRepository.findWithDetailsById(id)
            .orElseThrow(() -> new IllegalArgumentException("Conference not found: " + id));

        if (isParticipantOnly) {
            boolean isCreator = conference.getCreatedBy().getId().equals(userId);
            boolean isParticipant = conference.getParticipants().stream()
                .map(ConferenceParticipant::getUser)
                .anyMatch(user -> user != null && user.getId().equals(userId));

            if (!isCreator && !isParticipant) {
                throw new AccessDeniedException("You do not have access to this conference");
            }
        }

        return conferenceMapper.toResponse(conference);
    }

    /**
     * List conferences by tenant with pagination.
     */
    public Page<ConferenceDto.Summary> listConferences(UUID tenantId, UUID userId, boolean isParticipantOnly, Pageable pageable) {
        if (isParticipantOnly) {
            return conferenceRepository.findByTenantIdAndParticipantUserId(tenantId, userId, pageable)
                .map(conferenceMapper::toSummary);
        }
        return conferenceRepository.findByTenantIdAndDeletedAtIsNull(tenantId, pageable)
            .map(conferenceMapper::toSummary);
    }

    /**
     * Search conferences within a tenant.
     */
    public Page<ConferenceDto.Summary> searchConferences(UUID tenantId, UUID userId, boolean isParticipantOnly, String search, Pageable pageable) {
        if (isParticipantOnly) {
            return conferenceRepository.searchByTenantIdAndParticipantUserId(tenantId, userId, search, pageable)
                .map(conferenceMapper::toSummary);
        }
        return conferenceRepository.searchByTenantId(tenantId, search, pageable)
            .map(conferenceMapper::toSummary);
    }

    /**
     * Get active conferences for a tenant.
     */
    public List<ConferenceDto.Summary> getActiveConferences(UUID tenantId, UUID userId, boolean isParticipantOnly) {
        if (isParticipantOnly) {
            return conferenceRepository.findActiveByTenantIdAndParticipantUserId(tenantId, userId).stream()
                .map(conferenceMapper::toSummary)
                .toList();
        }
        return conferenceRepository.findActiveByTenantId(tenantId).stream()
            .map(conferenceMapper::toSummary)
            .toList();
    }

    /**
     * Get upcoming conferences for a tenant.
     */
    public List<ConferenceDto.Summary> getUpcomingConferences(UUID tenantId, UUID userId, boolean isParticipantOnly) {
        if (isParticipantOnly) {
            return conferenceRepository.findUpcomingByTenantIdAndParticipantUserId(tenantId, userId, Instant.now()).stream()
                .map(conferenceMapper::toSummary)
                .toList();
        }
        return conferenceRepository.findUpcomingByTenantId(tenantId, Instant.now()).stream()
            .map(conferenceMapper::toSummary)
            .toList();
    }

    /**
     * Update conference.
     */
    @Transactional
    public ConferenceDto.Response updateConference(UUID id, ConferenceDto.UpdateRequest request, UUID userId, boolean isAdmin) {
        log.info("Updating conference: {}", id);

        Conference conference = conferenceRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Conference not found: " + id));

        // Check ownership for non-admin users
        if (!isAdmin && !conference.getCreatedBy().getId().equals(userId)) {
            throw new AccessDeniedException("Only the conference creator or administrators can perform this action");
        }

        // Only allow updates for scheduled conferences
        if (conference.getStatus() == Conference.ConferenceStatus.ENDED ||
            conference.getStatus() == Conference.ConferenceStatus.CANCELLED) {
            throw new IllegalStateException("Cannot update ended or cancelled conference");
        }

        // Validate type change if provided
        if (request.type() != null) {
            Conference.ConferenceType newType;
            try {
                newType = Conference.ConferenceType.valueOf(request.type());
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid conference type: " + request.type() + ". Valid types: SCHEDULED, PERMANENT");
            }

            // If changing to SCHEDULED, require scheduled start time
            if (newType == Conference.ConferenceType.SCHEDULED &&
                request.scheduledStartAt() == null &&
                conference.getScheduledStartAt() == null) {
                throw new IllegalArgumentException("Scheduled conferences must have a scheduledStartAt");
            }
        }

        conferenceMapper.updateEntityFromDto(request, conference);
        Conference updated = conferenceRepository.save(conference);

        log.info("Conference updated: {}", id);
        return conferenceMapper.toResponse(updated);
    }

    /**
     * Start a conference.
     */
    @Transactional
    public ConferenceDto.Response startConference(UUID id, UUID userId, boolean isAdmin) {
        log.info("Starting conference: {}", id);

        Conference conference = conferenceRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Conference not found: " + id));

        // Check ownership for non-admin users
        if (!isAdmin && !conference.getCreatedBy().getId().equals(userId)) {
            throw new AccessDeniedException("Only the conference creator or administrators can perform this action");
        }

        if (conference.getStatus() != Conference.ConferenceStatus.SCHEDULED) {
            throw new IllegalStateException("Conference is not in scheduled state");
        }

        conference.start();
        Conference updated = conferenceRepository.save(conference);

        log.info("Conference started: {}", id);
        return conferenceMapper.toResponse(updated);
    }

    /**
     * End a conference.
     */
    @Transactional
    public ConferenceDto.Response endConference(UUID id, UUID userId, boolean isAdmin) {
        log.info("Ending conference: {}", id);

        Conference conference = conferenceRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Conference not found: " + id));

        // Check ownership for non-admin users
        if (!isAdmin && !conference.getCreatedBy().getId().equals(userId)) {
            throw new AccessDeniedException("Only the conference creator or administrators can perform this action");
        }

        if (conference.getStatus() != Conference.ConferenceStatus.ACTIVE) {
            throw new IllegalStateException("Conference is not active");
        }

        conference.end();
        Conference updated = conferenceRepository.save(conference);

        log.info("Conference ended: {}", id);
        return conferenceMapper.toResponse(updated);
    }

    /**
     * Soft delete conference.
     */
    @Transactional
    public void deleteConference(UUID id, UUID userId, boolean isAdmin) {
        log.info("Deleting conference: {}", id);

        Conference conference = conferenceRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Conference not found: " + id));

        // Check ownership for non-admin users
        if (!isAdmin && !conference.getCreatedBy().getId().equals(userId)) {
            throw new AccessDeniedException("Only the conference creator or administrators can perform this action");
        }

        conference.softDelete();
        conferenceRepository.save(conference);

        log.info("Conference soft deleted: {}", id);
    }

    /**
     * Process scheduled conference starts (called by scheduler).
     */
    @Transactional
    public void processScheduledStarts() {
        List<Conference> toStart = conferenceRepository.findConferencesToStart(Instant.now());
        for (Conference conference : toStart) {
            try {
                conference.start();
                conferenceRepository.save(conference);
                log.info("Auto-started conference: {}", conference.getId());
            } catch (Exception e) {
                log.error("Failed to auto-start conference: {}", conference.getId(), e);
            }
        }
    }

    /**
     * Process scheduled conference ends (called by scheduler).
     */
    @Transactional
    public void processScheduledEnds() {
        List<Conference> toEnd = conferenceRepository.findConferencesToEnd(Instant.now());
        for (Conference conference : toEnd) {
            try {
                conference.end();
                conferenceRepository.save(conference);
                log.info("Auto-ended conference: {}", conference.getId());
            } catch (Exception e) {
                log.error("Failed to auto-end conference: {}", conference.getId(), e);
            }
        }
    }
}
