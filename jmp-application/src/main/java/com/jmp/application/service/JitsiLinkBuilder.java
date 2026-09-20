package com.jmp.application.service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.jmp.domain.entity.Conference;

import lombok.extern.slf4j.Slf4j;

/**
 * Single place that knows how to build Jitsi and JMP addresses.
 *
 * <p>Absorbs three problems that were previously duplicated in the controllers: the
 * transport scheme was hard-coded to {@code http} even though the reverse proxy serves
 * TLS only (which leaked the JWT through a plaintext redirect), the room name was not
 * URL-encoded, and the configured domain value could contain a path prefix
 * ({@code a.slamx.ru/jitsi}) that has to be preserved.
 */
@Component
@Slf4j
public class JitsiLinkBuilder {

    /** SPA route that resolves a join link, see jmp-ui {@code JoinPage}. */
    public static final String JOIN_PATH = "/j/";

    /**
     * URL fragment disabling the Jitsi prejoin screen: «Начать»/ссылка ведёт сразу в
     * конференцию, без промежуточного экрана (важно и для машин без камеры/микрофона).
     * Значение — whitelisted config override, см. jitsi-meet
     * react/features/base/config/configWhitelist.ts.
     */
    private static final String SKIP_PREJOIN_HASH = "#config.prejoinConfig.enabled=false";

    /**
     * URL fragment for instant guest rooms: shows the prejoin screen explicitly and forces
     * a display name there — the token carries no name, so Jitsi itself prompts the guest
     * to enter one before joining. Both keys are whitelisted config overrides, см.
     * jitsi-meet react/features/base/config/configWhitelist.ts.
     */
    private static final String FORCE_PREJOIN_HASH =
        "#config.prejoinConfig.enabled=true&config.requireDisplayName=true";

    private static final String HTTP_PREFIX = "http://";
    private static final String HTTPS_PREFIX = "https://";

    private final String defaultDomain;
    private final String defaultScheme;
    private final String publicBaseUrl;

    public JitsiLinkBuilder(
            @Value("${jitsi.domain:}") String defaultDomain,
            @Value("${jitsi.scheme:https}") String defaultScheme,
            @Value("${jmp.public-url:}") String publicBaseUrl) {
        this.defaultDomain = defaultDomain;
        this.defaultScheme = defaultScheme.isBlank() ? "https" : defaultScheme.trim();
        this.publicBaseUrl = stripTrailingSlash(publicBaseUrl.trim());
        if (this.publicBaseUrl.isEmpty()) {
            log.warn("jmp.public-url is not configured — join links are handed out as relative paths");
        }
    }

    /**
     * Absolute base address of the Jitsi deployment serving a conference: the
     * tenant-specific domain wins, the {@code jitsi.domain} property is the fallback.
     *
     * @throws IllegalStateException when neither is configured
     */
    public String jitsiBaseUrl(Conference conference) {
        String tenantDomain = conference.getTenant().getJitsiDomain();
        return normalizeBase((tenantDomain == null || tenantDomain.isBlank())
            ? defaultDomain
            : tenantDomain);
    }

    /**
     * Absolute base address of the default Jitsi deployment, without a tenant in scope —
     * used by instant guest rooms, which have no {@code Conference} entity.
     *
     * @throws IllegalStateException when {@code jitsi.domain} is not configured
     */
    public String jitsiBaseUrl() {
        return normalizeBase(defaultDomain);
    }

    /**
     * @throws IllegalStateException when the configured value is blank
     */
    private String normalizeBase(String configured) {
        if (configured == null || configured.isBlank()) {
            throw new IllegalStateException("Jitsi domain not configured");
        }

        String value = configured.trim();
        // An explicit scheme in the configured value always wins over the default one.
        String scheme = defaultScheme;
        if (value.startsWith(HTTPS_PREFIX)) {
            scheme = "https";
            value = value.substring(HTTPS_PREFIX.length());
        } else if (value.startsWith(HTTP_PREFIX)) {
            scheme = "http";
            value = value.substring(HTTP_PREFIX.length());
        }

        return scheme + "://" + stripTrailingSlash(value);
    }

    /**
     * Full Jitsi address for a conference, including the short-lived JWT.
     *
     * @param jwt pre-signed Jitsi token; {@code null} to omit the token entirely
     */
    public String roomUrl(Conference conference, String jwt) {
        return buildRoomUrl(jitsiBaseUrl(conference), conference.getRoomName(), jwt, SKIP_PREJOIN_HASH);
    }

    /**
     * Full Jitsi address for a conference that keeps the prejoin screen enabled: instead
     * of entering immediately, the caller first sees Jitsi's name prompt (the display name
     * carried by the JWT is prefilled and can be edited) and only then joins. Mirrors the
     * «Создать встречу» flow.
     *
     * @param jwt pre-signed Jitsi token; {@code null} to omit the token entirely
     */
    public String roomUrlWithPrejoin(Conference conference, String jwt) {
        return buildRoomUrl(jitsiBaseUrl(conference), conference.getRoomName(), jwt, FORCE_PREJOIN_HASH);
    }

    /**
     * Full Jitsi address for a bare room name, including the short-lived JWT. Used by
     * instant guest rooms: they live only inside Jitsi and have no {@code Conference}.
     *
     * <p>Unlike a conference join link, the prejoin screen stays enabled here: the token
     * carries no display name on purpose, so Jitsi itself prompts the guest to enter one
     * and join the meeting.
     *
     * @param jwt pre-signed Jitsi token; {@code null} to omit the token entirely
     */
    public String roomUrl(String roomName, String jwt) {
        return buildRoomUrl(jitsiBaseUrl(), roomName, jwt, FORCE_PREJOIN_HASH);
    }

    private static String buildRoomUrl(String base, String roomName, String jwt, String configHash) {
        String url = base + "/" + encodePathSegment(roomName);
        if (jwt != null && !jwt.isBlank()) {
            url += "?jwt=" + jwt;
        }

        // The hash comes last: the JWT must stay in the query so parseJWTFromURLParams finds it.
        return url + configHash;
    }

    /**
     * Stable, shareable address of a join link. Unlike a Jitsi room URL it contains no
     * credential, so it can be stored, bookmarked and forwarded freely.
     *
     * <p>When {@code jmp.public-url} is not configured a root-relative path is returned,
     * which still works for users arriving through the same reverse proxy.
     */
    public String joinUrl(String slug) {
        return publicBaseUrl + JOIN_PATH + slug;
    }

    /**
     * Encode a room name for safe use as a single path segment.
     */
    private static String encodePathSegment(String segment) {
        // URLEncoder targets query strings: '+' must become the '%20' of path syntax.
        return URLEncoder.encode(segment, StandardCharsets.UTF_8).replace("+", "%20");
    }

    private static String stripTrailingSlash(String value) {
        String result = value;
        while (result.endsWith("/")) {
            result = result.substring(0, result.length() - 1);
        }
        return result;
    }
}
