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
 * rights — the room name is generated here, never taken from the request, so this cannot
 * be abused to gain rights in somebody else's room.
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
        String roomUrl = linkBuilder.roomUrl(roomName, token);

        log.info("Instant guest room {} opened for '{}'", roomName, displayName);

        return ConferenceLinkDto.JoinResponse.redirect(
            roomUrl,
            jwtService.jitsiTokenExpiration(),
            REASON_INSTANT_MEETING,
            displayName,
            roomName);
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
