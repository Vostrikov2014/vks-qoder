package com.jmp.infrastructure.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Service for sending real-time events via WebSocket.
 * Per specification §17.7
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RealtimeEventService {

    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;

    /**
     * Send event to all users in a tenant.
     */
    public void sendToTenant(UUID tenantId, String eventType, Object payload) {
        String destination = "/topic/tenant/" + tenantId + "/" + eventType;
        sendEvent(destination, eventType, payload);
    }

    /**
     * Send event to specific user.
     */
    public void sendToUser(UUID userId, String eventType, Object payload) {
        String destination = "/user/" + userId + "/queue/events";
        sendEvent(destination, eventType, payload);
    }

    /**
     * Send conference status update.
     */
    public void sendConferenceStatus(UUID conferenceId, UUID tenantId, String status, Object details) {
        ConferenceStatusEvent event = new ConferenceStatusEvent(
            conferenceId,
            status,
            details,
            Instant.now()
        );
        sendToTenant(tenantId, "conference/" + conferenceId + "/status", event);
    }

    /**
     * Send recording status update.
     */
    public void sendRecordingStatus(UUID recordingId, UUID tenantId, String status, Object details) {
        RecordingStatusEvent event = new RecordingStatusEvent(
            recordingId,
            status,
            details,
            Instant.now()
        );
        sendToTenant(tenantId, "recording/" + recordingId + "/status", event);
    }

    /**
     * Send system notification to tenant admins.
     */
    public void sendSystemNotification(UUID tenantId, String level, String message, Object details) {
        SystemNotificationEvent event = new SystemNotificationEvent(
            level,
            message,
            details,
            Instant.now()
        );
        sendToTenant(tenantId, "notifications/system", event);
    }

    /**
     * Send broadcast to all connected clients.
     */
    public void broadcast(String eventType, Object payload) {
        String destination = "/topic/broadcast/" + eventType;
        sendEvent(destination, eventType, payload);
    }

    private void sendEvent(String destination, String eventType, Object payload) {
        try {
            WebSocketEvent event = new WebSocketEvent(
                eventType,
                payload,
                Instant.now()
            );
            
            messagingTemplate.convertAndSend(destination, event);
            log.debug("Sent WebSocket event to {}: {}", destination, eventType);
        } catch (Exception e) {
            log.error("Failed to send WebSocket event to {}", destination, e);
        }
    }

    /**
     * Generic WebSocket event wrapper.
     */
    public record WebSocketEvent(
        String type,
        Object payload,
        Instant timestamp
    ) {}

    /**
     * Conference status event.
     */
    public record ConferenceStatusEvent(
        UUID conferenceId,
        String status,
        Object details,
        Instant timestamp
    ) {}

    /**
     * Recording status event.
     */
    public record RecordingStatusEvent(
        UUID recordingId,
        String status,
        Object details,
        Instant timestamp
    ) {}

    /**
     * System notification event.
     */
    public record SystemNotificationEvent(
        String level,
        String message,
        Object details,
        Instant timestamp
    ) {}
}
