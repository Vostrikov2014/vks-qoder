package com.jmp.application.service;

import java.security.SecureRandom;

import org.springframework.stereotype.Service;

import com.jmp.application.dto.ConferenceLinkDto;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Instant guest rooms — a room that exists only inside Jitsi.
 *
 * <p>The landing page «Создать встречу» needs to open a video call for a person without
 * an account. Prosody runs with {@code AUTH_TYPE=jwt} and guests disabled, so an
 * anonymous entry is impossible: the address has to carry a server-signed token. That is
 * what this service mints — and, unlike a conference join link, there is no
 * {@code Conference} row behind it: the platform neither creates nor stores anything,
 * the room disappears from Jitsi as soon as the last participant leaves.
 *
 * <p>Because there is no conference owner to appoint, the creator is given moderator
 * rights — the room name is invented here, never taken from the request, so opening a
 * room cannot be abused to gain rights in somebody else's room. A guest re-entering an
 * existing room by its name (see {@link #resolveRoomJoin}) is deliberately never a
 * moderator: the name is a credential for entry only.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class InstantMeetingService {

    /** The platform prefix keeps instant rooms recognisable in Jitsi logs. */
    private static final String ROOM_PREFIX = "vks-";

    /** Lower-case alphanumerics only: the name is used as a URL path segment as is. */
    private static final String ROOM_ID_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";

    /** 36^8 ≈ 2.8 · 10^12 combinations — guessing a currently live room is impractical. */
    private static final int ROOM_ID_LENGTH = 8;

    private static final int MAX_DISPLAY_NAME_LENGTH = 100;

    /** Reported to the front-end so this response is distinguishable from a join link. */
    private static final String REASON_INSTANT_MEETING = "instant_meeting";

    /** Not final on purpose: Lombok keeps initialized fields out of the constructor. */
    private final SecureRandom random = new SecureRandom();

    private final JwtService jwtService;
    private final JitsiLinkBuilder linkBuilder;

    /**
     * Invents a room name nobody else is using and hands back its address, signed and
     * ready to open. The display name stays out of the token by default: the room opens
     * on the Jitsi prejoin screen, which prompts the guest for a name and joins only
     * after that — so no name is requested on the landing page anymore.
     *
     * @param requestedDisplayName optional override; blank or absent leave the name to Jitsi
     */
    public ConferenceLinkDto.JoinResponse createInstantMeeting(String requestedDisplayName) {
        String roomName = ROOM_PREFIX + randomRoomId();
        String displayName = normalizeDisplayName(requestedDisplayName);

        String token = jwtService.generateInstantGuestToken(roomName, displayName, true);
        String roomUrl = linkBuilder.withShareUrl(
            linkBuilder.roomUrl(roomName, token), linkBuilder.joinUrl(roomName));

        log.info("Instant guest room {} opened for '{}'", roomName, displayName);

        return ConferenceLinkDto.JoinResponse.redirect(
            roomUrl,
            jwtService.jitsiTokenExpiration(),
            REASON_INSTANT_MEETING,
            displayName,
            roomName);
    }

    /**
     * Re-opens an existing instant room for a visitor: the room name itself is the
     * password (36^8 ≈ 2.8 · 10^12 combinations), so its address can be forwarded
     * freely, and every visit mints a fresh short-lived token — nothing is stored
     * server-side.
     *
     * <p>The visitor is never a moderator: moderation belongs to whoever created the
     * room first, a guest only needs to get in.
     *
     * @param roomName             room name taken from the shared address
     * @param requestedDisplayName optional name the guest wants to appear with; absent
     *                             leaves the prompt to the Jitsi prejoin screen
     */
    public ConferenceLinkDto.JoinResponse resolveRoomJoin(String roomName, String requestedDisplayName) {
        if (!isWellFormedRoomName(roomName)) {
            log.info("Rejected instant room join: '{}' is not a generated room name", roomName);
            return ConferenceLinkDto.JoinResponse.of(
                ConferenceLinkDto.Decision.NOT_FOUND, "link_not_found", null);
        }

        String displayName = normalizeDisplayName(requestedDisplayName);
        String token = jwtService.generateInstantGuestToken(roomName, displayName, false);
        String roomUrl = linkBuilder.withShareUrl(
            linkBuilder.roomUrl(roomName, token), linkBuilder.joinUrl(roomName));

        log.info("Issued a guest token for instant room {} (display name: {})", roomName, displayName);

        return ConferenceLinkDto.JoinResponse.redirect(
            roomUrl,
            jwtService.jitsiTokenExpiration(),
            REASON_INSTANT_MEETING,
            displayName,
            roomName);
    }

    /**
     * Room names are generated by {@link #randomRoomId()} only, so nothing but that
     * exact shape may ever be resolved — a scheduled conference room or an arbitrary
     * string never gets a token here.
     */
    private static boolean isWellFormedRoomName(String roomName) {
        if (roomName == null || !roomName.startsWith(ROOM_PREFIX)) {
            return false;
        }
        String id = roomName.substring(ROOM_PREFIX.length());
        if (id.length() != ROOM_ID_LENGTH) {
            return false;
        }
        for (int i = 0; i < id.length(); i++) {
            if (ROOM_ID_ALPHABET.indexOf(id.charAt(i)) < 0) {
                return false;
            }
        }
        return true;
    }

    private String randomRoomId() {
        StringBuilder id = new StringBuilder(ROOM_ID_LENGTH);
        for (int i = 0; i < ROOM_ID_LENGTH; i++) {
            id.append(ROOM_ID_ALPHABET.charAt(random.nextInt(ROOM_ID_ALPHABET.length())));
        }
        return id.toString();
    }

    /** {@code null} when no name was requested: the token then omits it and Jitsi asks. */
    private static String normalizeDisplayName(String requestedDisplayName) {
        if (requestedDisplayName == null || requestedDisplayName.isBlank()) {
            return null;
        }
        String trimmed = requestedDisplayName.trim();
        return trimmed.length() > MAX_DISPLAY_NAME_LENGTH
            ? trimmed.substring(0, MAX_DISPLAY_NAME_LENGTH)
            : trimmed;
    }
}
