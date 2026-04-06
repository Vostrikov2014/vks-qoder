package com.jmp.domain.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

/**
 * ConferenceParticipant entity tracking participants in a conference.
 * Per specification §5.3, §7.2
 */
@Entity
@Table(name = "conference_participants", schema = "jmp")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
public class ConferenceParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conference_id", nullable = false)
    private Conference conference;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user; // null for external/guest participants

    @Size(max = 255)
    @Column(name = "display_name", length = 255)
    private String displayName;

    @Size(max = 255)
    @Column(name = "email", length = 255)
    private String email;

    @Size(max = 100)
    @Column(name = "external_id", length = 100)
    private String externalId; // Jitsi participant ID

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    private ParticipantRole role = ParticipantRole.PARTICIPANT;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ParticipantStatus status = ParticipantStatus.INVITED;

    @Column(name = "joined_at")
    private Instant joinedAt;

    @Column(name = "left_at")
    private Instant leftAt;

    @Column(name = "is_moderator")
    private Boolean isModerator = false;

    @Column(name = "is_recorder")
    private Boolean isRecorder = false;

    @Column(name = "is_silent")
    private Boolean isSilent = false;

    @Size(max = 45)
    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Size(max = 500)
    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    /**
     * Mark participant as joined.
     */
    public void markJoined() {
        this.status = ParticipantStatus.JOINED;
        this.joinedAt = Instant.now();
    }

    /**
     * Mark participant as left.
     */
    public void markLeft() {
        this.status = ParticipantStatus.LEFT;
        this.leftAt = Instant.now();
    }

    /**
     * Check if participant is currently in the conference.
     */
    public boolean isActive() {
        return status == ParticipantStatus.JOINED;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ConferenceParticipant that = (ConferenceParticipant) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "ConferenceParticipant{" +
            "id=" + id +
            ", displayName='" + displayName + '\'' +
            ", role=" + role +
            ", status=" + status +
            '}';
    }

    public enum ParticipantRole {
        HOST,
        MODERATOR,
        PARTICIPANT,
        GUEST,
        RECORDER
    }

    public enum ParticipantStatus {
        INVITED,
        JOINED,
        LEFT,
        KICKED,
        DECLINED
    }
}
