package com.jmp.domain.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

/**
 * Audit log entity for tracking participant assignment events.
 * Per specification §8.1
 */
@Entity
@Table(name = "assignment_audit_log", schema = "jmp")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
public class AssignmentAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @NotNull
    @Column(name = "conference_id", nullable = false)
    private UUID conferenceId;

    @NotNull
    @Column(name = "actor_id", nullable = false)
    private UUID actorId;

    @NotNull
    @Size(max = 100)
    @Column(name = "action", nullable = false, length = 100)
    private String action;

    @Column(name = "target_user_id")
    private UUID targetUserId;

    @Size(max = 255)
    @Column(name = "target_email", length = 255)
    private String targetEmail;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata", columnDefinition = "jsonb")
    private Object metadata;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        AssignmentAuditLog that = (AssignmentAuditLog) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "AssignmentAuditLog{" +
            "id=" + id +
            ", conferenceId=" + conferenceId +
            ", actorId=" + actorId +
            ", action='" + action + '\'' +
            ", createdAt=" + createdAt +
            '}';
    }
}
