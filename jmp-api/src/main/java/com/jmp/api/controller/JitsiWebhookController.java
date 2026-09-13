package com.jmp.api.controller;

import com.jmp.application.service.ConferenceService;
import com.jmp.application.service.RecordingService;
import com.jmp.domain.entity.Conference;
import com.jmp.domain.entity.ConferenceParticipant;
import com.jmp.domain.entity.Recording;
import com.jmp.domain.repository.ConferenceParticipantRepository;
import com.jmp.domain.repository.ConferenceRepository;
import com.jmp.domain.repository.RecordingRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller for receiving Jitsi webhook events.
 * Per specification §5.5, §7.3
 */
@RestController
@RequestMapping("/api/v1/webhooks/jitsi")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Jitsi Webhooks", description = "Webhook endpoints for Jitsi events")
public class JitsiWebhookController {

    private final ConferenceService conferenceService;
    private final ConferenceRepository conferenceRepository;
    private final ConferenceParticipantRepository participantRepository;
    private final RecordingRepository recordingRepository;
    private final RecordingService recordingService;

    @PostMapping
    @Operation(summary = "Receive Jitsi webhook events")
    public ResponseEntity<Void> receiveWebhook(
            @RequestHeader(value = "X-Jitsi-Signature", required = false) String signature,
            @Valid @RequestBody JitsiWebhookEvent event) {
        
        log.info("Received Jitsi webhook event: {} for room: {}", 
            event.eventType(), event.roomName());

        // Verify signature if configured (per specification §7.3)
        if (signature != null && !verifySignature(signature, event)) {
            log.warn("Invalid webhook signature");
            return ResponseEntity.status(401).build();
        }

        // Process event based on type
        processEvent(event);

        return ResponseEntity.ok().build();
    }

    private void processEvent(JitsiWebhookEvent event) {
        switch (event.eventType()) {
            case "CONFERENCE_CREATED" -> handleConferenceCreated(event);
            case "CONFERENCE_ENDED" -> handleConferenceEnded(event);
            case "PARTICIPANT_JOINED" -> handleParticipantJoined(event);
            case "PARTICIPANT_LEFT" -> handleParticipantLeft(event);
            case "RECORDING_STATUS_CHANGED" -> handleRecordingStatusChanged(event);
            case "STREAMING_STATUS_CHANGED" -> handleStreamingStatusChanged(event);
            default -> log.warn("Unknown event type: {}", event.eventType());
        }
    }

    private void handleConferenceCreated(JitsiWebhookEvent event) {
        log.info("Conference created in Jitsi: {} in tenant: {}", 
            event.roomName(), event.tenantId());
        // Conference status is managed by our own service, no action needed
    }

    private void handleConferenceEnded(JitsiWebhookEvent event) {
        log.info("Conference ended in Jitsi: {} in tenant: {}", 
            event.roomName(), event.tenantId());
        
        if (event.tenantId() == null) {
            log.warn("Cannot process CONFERENCE_ENDED without tenantId");
            return;
        }
        
        UUID tenantId = UUID.fromString(event.tenantId());
        Conference conference = conferenceService.findByRoomNameAndTenantId(event.roomName(), tenantId);
        
        if (conference == null) {
            log.warn("Conference not found for roomName: {} and tenantId: {}", event.roomName(), tenantId);
            return;
        }
        
        if (conference.getStatus() == Conference.ConferenceStatus.ACTIVE) {
            conference.end();
            conferenceRepository.save(conference);
            log.info("Conference {} ended via Jitsi webhook", conference.getId());
        }
    }

    private void handleParticipantJoined(JitsiWebhookEvent event) {
        String participantId = event.participant() != null ? event.participant().get("id") : null;
        log.info("Participant joined: {} to room: {}", participantId, event.roomName());
        
        if (participantId == null || event.tenantId() == null) {
            log.warn("Cannot process PARTICIPANT_JOINED without participant id or tenantId");
            return;
        }
        
        UUID tenantId = UUID.fromString(event.tenantId());
        Conference conference = conferenceService.findByRoomNameAndTenantId(event.roomName(), tenantId);
        
        if (conference == null) {
            log.warn("Conference not found for roomName: {} and tenantId: {}", event.roomName(), tenantId);
            return;
        }
        
        // Check if participant already exists
        participantRepository.findByConferenceIdAndExternalId(conference.getId(), participantId)
            .ifPresentOrElse(
                existing -> {
                    if (existing.getStatus() != ConferenceParticipant.ParticipantStatus.JOINED) {
                        existing.markJoined();
                        participantRepository.save(existing);
                    }
                },
                () -> {
                    ConferenceParticipant participant = new ConferenceParticipant();
                    participant.setConference(conference);
                    participant.setExternalId(participantId);
                    participant.setDisplayName(event.participant().getOrDefault("name", "Unknown"));
                    participant.setRole(ConferenceParticipant.ParticipantRole.PARTICIPANT);
                    participant.markJoined();
                    participantRepository.save(participant);
                }
            );
    }

    private void handleParticipantLeft(JitsiWebhookEvent event) {
        String participantId = event.participant() != null ? event.participant().get("id") : null;
        log.info("Participant left: {} from room: {}", participantId, event.roomName());
        
        if (participantId == null || event.tenantId() == null) {
            log.warn("Cannot process PARTICIPANT_LEFT without participant id or tenantId");
            return;
        }
        
        UUID tenantId = UUID.fromString(event.tenantId());
        Conference conference = conferenceService.findByRoomNameAndTenantId(event.roomName(), tenantId);
        
        if (conference == null) {
            log.warn("Conference not found for roomName: {} and tenantId: {}", event.roomName(), tenantId);
            return;
        }
        
        participantRepository.findByConferenceIdAndExternalId(conference.getId(), participantId)
            .ifPresent(participant -> {
                if (participant.getStatus() == ConferenceParticipant.ParticipantStatus.JOINED) {
                    participant.markLeft();
                    participantRepository.save(participant);
                }
            });
    }

    private void handleRecordingStatusChanged(JitsiWebhookEvent event) {
        String status = event.data() != null ? String.valueOf(event.data().get("status")) : "unknown";
        log.info("Recording status changed for room: {} - status: {}", event.roomName(), status);
        
        if (event.tenantId() == null) {
            log.warn("Cannot process RECORDING_STATUS_CHANGED without tenantId");
            return;
        }
        
        UUID tenantId = UUID.fromString(event.tenantId());
        Conference conference = conferenceService.findByRoomNameAndTenantId(event.roomName(), tenantId);
        
        if (conference == null) {
            log.warn("Conference not found for roomName: {} and tenantId: {}", event.roomName(), tenantId);
            return;
        }
        
        // Find recordings for this conference in PROCESSING state
        List<Recording> recordings = recordingRepository.findByConferenceIdAndDeletedAtIsNull(conference.getId());
        for (Recording recording : recordings) {
            if (recording.getStatus() == Recording.RecordingStatus.PROCESSING 
                    && "READY".equalsIgnoreCase(status)) {
                recording.markReady();
                recordingRepository.save(recording);
                log.info("Recording {} marked as READY via webhook", recording.getId());
            } else if (recording.getStatus() == Recording.RecordingStatus.PENDING 
                    && "ON".equalsIgnoreCase(status)) {
                recording.setStatus(Recording.RecordingStatus.PROCESSING);
                recordingRepository.save(recording);
                log.info("Recording {} set to PROCESSING via webhook", recording.getId());
            }
        }
    }

    private void handleStreamingStatusChanged(JitsiWebhookEvent event) {
        log.info("Streaming status changed for room: {}", event.roomName());
        // Handle streaming status
    }

    private boolean verifySignature(String signature, JitsiWebhookEvent event) {
        // Per specification §7.3: HMAC/Token signature verification
        // Implementation would verify HMAC-SHA256 signature
        // For now, accept all webhooks in development
        return true;
    }

    /**
     * Jitsi webhook event structure.
     * Per specification §21.4
     */
    public record JitsiWebhookEvent(
        @NotBlank String eventType,
        @NotBlank String roomName,
        String tenantId,
        String conferenceId,
        Instant timestamp,
        Map<String, String> participant,
        Map<String, Object> data
    ) {}
}
