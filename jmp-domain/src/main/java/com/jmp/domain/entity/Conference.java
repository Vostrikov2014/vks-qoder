package com.jmp.domain.entity;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.time.Instant;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Locale;
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

    /** Column length of {@code room_name}; a MUC node longer than this is unusable anyway. */
    public static final int MAX_ROOM_NAME_LENGTH = 100;

    /** Upper-case hex digits for percent-encoding, the shape encodeURIComponent produces. */
    private static final char[] PERCENT_ENCODING_HEX = "0123456789ABCDEF".toCharArray();

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
     * The room name is not a free-form label: it becomes the node of the XMPP MUC JID that
     * every participant joins, and the value of the {@code room} claim in the Jitsi token.
     * Prosody compares that claim lowercased with the JID node it received and rejects the
     * join on a mismatch, so the name has to be stored in exactly the shape the client will
     * put into the URL — lowercase, without spaces or characters that nodeprep eats.
     * Normalising in the setter keeps URL, token and MUC identical for everyone.
     */
    public void setRoomName(String roomName) {
        this.roomName = roomName == null ? null : normalizeRoomName(roomName);
    }

    /**
     * Bring a room name into the only form an XMPP MUC node accepts.
     *
     * <p>Lowercase, whitespace collapsed to a single dash, everything that is neither a
     * letter, a digit, {@code -} nor {@code _} dropped, truncated to the column length.
     * A name left without anything usable is returned as a trimmed lowercase original —
     * creating such a conference is rejected by the application layer, but rows already in
     * the database must stay loadable.
     */
    public static String normalizeRoomName(String value) {
        String normalized = value.trim().toLowerCase(Locale.ROOT).replaceAll("\\s+", "-");
        normalized = normalized.replaceAll("[^\\p{L}\\p{N}_-]", "");
        normalized = normalized.replaceAll("-{2,}", "-").replaceAll("^[-_]+|[-_]+$", "");
        if (normalized.length() > MAX_ROOM_NAME_LENGTH) {
            normalized = normalized.substring(0, MAX_ROOM_NAME_LENGTH);
        }
        return normalized.isEmpty() ? value.trim().toLowerCase(Locale.ROOT) : normalized;
    }

    /**
     * The room name in the shape the browser puts into the XMPP MUC JID: the
     * percent-encoded lowercase form of the normalized name, i.e. exactly what
     * {@code getBackendSafeRoomName} in {@code react/features/base/util/uri.ts} returns.
     *
     * <p>Prosody compares the {@code room} claim of the Jitsi token with the JID node the
     * client joined and rejects the conference on a mismatch ("Room does not match the room
     * from token"), and that JID node is the encoded form — so the token has to carry the
     * encoded form too, while the human-readable name stays in the URL path of the join link.
     */
    public static String backendSafeRoomName(String value) {
        if (value == null) {
            return null;
        }
        String decoded;
        try {
            // decodeURIComponent on the client side; a stray '%' cannot come from
            // normalizeRoomName, so an unparsable value is kept as is instead of failing.
            decoded = URLDecoder.decode(value, StandardCharsets.UTF_8);
        } catch (IllegalArgumentException e) {
            decoded = value;
        }
        String normalized = Normalizer.normalize(decoded, Normalizer.Form.NFKC)
            .toLowerCase(Locale.ROOT);

        // encodeURIComponent: UTF-8 bytes with the ECMAScript unreserved set kept literal.
        StringBuilder encoded = new StringBuilder(normalized.length() * 2);
        for (byte rawByte : normalized.getBytes(StandardCharsets.UTF_8)) {
            int b = rawByte & 0xFF;
            boolean unreserved = (b >= 'a' && b <= 'z') || (b >= 'A' && b <= 'Z')
                || (b >= '0' && b <= '9')
                || b == '-' || b == '_' || b == '.' || b == '!' || b == '~'
                || b == '*' || b == '\'' || b == '(' || b == ')';
            if (unreserved) {
                encoded.append((char) b);
            } else {
                encoded.append('%')
                    .append(PERCENT_ENCODING_HEX[b >> 4])
                    .append(PERCENT_ENCODING_HEX[b & 0x0F]);
            }
        }
        return encoded.toString().toLowerCase(Locale.ROOT);
    }

    /**
     * Whether the name can be used as an XMPP MUC node at all.
     */
    public static boolean isUsableRoomName(String value) {
        return value != null
            && !value.isEmpty()
            && value.length() <= MAX_ROOM_NAME_LENGTH
            && value.matches("[\\p{L}\\p{N}][\\p{L}\\p{N}_-]*");
    }

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
