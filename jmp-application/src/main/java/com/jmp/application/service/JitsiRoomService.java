package com.jmp.application.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

/**
 * Service for managing Jitsi rooms via the Jitsi admin API.
 */
@Service
@Slf4j
public class JitsiRoomService {

    private final RestTemplate restTemplate;
    private final String jitsiAdminUrl;
    private final String jitsiAdminSecret;

    public JitsiRoomService(
            @Value("${jitsi.admin-url:http://localhost:8080}") String jitsiAdminUrl,
            @Value("${jitsi.admin-secret:}") String jitsiAdminSecret) {
        this.restTemplate = new RestTemplate();
        this.jitsiAdminUrl = jitsiAdminUrl;
        this.jitsiAdminSecret = jitsiAdminSecret;
    }

    /**
     * Destroy a Jitsi room to kick all participants and close the conference.
     *
     * @param roomName the name of the room to destroy
     */
    public void destroyRoom(String roomName) {
        if (jitsiAdminUrl == null || jitsiAdminUrl.isBlank()) {
            log.warn("Jitsi admin URL not configured, skipping room destroy for: {}", roomName);
            return;
        }

        try {
            String url = String.format("%s/room/%s/destroy", jitsiAdminUrl, roomName);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            if (jitsiAdminSecret != null && !jitsiAdminSecret.isBlank()) {
                headers.set("Authorization", "Bearer " + jitsiAdminSecret);
            }

            HttpEntity<String> entity = new HttpEntity<>(headers);
            restTemplate.exchange(url, HttpMethod.POST, entity, String.class);

            log.info("Successfully destroyed Jitsi room: {}", roomName);
        } catch (RestClientException e) {
            log.error("Failed to destroy Jitsi room: {}. Error: {}", roomName, e.getMessage());
            // Don't rethrow — the conference is already ended in the database
        }
    }
}
