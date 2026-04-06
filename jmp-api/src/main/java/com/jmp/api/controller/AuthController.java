package com.jmp.api.controller;

import com.jmp.application.dto.UserDto;
import com.jmp.application.service.JwtService;
import com.jmp.application.service.UserService;
import com.jmp.domain.entity.User;
import com.jmp.domain.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Authentication controller for login and token management.
 * Per specification §5.1, §6.1, §8.2
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Authentication", description = "Authentication and authorization endpoints")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private final JwtService jwtService;
    private final UserRepository userRepository;

    @PostMapping("/login")
    @Operation(summary = "Authenticate user and return tokens")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        log.info("Login attempt for user: {}", request.email());

        try {
            // Find user to get ID for authentication
            UserDto.Response user = userService.getUserByEmail(request.email());
            
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                    user.id().toString(),
                    request.password()
                )
            );

            if (authentication.isAuthenticated()) {
                User fullUser = userRepository.findWithRolesById(user.id()).orElseThrow();
                
                String accessToken = jwtService.generateAccessToken(fullUser);
                String refreshToken = jwtService.generateRefreshToken(fullUser);
                
                userService.recordLogin(user.id());

                log.info("User logged in successfully: {}", user.id());
                
                return ResponseEntity.ok(new AuthResponse(
                    accessToken,
                    refreshToken,
                    jwtService.getExpirationTime(accessToken),
                    user
                ));
            }
        } catch (BadCredentialsException e) {
            log.warn("Failed login attempt for: {}", request.email());
            throw new BadCredentialsException("Invalid credentials");
        }

        throw new BadCredentialsException("Authentication failed");
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token using refresh token")
    public ResponseEntity<TokenRefreshResponse> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        log.debug("Token refresh attempt");

        var claims = jwtService.validateRefreshToken(request.refreshToken());
        UUID userId = UUID.fromString(claims.getSubject());
        
        User user = userRepository.findWithRolesById(userId)
            .orElseThrow(() -> new BadCredentialsException("User not found"));

        String newAccessToken = jwtService.generateAccessToken(user);

        return ResponseEntity.ok(new TokenRefreshResponse(
            newAccessToken,
            jwtService.getExpirationTime(newAccessToken)
        ));
    }

    // Request/Response records
    public record LoginRequest(
        @NotBlank String email,
        @NotBlank String password
    ) {}

    public record AuthResponse(
        String accessToken,
        String refreshToken,
        Instant expiresAt,
        UserDto.Response user
    ) {}

    public record RefreshTokenRequest(
        @NotBlank String refreshToken
    ) {}

    public record TokenRefreshResponse(
        String accessToken,
        Instant expiresAt
    ) {}
}
