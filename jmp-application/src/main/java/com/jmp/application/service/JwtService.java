package com.jmp.application.service;

import com.jmp.domain.entity.Conference;
import com.jmp.domain.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
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

    public JwtService(
            @Value("${jmp.security.jwt.access-token-secret}") String accessTokenSecret,
            @Value("${jmp.security.jwt.refresh-token-secret}") String refreshTokenSecret,
            @Value("${jmp.security.jwt.access-token-expiration-minutes:15}") long accessTokenExpirationMinutes,
            @Value("${jmp.security.jwt.refresh-token-expiration-days:7}") long refreshTokenExpirationDays,
            @Value("${jitsi.jwt.app-id:}") String jitsiAppId,
            @Value("${jitsi.jwt.app-secret:}") String jitsiAppSecret,
            @Value("${jitsi.jwt.audience:jitsi}") String jitsiAudience,
            @Value("${jitsi.xmpp-domain:meet.jitsi}") String jitsiXmppDomain) {
        this.accessTokenKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(accessTokenSecret));
        this.refreshTokenKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(refreshTokenSecret));
        this.accessTokenExpirationMinutes = accessTokenExpirationMinutes;
        this.refreshTokenExpirationDays = refreshTokenExpirationDays;
        this.jitsiAppKey = jitsiAppSecret.isBlank()
            ? this.accessTokenKey
            : Keys.hmacShaKeyFor(Decoders.BASE64.decode(jitsiAppSecret));
        this.jitsiAppId = jitsiAppId;
        this.jitsiAudience = jitsiAudience;
        this.jitsiXmppDomain = jitsiXmppDomain;
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
     */
    public String generateJitsiToken(Conference conference, User user, boolean isModerator) {
        log.debug("Generating Jitsi token for conference: {}, user: {}",
            conference.getId(), user.getId());

        Instant expiration = Instant.now().plus(4, ChronoUnit.HOURS);

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
        claims.put("room", conference.getRoomName());
        claims.put("context", Map.of(
            "user", contextUser,
            "features", Map.of(
                "livestreaming", conference.getEnableLiveStreaming(),
                "recording", conference.getEnableRecording(),
                "screen-sharing", conference.getEnableScreenSharing()
            )
        ));

        return Jwts.builder()
            .claims(claims)
            .subject(jitsiXmppDomain)
            .issuedAt(Date.from(Instant.now()))
            .expiration(Date.from(expiration))
            .signWith(jitsiAppKey)
            .compact();
    }

    /**
     * Get guest token expiration time (4 hours from now).
     */
    public Instant getGuestTokenExpiration() {
        return Instant.now().plus(4, ChronoUnit.HOURS);
    }

    /**
     * Generate guest token for external participants compatible with Prosody JWT auth.
     * Required claims: iss, aud, sub (XMPP domain), room, context
     */
    public String generateGuestToken(Conference conference, String displayName, boolean isModerator) {
        log.debug("Generating guest token for conference: {}", conference.getId());

        Instant expiration = Instant.now().plus(4, ChronoUnit.HOURS);

        Map<String, Object> contextUser = new HashMap<>();
        contextUser.put("name", displayName);
        if (isModerator) {
            contextUser.put("moderator", "true");
        }

        Map<String, Object> claims = new HashMap<>();
        claims.put("iss", jitsiAppId);
        claims.put("aud", jitsiAudience);
        claims.put("sub", jitsiXmppDomain);
        claims.put("room", conference.getRoomName());
        claims.put("context", Map.of(
            "user", contextUser,
            "features", Map.of(
                "livestreaming", false,
                "recording", false,
                "screen-sharing", conference.getEnableScreenSharing()
            )
        ));

        return Jwts.builder()
            .claims(claims)
            .subject(jitsiXmppDomain)
            .issuedAt(Date.from(Instant.now()))
            .expiration(Date.from(expiration))
            .signWith(jitsiAppKey)
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
