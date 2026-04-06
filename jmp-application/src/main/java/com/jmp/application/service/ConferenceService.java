package com.jmp.application.service;

import com.jmp.application.dto.ConferenceDto;
import com.jmp.application.mapper.ConferenceMapper;
import com.jmp.domain.entity.Conference;
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
     * List conferences by tenant with pagination.
     */
    public Page<ConferenceDto.Summary> listConferences(UUID tenantId, Pageable pageable) {
        return conferenceRepository.findByTenantIdAndDeletedAtIsNull(tenantId, pageable)
            .map(conferenceMapper::toSummary);
    }

    /**
     * Search conferences within a tenant.
     */
    public Page<ConferenceDto.Summary> searchConferences(UUID tenantId, String search, Pageable pageable) {
        return conferenceRepository.searchByTenantId(tenantId, search, pageable)
            .map(conferenceMapper::toSummary);
    }

    /**
     * Get active conferences for a tenant.
     */
    public List<ConferenceDto.Summary> getActiveConferences(UUID tenantId) {
        return conferenceRepository.findActiveByTenantId(tenantId).stream()
            .map(conferenceMapper::toSummary)
            .toList();
    }

    /**
     * Get upcoming conferences for a tenant.
     */
    public List<ConferenceDto.Summary> getUpcomingConferences(UUID tenantId) {
        return conferenceRepository.findUpcomingByTenantId(tenantId, Instant.now()).stream()
            .map(conferenceMapper::toSummary)
            .toList();
    }

    /**
     * Update conference.
     */
    @Transactional
    public ConferenceDto.Response updateConference(UUID id, ConferenceDto.UpdateRequest request) {
        log.info("Updating conference: {}", id);

        Conference conference = conferenceRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Conference not found: " + id));

        // Only allow updates for scheduled conferences
        if (conference.getStatus() == Conference.ConferenceStatus.ENDED ||
            conference.getStatus() == Conference.ConferenceStatus.CANCELLED) {
            throw new IllegalStateException("Cannot update ended or cancelled conference");
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
    public ConferenceDto.Response startConference(UUID id) {
        log.info("Starting conference: {}", id);

        Conference conference = conferenceRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Conference not found: " + id));

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
    public ConferenceDto.Response endConference(UUID id) {
        log.info("Ending conference: {}", id);

        Conference conference = conferenceRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Conference not found: " + id));

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
    public void deleteConference(UUID id) {
        log.info("Deleting conference: {}", id);

        Conference conference = conferenceRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Conference not found: " + id));

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
