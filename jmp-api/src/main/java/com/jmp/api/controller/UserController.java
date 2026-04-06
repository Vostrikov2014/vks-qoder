package com.jmp.api.controller;

import com.jmp.application.dto.UserDto;
import com.jmp.application.service.UserService;
import com.jmp.infrastructure.security.JwtAuthenticationFilter;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * User management controller.
 * Per specification §5.1, §15.1-15.7
 */
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Slf4j
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Users", description = "User management endpoints")
public class UserController {

    private final UserService userService;

    @PostMapping
    @PreAuthorize("hasRole('TENANT_ADMIN') or hasRole('SUPER_ADMIN')")
    @Operation(summary = "Create a new user")
    public ResponseEntity<UserDto.Response> createUser(
            @Valid @RequestBody UserDto.CreateRequest request,
            Authentication authentication) {
        
        UUID tenantId = extractTenantId(authentication);
        log.info("Creating user for tenant: {}", tenantId);
        
        UserDto.Response user = userService.createUser(tenantId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(user);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('TENANT_ADMIN') or hasRole('SUPER_ADMIN') or @userSecurity.isCurrentUser(#id, authentication)")
    @Operation(summary = "Get user by ID")
    public ResponseEntity<UserDto.Response> getUser(@PathVariable UUID id) {
        return ResponseEntity.ok(userService.getUser(id));
    }

    @GetMapping
    @PreAuthorize("hasRole('TENANT_ADMIN') or hasRole('SUPER_ADMIN')")
    @Operation(summary = "List users in tenant")
    public ResponseEntity<Page<UserDto.Summary>> listUsers(
            Pageable pageable,
            @RequestParam(required = false) String search,
            Authentication authentication) {
        
        UUID tenantId = extractTenantId(authentication);
        
        Page<UserDto.Summary> users;
        if (search != null && !search.isBlank()) {
            users = userService.searchUsers(tenantId, search, pageable);
        } else {
            users = userService.listUsers(tenantId, pageable);
        }
        
        return ResponseEntity.ok(users);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('TENANT_ADMIN') or hasRole('SUPER_ADMIN') or @userSecurity.isCurrentUser(#id, authentication)")
    @Operation(summary = "Update user")
    public ResponseEntity<UserDto.Response> updateUser(
            @PathVariable UUID id,
            @Valid @RequestBody UserDto.UpdateRequest request) {
        
        return ResponseEntity.ok(userService.updateUser(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('TENANT_ADMIN') or hasRole('SUPER_ADMIN')")
    @Operation(summary = "Delete user")
    public ResponseEntity<Void> deleteUser(@PathVariable UUID id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    @Operation(summary = "Get current user profile")
    public ResponseEntity<UserDto.Response> getCurrentUser(Authentication authentication) {
        UUID userId = extractUserId(authentication);
        return ResponseEntity.ok(userService.getUser(userId));
    }

    private UUID extractTenantId(Authentication authentication) {
        if (authentication.getDetails() instanceof JwtAuthenticationFilter.WebAuthenticationDetails details) {
            return details.getTenantId();
        }
        throw new IllegalStateException("Cannot extract tenant ID from authentication");
    }

    private UUID extractUserId(Authentication authentication) {
        if (authentication.getDetails() instanceof JwtAuthenticationFilter.WebAuthenticationDetails details) {
            return details.getUserId();
        }
        throw new IllegalStateException("Cannot extract user ID from authentication");
    }
}
