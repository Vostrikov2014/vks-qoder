package com.jmp.api.controller;


import com.jmp.application.service.SsoService;
import com.jmp.domain.entity.IdentityProvider;
import com.jmp.domain.repository.IdentityProviderRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * SSO/OIDC controller.
 * Per specification §19.1-19.10
 */
@RestController
@RequestMapping("/api/v1/sso")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "SSO", description = "SSO/OIDC authentication endpoints")
public class SsoController {

    private final SsoService ssoService;
    private final IdentityProviderRepository identityProviderRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    /**
     * Get available identity providers for a tenant.
     */
    @GetMapping("/providers/{tenantId}")
    @Operation(summary = "Get SSO providers for tenant")
    public ResponseEntity<List<IdentityProvider>> getProviders(@PathVariable UUID tenantId) {
        List<IdentityProvider> providers = identityProviderRepository.findByTenantIdAndEnabledTrue(tenantId);
        // Don't expose secrets
        providers.forEach(p -> p.setClientSecret(null));
        return ResponseEntity.ok(providers);
    }

    /**
     * Initiate SSO login.
     */
    @GetMapping("/login/{providerId}")
    @Operation(summary = "Initiate SSO login")
    public void initiateLogin(
            @PathVariable UUID providerId,
            HttpServletRequest request,
            HttpServletResponse response) throws IOException {
        
        // Generate state and nonce
        String state = generateRandomString(32);
        String nonce = generateRandomString(32);

        // Store in session for validation
        request.getSession().setAttribute("sso_state", state);
        request.getSession().setAttribute("sso_nonce", nonce);
        request.getSession().setAttribute("sso_provider_id", providerId);

        String authorizationUrl = ssoService.generateAuthorizationUrl(providerId, state, nonce);
        
        log.info("Initiating SSO login for provider: {}", providerId);
        response.sendRedirect(authorizationUrl);
    }

    /**
     * Handle SSO callback.
     */
    @GetMapping("/callback")
    @Operation(summary = "Handle SSO callback")
    public ResponseEntity<SsoAuthenticationResponse> handleCallback(
            @RequestParam String code,
            @RequestParam String state,
            HttpServletRequest request) {
        
        // Validate state
        String storedState = (String) request.getSession().getAttribute("sso_state");
        UUID providerId = (UUID) request.getSession().getAttribute("sso_provider_id");

        if (storedState == null || !storedState.equals(state) || providerId == null) {
            throw new IllegalStateException("Invalid state parameter");
        }

        // Clear session attributes
        request.getSession().removeAttribute("sso_state");
        request.getSession().removeAttribute("sso_nonce");
        request.getSession().removeAttribute("sso_provider_id");

        // Process authentication
        SsoService.SsoAuthenticationResult result = ssoService.handleCallback(providerId, code, state);

        return ResponseEntity.ok(new SsoAuthenticationResponse(
            result.accessToken(),
            result.refreshToken(),
            "Bearer",
            900
        ));
    }

    public record SsoAuthenticationResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        long expiresIn
    ) {}

    private String generateRandomString(int length) {
        byte[] bytes = new byte[length];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
