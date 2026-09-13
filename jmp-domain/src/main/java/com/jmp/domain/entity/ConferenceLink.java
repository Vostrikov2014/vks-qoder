package com.jmp.domain.entity;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Objects;
import java.util.UUID;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

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
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

/**
 * Permanent, revocable join link for a conference.
 *
 * <p>The link is the piece of information that is actually shared with participants:
 * its public address is {@code <jmp public url>/j/<slug>}. The slug is the only secret
 * the address carries, so the link never expires together with a Jitsi token and can be
 * revoked at any moment. The short-lived Jitsi JWT is minted separately, per click, when
 * the link is resolved in {@code JoinController}.
 */
@Entity
@Table(name = "conference_links", schema = "jmp")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
public class ConferenceLink {

    /** Length of the URL-safe slug: 128 random bits base64url-encoded, no padding. */
    private static final int SLUG_BYTES = 16;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conference_id", nullable = false)
    private Conference conference;

    /**
     * Unguessable, URL-safe identifier embedded in the shared address. Unique across
     * the whole platform, which is what makes it safe to look a link up without a
     * tenant qualifier.
     */
    @NotNull
    @Size(max = 32)
    @Column(name = "slug", nullable = false, unique = true, length = 32, updatable = false)
    private String slug;

    /** Human-readable purpose of the link, e.g. "For partners". Optional. */
    @Size(max = 100)
    @Column(name = "label", length = 100)
    private String label;

    /**
     * Jitsi role granted to everyone opening this link. Decided on the server, never
     * taken from the client that requests a token.
     */
    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    private LinkRole role = LinkRole.PARTICIPANT;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    /** Optional expiry of the link itself; {@code null} means it never expires. */
    @Column(name = "expires_at")
    private Instant expiresAt;

    @Column(name = "revoked_at")
    private Instant revokedAt;

    @Column(name = "visit_count", nullable = false)
    private Integer visitCount = 0;

    @Column(name = "last_visited_at")
    private Instant lastVisitedAt;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /**
     * Create a link for a conference. The slug is generated here so that no caller can
     * supply a guessable one.
     *
     * @param conference conference the link points to
     * @param createdBy  user that created the link
     * @param role       Jitsi role granted to participants arriving through the link
     * @param label      optional description of the link
     * @param expiresAt  optional moment the link stops working, {@code null} for never
     */
    public static ConferenceLink create(Conference conference, User createdBy, LinkRole role,
                                        String label, Instant expiresAt) {
        ConferenceLink link = new ConferenceLink();
        link.setConference(conference);
        link.setCreatedBy(createdBy);
        link.setRole(role);
        link.setLabel(label);
        link.setExpiresAt(expiresAt);
        link.setSlug(generateSlug());
        return link;
    }

    /**
     * Whether the link can currently be resolved. A link that was revoked, expired or
     * whose conference was deleted no longer works.
     */
    public boolean isActive() {
        if (revokedAt != null) {
            return false;
        }
        if (expiresAt != null && Instant.now().isAfter(expiresAt)) {
            return false;
        }
        return conference.getDeletedAt() == null;
    }

    /**
     * Revoke the link so that the shared address stops working immediately.
     */
    public void revoke() {
        this.revokedAt = Instant.now();
    }

    /**
     * Record a successful resolution of the link.
     */
    public void registerVisit() {
        this.visitCount = (visitCount == null ? 0 : visitCount) + 1;
        this.lastVisitedAt = Instant.now();
    }

    /**
     * Generate a URL-safe slug from cryptographically strong randomness.
     */
    private static String generateSlug() {
        byte[] bytes = new byte[SLUG_BYTES];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ConferenceLink that = (ConferenceLink) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "ConferenceLink{" +
            "id=" + id +
            ", slug='" + slug + '\'' +
            ", role=" + role +
            ", conferenceId=" + (conference != null ? conference.getId() : null) +
            '}';
    }

    /**
     * Role a visitor arriving through this link receives inside Jitsi.
     */
    public enum LinkRole {
        PARTICIPANT,
        MODERATOR
    }
}
