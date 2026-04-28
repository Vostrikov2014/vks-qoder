package com.jmp.api.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.jmp.application.dto.ParticipantAssignmentDto;
import com.jmp.application.service.ParticipantAssignmentService;
import com.jmp.infrastructure.security.JwtAuthenticationFilter;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Participant assignment management controller.
 * Per specification §8.1
 */
@RestController
@RequestMapping("/api/v1/conferences/{conferenceId}/participants")
@RequiredArgsConstructor
@Slf4j
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Participant Assignments", description = "Manage participant assignments for conferences")
public class ParticipantAssignmentController {

    private final ParticipantAssignmentService assignmentService;

    @GetMapping
    @PreAuthorize("hasRole('MODERATOR') or hasRole('TENANT_ADMIN') or hasRole('SUPER_ADMIN')")
    @Operation(summary = "List all participant assignments for a conference")
    public ResponseEntity<List<ParticipantAssignmentDto.Response>> getAssignments(
            @PathVariable UUID conferenceId) {
        return ResponseEntity.ok(assignmentService.getAssignments(conferenceId));
    }

    @PostMapping
    @PreAuthorize("hasRole('MODERATOR') or hasRole('TENANT_ADMIN') or hasRole('SUPER_ADMIN')")
    @Operation(summary = "Assign a participant to a conference")
    public ResponseEntity<ParticipantAssignmentDto.Response> assignParticipant(
            @PathVariable UUID conferenceId,
            @Valid @RequestBody ParticipantAssignmentDto.CreateRequest request,
            Authentication authentication) {
        UUID actorId = extractUserId(authentication);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(assignmentService.assignParticipant(conferenceId, request, actorId));
    }

    @PostMapping("/bulk")
    @PreAuthorize("hasRole('MODERATOR') or hasRole('TENANT_ADMIN') or hasRole('SUPER_ADMIN')")
    @Operation(summary = "Bulk assign participants to a conference")
    public ResponseEntity<List<ParticipantAssignmentDto.Response>> bulkAssign(
            @PathVariable UUID conferenceId,
            @Valid @RequestBody ParticipantAssignmentDto.BulkCreateRequest request,
            Authentication authentication) {
        UUID actorId = extractUserId(authentication);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(assignmentService.bulkAssign(conferenceId, request, actorId));
    }

    @GetMapping("/{assignmentId}")
    @PreAuthorize("hasRole('MODERATOR') or hasRole('TENANT_ADMIN') or hasRole('SUPER_ADMIN')")
    @Operation(summary = "Get a specific participant assignment")
    public ResponseEntity<ParticipantAssignmentDto.Response> getAssignment(
            @PathVariable UUID conferenceId,
            @PathVariable UUID assignmentId) {
        return ResponseEntity.ok(assignmentService.getAssignment(conferenceId, assignmentId));
    }

    @PatchMapping("/{assignmentId}")
    @PreAuthorize("hasRole('MODERATOR') or hasRole('TENANT_ADMIN') or hasRole('SUPER_ADMIN')")
    @Operation(summary = "Update a participant assignment")
    public ResponseEntity<ParticipantAssignmentDto.Response> updateAssignment(
            @PathVariable UUID conferenceId,
            @PathVariable UUID assignmentId,
            @Valid @RequestBody ParticipantAssignmentDto.UpdateRequest request,
            Authentication authentication) {
        UUID actorId = extractUserId(authentication);
        return ResponseEntity.ok(assignmentService.updateAssignment(conferenceId, assignmentId, request, actorId));
    }

    @DeleteMapping("/{assignmentId}")
    @PreAuthorize("hasRole('MODERATOR') or hasRole('TENANT_ADMIN') or hasRole('SUPER_ADMIN')")
    @Operation(summary = "Remove a participant assignment")
    public ResponseEntity<Void> removeAssignment(
            @PathVariable UUID conferenceId,
            @PathVariable UUID assignmentId,
            Authentication authentication) {
        UUID actorId = extractUserId(authentication);
        assignmentService.removeAssignment(conferenceId, assignmentId, actorId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{assignmentId}/accept")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Accept a conference invitation")
    public ResponseEntity<ParticipantAssignmentDto.Response> acceptInvitation(
            @PathVariable UUID conferenceId,
            @PathVariable UUID assignmentId) {
        return ResponseEntity.ok(assignmentService.acceptInvitation(conferenceId, assignmentId));
    }

    @PostMapping("/{assignmentId}/decline")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Decline a conference invitation")
    public ResponseEntity<ParticipantAssignmentDto.Response> declineInvitation(
            @PathVariable UUID conferenceId,
            @PathVariable UUID assignmentId) {
        return ResponseEntity.ok(assignmentService.declineInvitation(conferenceId, assignmentId));
    }

    @PostMapping("/access-check")
    @Operation(summary = "Check if a user has access to a conference")
    public ResponseEntity<ParticipantAssignmentDto.AccessCheckResponse> checkAccess(
            @PathVariable UUID conferenceId,
            @RequestBody ParticipantAssignmentDto.AccessCheckRequest request) {
        return ResponseEntity.ok(assignmentService.checkAccess(conferenceId, request));
    }

    @GetMapping("/audit-log")
    @PreAuthorize("hasRole('TENANT_ADMIN') or hasRole('SUPER_ADMIN')")
    @Operation(summary = "View assignment audit log for a conference")
    public ResponseEntity<List<ParticipantAssignmentDto.AuditLogResponse>> getAuditLog(
            @PathVariable UUID conferenceId) {
        return ResponseEntity.ok(assignmentService.getAuditLog(conferenceId));
    }

    private UUID extractUserId(Authentication authentication) {
        if (authentication.getDetails() instanceof JwtAuthenticationFilter.WebAuthenticationDetails details) {
            return details.getUserId();
        }
        throw new IllegalStateException("Cannot extract user ID from authentication");
    }
}
