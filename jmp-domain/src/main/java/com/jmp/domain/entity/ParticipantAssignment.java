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
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

/**
 * ParticipantAssignment entity representing a pre-assigned participant for a conference.
 * Per specification §8.1
 */
@Entity
@Table(name = "participant_assignments", schema = "jmp")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
public class ParticipantAssignment {

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

    @NotNull
    @Size(max = 255)
    @Column(name = "email", nullable = false, length = 255)
    private String email;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 50)
    private AssignmentRole role = AssignmentRole.PARTICIPANT;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private AssignmentStatus status = AssignmentStatus.INVITED;

    @Column(name = "require_auth")
    private Boolean requireAuth = true;

    @Column(name = "invited_at")
    private Instant invitedAt;

    @Column(name = "responded_at")
    private Instant respondedAt;

    @Column(name = "joined_at")
    private Instant joinedAt;

    @Column(name = "left_at")
    private Instant leftAt;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /**
     * Accept the assignment invitation.
     */
    public void accept() {
        this.status = AssignmentStatus.ACCEPTED;
        this.respondedAt = Instant.now();
    }

    /**
     * Decline the assignment invitation.
     */
    public void decline() {
        this.status = AssignmentStatus.DECLINED;
        this.respondedAt = Instant.now();
    }

    /**
     * Mark assignment as joined.
     */
    public void markJoined() {
        this.status = AssignmentStatus.JOINED;
        this.joinedAt = Instant.now();
    }

    /**
     * Mark assignment as left.
     */
    public void markLeft() {
        this.leftAt = Instant.now();
    }

    /**
     * Remove the assignment.
     */
    public void remove() {
        this.status = AssignmentStatus.REMOVED;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ParticipantAssignment that = (ParticipantAssignment) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "ParticipantAssignment{" +
            "id=" + id +
            ", email='" + email + '\'' +
            ", role=" + role +
            ", status=" + status +
            '}';
    }

    public enum AssignmentRole {
        PARTICIPANT,
        MODERATOR,
        PRESENTER
    }

    public enum AssignmentStatus {
        INVITED,
        ACCEPTED,
        DECLINED,
        JOINED,
        REMOVED
    }
}
