package com.jmp.api.controller;

import com.jmp.application.dto.RecordingDto;
import com.jmp.application.service.RecordingService;
import com.jmp.infrastructure.security.JwtAuthenticationFilter;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.time.Duration;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Recording management controller.
 * Per specification §5.6, §16.1-16.10
 */
@RestController
@RequestMapping("/api/v1/recordings")
@RequiredArgsConstructor
@Slf4j
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Recordings", description = "Conference recording management endpoints")
public class RecordingController {

    private final RecordingService recordingService;

    @PostMapping
    @PreAuthorize("hasRole('MODERATOR') or hasRole('TENANT_ADMIN') or hasRole('SUPER_ADMIN')")
    @Operation(summary = "Create a recording entry")
    public ResponseEntity<RecordingDto.Response> createRecording(
            @Valid @RequestBody RecordingDto.CreateRequest request) {
        
        RecordingDto.Response recording = recordingService.createRecording(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(recording);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('PARTICIPANT') or hasRole('MODERATOR') or hasRole('TENANT_ADMIN') or hasRole('SUPER_ADMIN')")
    @Operation(summary = "Get recording by ID")
    public ResponseEntity<RecordingDto.Response> getRecording(@PathVariable UUID id) {
        return ResponseEntity.ok(recordingService.getRecording(id));
    }

    @GetMapping
    @PreAuthorize("hasRole('PARTICIPANT') or hasRole('MODERATOR') or hasRole('TENANT_ADMIN') or hasRole('SUPER_ADMIN')")
    @Operation(summary = "List recordings in tenant")
    public ResponseEntity<Page<RecordingDto.Summary>> listRecordings(
            Pageable pageable,
            @RequestParam(required = false) String search,
            Authentication authentication) {
        
        UUID tenantId = extractTenantId(authentication);
        
        Page<RecordingDto.Summary> recordings;
        if (search != null && !search.isBlank()) {
            recordings = recordingService.searchRecordings(tenantId, search, pageable);
        } else {
            recordings = recordingService.listRecordings(tenantId, pageable);
        }
        
        return ResponseEntity.ok(recordings);
    }

    @GetMapping("/conference/{conferenceId}")
    @PreAuthorize("hasRole('PARTICIPANT') or hasRole('MODERATOR') or hasRole('TENANT_ADMIN') or hasRole('SUPER_ADMIN')")
    @Operation(summary = "Get recordings for a conference")
    public ResponseEntity<List<RecordingDto.Summary>> getConferenceRecordings(
            @PathVariable UUID conferenceId) {
        
        return ResponseEntity.ok(recordingService.getConferenceRecordings(conferenceId));
    }

    @GetMapping("/{id}/download")
    @PreAuthorize("hasRole('PARTICIPANT') or hasRole('MODERATOR') or hasRole('TENANT_ADMIN') or hasRole('SUPER_ADMIN')")
    @Operation(summary = "Generate download URL for recording")
    public ResponseEntity<RecordingDto.DownloadUrlResponse> getDownloadUrl(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "60") int expirationMinutes) {
        
        RecordingDto.DownloadUrlResponse response = recordingService.generateDownloadUrl(
            id, 
            Duration.ofMinutes(expirationMinutes)
        );
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('MODERATOR') or hasRole('TENANT_ADMIN') or hasRole('SUPER_ADMIN')")
    @Operation(summary = "Update recording metadata")
    public ResponseEntity<RecordingDto.Response> updateRecording(
            @PathVariable UUID id,
            @Valid @RequestBody RecordingDto.UpdateRequest request) {
        
        return ResponseEntity.ok(recordingService.updateRecording(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('MODERATOR') or hasRole('TENANT_ADMIN') or hasRole('SUPER_ADMIN')")
    @Operation(summary = "Delete recording")
    public ResponseEntity<Void> deleteRecording(@PathVariable UUID id) {
        recordingService.deleteRecording(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/stats/storage")
    @PreAuthorize("hasRole('TENANT_ADMIN') or hasRole('SUPER_ADMIN')")
    @Operation(summary = "Get storage statistics")
    public ResponseEntity<RecordingDto.StorageStats> getStorageStats(Authentication authentication) {
        UUID tenantId = extractTenantId(authentication);
        return ResponseEntity.ok(recordingService.getStorageStats(tenantId));
    }

    private UUID extractTenantId(Authentication authentication) {
        if (authentication.getDetails() instanceof JwtAuthenticationFilter.WebAuthenticationDetails details) {
            return details.getTenantId();
        }
        throw new IllegalStateException("Cannot extract tenant ID from authentication");
    }
}
