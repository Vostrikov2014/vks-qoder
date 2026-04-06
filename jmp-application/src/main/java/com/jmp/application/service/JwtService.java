package com.jmp.application.service;

import com.jmp.domain.entity.Conference;
import com.jmp.domain.entity.Tenant;
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

    public JwtService(
            @Value("${jmp.security.jwt.access-token-secret}") String accessTokenSecret,
            @Value("${jmp.security.jwt.refresh-token-secret}") String refreshTokenSecret,
            @Value("${jmp.security.jwt.access-token-expiration-minutes:15}") long accessTokenExpirationMinutes,
            @Value("${jmp.security.jwt.refresh-token-expiration-days:7}") long refreshTokenExpirationDays) {
        this.accessTokenKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(accessTokenSecret));
        this.refreshTokenKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(refreshTokenSecret));
        this.accessTokenExpirationMinutes = accessTokenExpirationMinutes;
        this.refreshTokenExpirationDays = refreshTokenExpirationDays;
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
     * Generate Jitsi conference token.
     * Per specification §5.4, §7.2
     * Claims: room, sub, exp, roles, mod, tenant_id
     */
    public String generateJitsiToken(Conference conference, User user, boolean isModerator) {
        log.debug("Generating Jitsi token for conference: {}, user: {}", 
            conference.getId(), user.getId());

        Tenant tenant = conference.getTenant();
        Instant expiration = Instant.now().plus(4, ChronoUnit.HOURS); // Conference duration

        Map<String, Object> claims = new HashMap<>();
        claims.put("room", conference.getRoomName());
        claims.put("sub", user.getEmail());
        claims.put("tenant_id", tenant.getSlug());
        claims.put("mod", isModerator);
        claims.put("context", Map.of(
            "user", Map.of(
                "id", user.getId().toString(),
                "name", user.getFirstName() + " " + user.getLastName(),
                "email", user.getEmail()
            ),
            "features", Map.of(
                "livestreaming", conference.getEnableLiveStreaming(),
                "recording", conference.getEnableRecording(),
                "screen-sharing", conference.getEnableScreenSharing()
            )
        ));

        return Jwts.builder()
            .claims(claims)
            .subject(user.getEmail())
            .issuedAt(Date.from(Instant.now()))
            .expiration(Date.from(expiration))
            .signWith(accessTokenKey)
            .compact();
    }

    /**
     * Generate guest token for external participants.
     */
    public String generateGuestToken(Conference conference, String displayName, boolean isModerator) {
        log.debug("Generating guest token for conference: {}", conference.getId());

        Tenant tenant = conference.getTenant();
        Instant expiration = Instant.now().plus(4, ChronoUnit.HOURS);

        Map<String, Object> claims = new HashMap<>();
        claims.put("room", conference.getRoomName());
        claims.put("sub", "guest-" + UUID.randomUUID());
        claims.put("tenant_id", tenant.getSlug());
        claims.put("mod", isModerator);
        claims.put("context", Map.of(
            "user", Map.of(
                "name", displayName
            ),
            "features", Map.of(
                "livestreaming", false,
                "recording", false,
                "screen-sharing", conference.getEnableScreenSharing()
            )
        ));

        return Jwts.builder()
            .claims(claims)
            .subject("guest-" + UUID.randomUUID())
            .issuedAt(Date.from(Instant.now()))
            .expiration(Date.from(expiration))
            .signWith(accessTokenKey)
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
