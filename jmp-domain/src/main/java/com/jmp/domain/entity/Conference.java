package com.jmp.domain.entity;

import java.time.Instant;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

/**
 * Conference entity representing a Jitsi video conference room.
 * Per specification §5.3, §6.3
 */
@Entity
@Table(name = "conferences", schema = "jmp")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
public class Conference {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @NotNull
    @Size(max = 100)
    @Column(name = "room_name", nullable = false, length = 100)
    private String roomName;

    @NotNull
    @Size(max = 255)
    @Column(name = "display_name", nullable = false, length = 255)
    private String displayName;

    @Size(max = 2000)
    @Column(name = "description", length = 2000)
    private String description;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ConferenceStatus status = ConferenceStatus.SCHEDULED;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 20)
    private ConferenceType type = ConferenceType.SCHEDULED;

    @Column(name = "scheduled_start_at")
    private Instant scheduledStartAt;

    @Column(name = "scheduled_end_at")
    private Instant scheduledEndAt;

    @Column(name = "actual_started_at")
    private Instant actualStartedAt;

    @Column(name = "actual_ended_at")
    private Instant actualEndedAt;

    @Column(name = "is_recurring")
    private Boolean isRecurring = false;

    @Size(max = 100)
    @Column(name = "recurrence_rule", length = 100)
    private String recurrenceRule; // iCal RRULE format

    @Column(name = "max_participants")
    private Integer maxParticipants;

    @Column(name = "require_password")
    private Boolean requirePassword = false;

    @Size(max = 100)
    @Column(name = "password_hash", length = 100)
    private String passwordHash;

    @Column(name = "enable_lobby")
    private Boolean enableLobby = false;

    @Column(name = "enable_recording")
    private Boolean enableRecording = false;

    @Column(name = "enable_live_streaming")
    private Boolean enableLiveStreaming = false;

    @Column(name = "enable_chat")
    private Boolean enableChat = true;

    @Column(name = "enable_screen_sharing")
    private Boolean enableScreenSharing = true;

    @Column(name = "mute_upon_entry")
    private Boolean muteUponEntry = false;

    @Column(name = "require_signed_in")
    private Boolean requireSignedIn = false;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "jitsi_options", columnDefinition = "jsonb")
    private Map<String, Object> jitsiOptions = new HashMap<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata", columnDefinition = "jsonb")
    private Map<String, Object> metadata = new HashMap<>();

    @Enumerated(EnumType.STRING)
    @Column(name = "access_policy", length = 50)
    private AccessPolicy accessPolicy = AccessPolicy.PUBLIC;

    @Size(max = 255)
    @Column(name = "allowed_domain", length = 255)
    private String allowedDomain;

    @Column(name = "waiting_room_enabled")
    private Boolean waitingRoomEnabled = false;

    @Column(name = "require_auth_for_assigned")
    private Boolean requireAuthForAssigned = true;

    @OneToMany(mappedBy = "conference", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<ConferenceParticipant> participants = new HashSet<>();

    @OneToMany(mappedBy = "conference", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<ParticipantAssignment> assignments = new HashSet<>();

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    /**
     * Start the conference (also used for restarting an ended conference).
     */
    public void start() {
        this.status = ConferenceStatus.ACTIVE;
        this.actualStartedAt = Instant.now();
        this.actualEndedAt = null;
    }

    /**
     * End the conference.
     */
    public void end() {
        this.status = ConferenceStatus.ENDED;
        this.actualEndedAt = Instant.now();
    }

    /**
     * Soft delete the conference.
     */
    public void softDelete() {
        this.deletedAt = Instant.now();
        this.status = ConferenceStatus.CANCELLED;
    }

    /**
     * Check if conference is currently active.
     */
    public boolean isActive() {
        return status == ConferenceStatus.ACTIVE;
    }

    /**
     * Check if conference is in the past.
     */
    public boolean isEnded() {
        return status == ConferenceStatus.ENDED || 
               status == ConferenceStatus.CANCELLED ||
               (scheduledEndAt != null && Instant.now().isAfter(scheduledEndAt));
    }

    /**
     * Add a participant assignment to this conference.
     */
    public void addAssignment(ParticipantAssignment assignment) {
        assignments.add(assignment);
        assignment.setConference(this);
    }

    /**
     * Remove a participant assignment from this conference.
     */
    public void removeAssignment(ParticipantAssignment assignment) {
        assignments.remove(assignment);
        assignment.setConference(null);
    }

    /**
     * Get current participant count.
     */
    public int getCurrentParticipantCount() {
        return (int) participants.stream()
            .filter(p -> p.getStatus() == ConferenceParticipant.ParticipantStatus.JOINED)
            .count();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Conference that = (Conference) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "Conference{" +
            "id=" + id +
            ", roomName='" + roomName + '\'' +
            ", displayName='" + displayName + '\'' +
            ", status=" + status +
            ", tenantId=" + (tenant != null ? tenant.getId() : null) +
            '}';
    }

    public enum ConferenceStatus {
        SCHEDULED,
        ACTIVE,
        ENDED,
        CANCELLED
    }

    /**
     * Type of conference.
     */
    public enum ConferenceType {
        SCHEDULED,    // Запланированная конференция с фиксированным временем
        PERMANENT     // Постоянная комната, доступная в любое время
    }
}
