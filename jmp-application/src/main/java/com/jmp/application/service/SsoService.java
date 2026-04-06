package com.jmp.application.service;

import com.jmp.domain.entity.IdentityProvider;
import com.jmp.domain.entity.Role;
import com.jmp.domain.entity.User;
import com.jmp.domain.repository.IdentityProviderRepository;
import com.jmp.domain.repository.RoleRepository;
import com.jmp.domain.repository.UserRepository;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

/**
 * Service for SSO/OIDC authentication.
 * Per specification §19.1-19.10
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SsoService {

    private final IdentityProviderRepository identityProviderRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final JwtService jwtService;
    private final AuditService auditService;
    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Generate OIDC authorization URL.
     */
    public String generateAuthorizationUrl(UUID identityProviderId, String state, String nonce) {
        IdentityProvider idp = identityProviderRepository.findById(identityProviderId)
            .orElseThrow(() -> new IllegalArgumentException("Identity provider not found"));

        if (!idp.getEnabled()) {
            throw new IllegalStateException("Identity provider is disabled");
        }

        StringBuilder url = new StringBuilder(idp.getAuthorizationEndpoint());
        url.append("?client_id=").append(URLEncoder.encode(idp.getClientId(), StandardCharsets.UTF_8));
        url.append("&response_type=code");
        url.append("&scope=").append(URLEncoder.encode(idp.getScopes(), StandardCharsets.UTF_8));
        url.append("&redirect_uri=").append(URLEncoder.encode(idp.getRedirectUri(), StandardCharsets.UTF_8));
        url.append("&state=").append(URLEncoder.encode(state, StandardCharsets.UTF_8));
        url.append("&nonce=").append(URLEncoder.encode(nonce, StandardCharsets.UTF_8));

        return url.toString();
    }

    /**
     * Handle OIDC callback and authenticate user.
     */
    @Transactional
    public SsoAuthenticationResult handleCallback(UUID identityProviderId, String code, String state) {
        log.info("Handling SSO callback for provider: {}", identityProviderId);

        IdentityProvider idp = identityProviderRepository.findById(identityProviderId)
            .orElseThrow(() -> new IllegalArgumentException("Identity provider not found"));

        // Exchange code for tokens
        OidcTokenResponse tokens = exchangeCodeForTokens(idp, code);

        // Get user info
        Map<String, Object> userInfo = getUserInfo(idp, tokens.accessToken());

        // Map attributes
        String email = extractAttribute(userInfo, idp.getAttributeMapping().getOrDefault("email", "email"));
        String firstName = extractAttribute(userInfo, idp.getAttributeMapping().getOrDefault("firstName", "given_name"));
        String lastName = extractAttribute(userInfo, idp.getAttributeMapping().getOrDefault("lastName", "family_name"));
        String externalId = extractAttribute(userInfo, idp.getAttributeMapping().getOrDefault("sub", "sub"));

        if (email == null || email.isBlank()) {
            throw new IllegalStateException("Email not found in user info");
        }

        // Find or create user
        Optional<User> existingUser = userRepository.findByEmailAndTenantId(email, idp.getTenant().getId());

        User user;
        if (existingUser.isPresent()) {
            user = existingUser.get();
            // Update user info from IdP
            user.setFirstName(firstName);
            user.setLastName(lastName);
            user.setExternalAuthId(externalId);
            user.setExternalAuthProvider(idp.getProviderType().name());
        } else if (idp.getAutoProvisionUsers()) {
            user = provisionUser(idp, email, firstName, lastName, externalId);
        } else {
            throw new IllegalStateException("User not found and auto-provisioning is disabled");
        }

        userRepository.save(user);

        // Generate JWT tokens
        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        auditService.logAuthentication(
            "SSO_LOGIN",
            user,
            idp.getTenant().getId(),
            null, // IP address would be passed from controller
            true,
            null
        );

        log.info("SSO authentication successful for user: {}", email);

        return new SsoAuthenticationResult(
            user,
            accessToken,
            refreshToken
        );
    }

    /**
     * Exchange authorization code for tokens.
     */
    private OidcTokenResponse exchangeCodeForTokens(IdentityProvider idp, String code) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "authorization_code");
        body.add("code", code);
        body.add("redirect_uri", idp.getRedirectUri());
        body.add("client_id", idp.getClientId());
        body.add("client_secret", idp.getClientSecret());

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

        ResponseEntity<Map> response = restTemplate.postForEntity(
            idp.getTokenEndpoint(),
            request,
            Map.class
        );

        Map<String, Object> tokenData = response.getBody();
        if (tokenData == null || !tokenData.containsKey("access_token")) {
            throw new IllegalStateException("Failed to obtain access token");
        }

        return new OidcTokenResponse(
            (String) tokenData.get("access_token"),
            (String) tokenData.get("id_token"),
            (String) tokenData.get("refresh_token"),
            ((Number) tokenData.getOrDefault("expires_in", 3600)).longValue()
        );
    }

    /**
     * Get user info from OIDC provider.
     */
    private Map<String, Object> getUserInfo(IdentityProvider idp, String accessToken) {
        if (idp.getUserinfoEndpoint() == null || idp.getUserinfoEndpoint().isBlank()) {
            // Decode ID token if userinfo endpoint is not available
            return jwtService.validateAccessToken(accessToken);
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);

        HttpEntity<Void> request = new HttpEntity<>(headers);

        ResponseEntity<Map> response = restTemplate.exchange(
            idp.getUserinfoEndpoint(),
            HttpMethod.GET,
            request,
            Map.class
        );

        return response.getBody();
    }

    /**
     * Provision new user from SSO.
     */
    private User provisionUser(IdentityProvider idp, String email, String firstName, 
                               String lastName, String externalId) {
        log.info("Provisioning new user from SSO: {}", email);

        User user = new User();
        user.setTenant(idp.getTenant());
        user.setEmail(email);
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setExternalAuthId(externalId);
        user.setExternalAuthProvider(idp.getProviderType().name());
        user.setStatus(User.UserStatus.ACTIVE);
        user.setEmailVerified(true);

        // Assign default role
        Role defaultRole = roleRepository.findByName(idp.getDefaultRole())
            .orElseThrow(() -> new IllegalStateException("Default role not found: " + idp.getDefaultRole()));
        user.setRoles(Set.of(defaultRole));

        return user;
    }

    /**
     * Extract attribute from user info map.
     */
    private String extractAttribute(Map<String, Object> userInfo, String key) {
        Object value = userInfo.get(key);
        return value != null ? value.toString() : null;
    }

    /**
     * Result of SSO authentication.
     */
    public record SsoAuthenticationResult(
        User user,
        String accessToken,
        String refreshToken
    ) {}

    /**
     * OIDC token response.
     */
    private record OidcTokenResponse(
        String accessToken,
        String idToken,
        String refreshToken,
        Long expiresIn
    ) {}
}
