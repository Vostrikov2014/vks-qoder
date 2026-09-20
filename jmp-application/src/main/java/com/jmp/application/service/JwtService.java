package com.jmp.application.service;

import com.jmp.domain.entity.Conference;
import com.jmp.domain.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import javax.crypto.SecretKey;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Service for JWT token generation and validation.
 * Per specification §5.4, §7.2, §8.2
 */
@Service
@Slf4j
public class JwtService {

    private final SecretKey accessTokenKey;
    private final SecretKey refreshTokenKey;
    private final long accessTokenExpirationMinutes;
    private final long refreshTokenExpirationDays;

    private final SecretKey jitsiAppKey;
    private final String jitsiAppId;
    private final String jitsiAudience;
    private final String jitsiXmppDomain;
    private final long jitsiTokenTtlMinutes;

    public JwtService(
            @Value("${jmp.security.jwt.access-token-secret}") String accessTokenSecret,
            @Value("${jmp.security.jwt.refresh-token-secret}") String refreshTokenSecret,
            @Value("${jmp.security.jwt.access-token-expiration-minutes:15}") long accessTokenExpirationMinutes,
            @Value("${jmp.security.jwt.refresh-token-expiration-days:7}") long refreshTokenExpirationDays,
            @Value("${jitsi.jwt.app-id:}") String jitsiAppId,
            @Value("${jitsi.jwt.app-secret:}") String jitsiAppSecret,
            @Value("${jitsi.jwt.app-secret-type:raw}") String jitsiAppSecretType,
            @Value("${jitsi.jwt.audience:jitsi}") String jitsiAudience,
            @Value("${jitsi.xmpp-domain:meet.jitsi}") String jitsiXmppDomain,
            @Value("${jitsi.jwt.token-ttl-minutes:240}") long jitsiTokenTtlMinutes) {
        this.accessTokenKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(accessTokenSecret));
        this.refreshTokenKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(refreshTokenSecret));
        this.accessTokenExpirationMinutes = accessTokenExpirationMinutes;
        this.refreshTokenExpirationDays = refreshTokenExpirationDays;
        this.jitsiAppKey = jitsiAppSecret.isBlank()
            ? this.accessTokenKey
            : Keys.hmacShaKeyFor(jitsiSecretBytes(jitsiAppSecret, jitsiAppSecretType));
        this.jitsiAppId = jitsiAppId;
        this.jitsiAudience = jitsiAudience;
        this.jitsiXmppDomain = jitsiXmppDomain;
        this.jitsiTokenTtlMinutes = jitsiTokenTtlMinutes;
    }

    /**
     * Bytes the Jitsi token is signed with.
     *
     * <p>Prosody's token module takes {@code app_secret} as a literal string and feeds it
     * to HMAC-SHA256 as is ({@code token/util.lib.lua}: {@code key = self.appSecret}), so
     * the platform has to sign with the raw UTF-8 bytes of the very same value — that is
     * the {@code raw} mode and what the Jitsi docker images expect. {@code base64} is kept
     * for deployments where Prosody was configured with the decoded key instead; choosing
     * the wrong one shows up as an authentication failure on joining any room, never as a
     * partially working conference.
     */
    private static byte[] jitsiSecretBytes(String secret, String type) {
        if ("base64".equalsIgnoreCase(type.trim())) {
            return Decoders.BASE64.decode(secret);
        }
        if (!"raw".equalsIgnoreCase(type.trim())) {
            log.warn("Unknown jitsi.jwt.app-secret-type '{}' — falling back to 'raw'", type);
        }
        return secret.getBytes(StandardCharsets.UTF_8);
    }

    /**
     * Generate access token for platform authentication.
     * Per specification §8.2: 15 minute TTL
     */
    public String generateAccessToken(User user) {
        log.debug("Generating access token for user: {}", user.getId());

        Map<String, Object> claims = new HashMap<>();
        claims.put("sub", user.getId().toString());
        claims.put("email", user.getEmail());
        claims.put("tenant_id", user.getTenant().getId().toString());
        claims.put("roles", user.getRoles().stream()
            .map(role -> role.getName())
            .toList());

        Instant expiration = Instant.now().plus(accessTokenExpirationMinutes, ChronoUnit.MINUTES);

        return Jwts.builder()
            .claims(claims)
            .subject(user.getId().toString())
            .issuedAt(Date.from(Instant.now()))
            .expiration(Date.from(expiration))
            .signWith(accessTokenKey)
            .compact();
    }

    /**
     * Generate refresh token.
     * Per specification §8.2: 7 day TTL, HTTP-only
     */
    public String generateRefreshToken(User user) {
        log.debug("Generating refresh token for user: {}", user.getId());

        Instant expiration = Instant.now().plus(refreshTokenExpirationDays, ChronoUnit.DAYS);

        return Jwts.builder()
            .subject(user.getId().toString())
            .claim("type", "refresh")
            .issuedAt(Date.from(Instant.now()))
            .expiration(Date.from(expiration))
            .signWith(refreshTokenKey)
            .compact();
    }

    /**
     * Generate Jitsi conference token compatible with Prosody JWT auth.
     * Required claims: iss, aud, sub (XMPP domain), room, context
     * Per specification §5.4, §7.2
     *
     * @param isModerator must be decided by the server, never taken from the client
     */
    public String generateJitsiToken(Conference conference, User user, boolean isModerator) {
        log.debug("Generating Jitsi token for conference: {}, user: {}",
            conference.getId(), user.getId());

        Map<String, Object> contextUser = new HashMap<>();
        contextUser.put("id", user.getId().toString());
        contextUser.put("name", user.getFirstName() + " " + user.getLastName());
        contextUser.put("email", user.getEmail());
        if (isModerator) {
            contextUser.put("moderator", "true");
        }

        Map<String, Object> claims = new HashMap<>();
        claims.put("iss", jitsiAppId);
        claims.put("aud", jitsiAudience);
        claims.put("sub", jitsiXmppDomain);
        claims.put("room", Conference.backendSafeRoomName(conference.getRoomName()));
        claims.put("context", Map.of(
            "user", contextUser,
            "features", Map.of(
                "livestreaming", conference.getEnableLiveStreaming(),
                "recording", conference.getEnableRecording(),
                "screen-sharing", conference.getEnableScreenSharing()
            )
        ));

        return signJitsiToken(claims);
    }

    /**
     * Expiration time of a Jitsi token issued now. Read from the same configured TTL that
     * goes into the token, so a reported expiration never drifts from the real one.
     */
    public Instant jitsiTokenExpiration() {
        return Instant.now().plus(jitsiTokenTtlMinutes, ChronoUnit.MINUTES);
    }

    /**
     * Generate guest token for external participants compatible with Prosody JWT auth.
     * Required claims: iss, aud, sub (XMPP domain), room, context
     *
     * @param isModerator must be decided by the server, never taken from the client
     */
    public String generateGuestToken(Conference conference, String displayName, boolean isModerator) {
        log.debug("Generating guest token for conference: {}", conference.getId());

        Map<String, Object> contextUser = new HashMap<>();
        contextUser.put("name", displayName);
        if (isModerator) {
            contextUser.put("moderator", "true");
        }

        Map<String, Object> claims = new HashMap<>();
        claims.put("iss", jitsiAppId);
        claims.put("aud", jitsiAudience);
        claims.put("sub", jitsiXmppDomain);
        claims.put("room", Conference.backendSafeRoomName(conference.getRoomName()));
        claims.put("context", Map.of(
            "user", contextUser,
            "features", Map.of(
                "livestreaming", false,
                "recording", false,
                "screen-sharing", conference.getEnableScreenSharing()
            )
        ));

        return signJitsiToken(claims);
    }

    /**
     * Builds a Jitsi token out of the prepared claims and signs it.
     *
     * <p>The signature algorithm is pinned to HMAC-SHA256 on purpose. Prosody's
     * {@code token_verification} module verifies with exactly one algorithm and the Jitsi
     * docker images leave it at the default {@code HS256}, while jjwt derives the strongest
     * MAC the key allows — so this very secret used to yield an {@code HS384} token that
     * Prosody rejected with "Invalid or incorrect alg". The rejection is only visible in the
     * browser console, the participant simply never reaches the conference.
     *
     * @param claims claims shared by platform and guest tokens (iss, aud, sub, room, context)
     */
    private String signJitsiToken(Map<String, Object> claims) {
        return Jwts.builder()
            .header().type("JWT").and()
            .claims(claims)
            .subject(jitsiXmppDomain)
            .issuedAt(Date.from(Instant.now()))
            .expiration(Date.from(jitsiTokenExpiration()))
            .signWith(jitsiAppKey, Jwts.SIG.HS256)
            .compact();
    }

    /**
     * Validate and parse access token.
     */
    public Claims validateAccessToken(String token) {
        return Jwts.parser()
            .verifyWith(accessTokenKey)
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }

    /**
     * Validate and parse refresh token.
     */
    public Claims validateRefreshToken(String token) {
        Claims claims = Jwts.parser()
            .verifyWith(refreshTokenKey)
            .build()
            .parseSignedClaims(token)
            .getPayload();

        if (!"refresh".equals(claims.get("type"))) {
            throw new IllegalArgumentException("Invalid token type");
        }

        return claims;
    }

    /**
     * Extract user ID from token.
     */
    public UUID extractUserId(String token) {
        Claims claims = validateAccessToken(token);
        return UUID.fromString(claims.getSubject());
    }

    /**
     * Extract tenant ID from token.
     */
    public UUID extractTenantId(String token) {
        Claims claims = validateAccessToken(token);
        String tenantId = claims.get("tenant_id", String.class);
        return UUID.fromString(tenantId);
    }

    /**
     * Extract roles from token.
     */
    @SuppressWarnings("unchecked")
    public java.util.List<String> extractRoles(String token) {
        Claims claims = validateAccessToken(token);
        return claims.get("roles", java.util.List.class);
    }

    /**
     * Check if token is expired.
     */
    public boolean isTokenExpired(String token) {
        try {
            Claims claims = validateAccessToken(token);
            return claims.getExpiration().before(Date.from(Instant.now()));
        } catch (Exception e) {
            return true;
        }
    }

    /**
     * Get token expiration time.
     */
    public Instant getExpirationTime(String token) {
        Claims claims = validateAccessToken(token);
        return claims.getExpiration().toInstant();
    }
}
