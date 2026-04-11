package com.jmp.application.service;

import com.jmp.application.dto.UserDto;
import com.jmp.application.mapper.UserMapper;
import com.jmp.domain.entity.Role;
import com.jmp.domain.entity.Tenant;
import com.jmp.domain.entity.User;
import com.jmp.domain.repository.RoleRepository;
import com.jmp.domain.repository.TenantRepository;
import com.jmp.domain.repository.UserRepository;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for user management operations.
 * Per specification §5.1, §15.1-15.7
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final TenantRepository tenantRepository;
    private final RoleRepository roleRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    /**
     * Create a new user.
     * Complexity: O(1) for DB operations
     */
    @Transactional
    public UserDto.Response createUser(UUID tenantId, UserDto.CreateRequest request) {
        log.info("Creating user with email: {} for tenant: {}", request.email(), tenantId);

        // Validate email uniqueness
        if (userRepository.existsByEmailAndDeletedAtIsNull(request.email())) {
            throw new IllegalArgumentException("Email already exists: " + request.email());
        }

        Tenant tenant = tenantRepository.findById(tenantId)
            .orElseThrow(() -> new IllegalArgumentException("Tenant not found: " + tenantId));

        User user = userMapper.toEntity(request);
        user.setTenant(tenant);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setStatus(User.UserStatus.ACTIVE);
        user.setEmailVerified(false);

        // Assign roles
        Set<Role> roles = resolveRoles(request.roleNames(), tenant);
        user.setRoles(roles);

        User saved = userRepository.save(user);
        log.info("User created with ID: {}", saved.getId());

        return userMapper.toResponse(saved);
    }

    /**
     * Get user by ID.
     */
    public UserDto.Response getUser(UUID id) {
        User user = userRepository.findWithRolesById(id)
            .orElseThrow(() -> new IllegalArgumentException("User not found: " + id));
        return userMapper.toResponse(user);
    }

    /**
     * Get user by email.
     */
    public UserDto.Response getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));
        return userMapper.toResponse(user);
    }

    /**
     * List users by tenant with pagination.
     * Complexity: O(1) with proper indexing
     */
    public Page<UserDto.Summary> listUsers(UUID tenantId, Pageable pageable) {
        return userRepository.findByTenantIdAndDeletedAtIsNull(tenantId, pageable)
            .map(userMapper::toSummary);
    }

    /**
     * Search users within a tenant.
     */
    public Page<UserDto.Summary> searchUsers(UUID tenantId, String search, Pageable pageable) {
        return userRepository.searchByTenantId(tenantId, search, pageable)
            .map(userMapper::toSummary);
    }

    /**
     * Update user.
     */
    @Transactional
    public UserDto.Response updateUser(UUID id, UserDto.UpdateRequest request) {
        log.info("Updating user: {}", id);

        User user = userRepository.findWithRolesById(id)
            .orElseThrow(() -> new IllegalArgumentException("User not found: " + id));

        userMapper.updateEntityFromDto(request, user);

        // Update roles if provided
        if (request.roleNames() != null && !request.roleNames().isEmpty()) {
            Set<Role> roles = resolveRoles(request.roleNames(), user.getTenant());
            user.setRoles(roles);
        }

        User updated = userRepository.save(user);
        log.info("User updated: {}", id);

        return userMapper.toResponse(updated);
    }

    /**
     * Soft delete user.
     */
    @Transactional
    public void deleteUser(UUID id) {
        log.info("Deleting user: {}", id);

        User user = userRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("User not found: " + id));

        user.softDelete();
        userRepository.save(user);

        log.info("User soft deleted: {}", id);
    }

    /**
     * Record user login.
     */
    @Transactional
    public void recordLogin(UUID userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        user.setLastLoginAt(Instant.now());
        userRepository.save(user);
    }

    /**
     * Check if user has permission.
     */
    public boolean hasPermission(UUID userId, String permission) {
        User user = userRepository.findWithRolesById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        return user.getRoles().stream()
            .flatMap(role -> role.getPermissions().stream())
            .anyMatch(p -> p.getName().equals(permission));
    }

    /**
     * Resolve role names to Role entities.
     */
    private Set<Role> resolveRoles(Set<String> roleNames, Tenant tenant) {
        if (roleNames == null || roleNames.isEmpty()) {
            // Default to PARTICIPANT role
            Role defaultRole = roleRepository.findByName(Role.ROLE_PARTICIPANT)
                .orElseThrow(() -> new IllegalStateException("Default role not found"));
            return Set.of(defaultRole);
        }

        Set<Role> roles = new HashSet<>();
        for (String roleName : roleNames) {
            Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new IllegalArgumentException("Role not found: " + roleName));
            roles.add(role);
        }
        return roles;
    }
}
