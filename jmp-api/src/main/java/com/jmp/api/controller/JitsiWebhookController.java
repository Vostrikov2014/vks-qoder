package com.jmp.api.controller;

import com.jmp.application.service.ConferenceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

import java.time.Instant;
import java.util.Map;
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
        log.info("Conference created: {} in tenant: {}", 
            event.roomName(), event.tenantId());
        // Update conference status if tracked
    }

    private void handleConferenceEnded(JitsiWebhookEvent event) {
        log.info("Conference ended: {} in tenant: {}", 
            event.roomName(), event.tenantId());
        // Update conference status
    }

    private void handleParticipantJoined(JitsiWebhookEvent event) {
        log.info("Participant joined: {} to room: {}", 
            event.participant() != null ? event.participant().get("id") : "unknown",
            event.roomName());
        // Update participant count, audit log
    }

    private void handleParticipantLeft(JitsiWebhookEvent event) {
        log.info("Participant left: {} from room: {}", 
            event.participant() != null ? event.participant().get("id") : "unknown",
            event.roomName());
        // Update participant count
    }

    private void handleRecordingStatusChanged(JitsiWebhookEvent event) {
        log.info("Recording status changed for room: {} - status: {}", 
            event.roomName(), 
            event.data() != null ? event.data().get("status") : "unknown");
        // Handle recording lifecycle
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
