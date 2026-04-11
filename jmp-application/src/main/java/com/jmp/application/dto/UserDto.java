package com.jmp.application.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.Set;
import java.util.UUID;

/**
 * DTOs for User entity.
 * Per specification §10.2, §14.2
 */
public sealed interface UserDto {

    UUID id();
    String email();
    String firstName();
    String lastName();
    String status();
    Boolean emailVerified();
    Instant lastLoginAt();
    Set<String> roles();
    UUID tenantId();
    Instant createdAt();

    /**
     * Request DTO for creating a user.
     */
    record CreateRequest(
        @NotBlank @Email @Size(max = 255) String email,
        @NotBlank @Size(max = 100) String firstName,
        @NotBlank @Size(max = 100) String lastName,
        @NotBlank @Size(min = 8, max = 100) String password,
        Set<String> roleNames
    ) implements UserDto {
        @Override public UUID id() { return null; }
        @Override public String status() { return null; }
        @Override public Boolean emailVerified() { return null; }
        @Override public Instant lastLoginAt() { return null; }
        @Override public Set<String> roles() { return roleNames; }
        @Override public UUID tenantId() { return null; }
        @Override public Instant createdAt() { return null; }
    }

    /**
     * Request DTO for updating a user.
     */
    record UpdateRequest(
        @Size(max = 100) String firstName,
        @Size(max = 100) String lastName,
        Set<String> roleNames
    ) implements UserDto {
        @Override public UUID id() { return null; }
        @Override public String email() { return null; }
        @Override public String status() { return null; }
        @Override public Boolean emailVerified() { return null; }
        @Override public Instant lastLoginAt() { return null; }
        @Override public Set<String> roles() { return roleNames; }
        @Override public UUID tenantId() { return null; }
        @Override public Instant createdAt() { return null; }
    }

    /**
     * Response DTO for user data.
     */
    record Response(
        UUID id,
        String email,
        String firstName,
        String lastName,
        String status,
        Boolean emailVerified,
        Instant lastLoginAt,
        Set<String> roles,
        UUID tenantId,
        Instant createdAt
    ) implements UserDto {}

    /**
     * Summary response DTO for list views.
     */
    record Summary(
        UUID id,
        String email,
        String firstName,
        String lastName,
        String status,
        Set<String> roles,
        Instant createdAt
    ) implements UserDto {
        @Override public Boolean emailVerified() { return null; }
        @Override public Instant lastLoginAt() { return null; }
        @Override public UUID tenantId() { return null; }
    }
}
