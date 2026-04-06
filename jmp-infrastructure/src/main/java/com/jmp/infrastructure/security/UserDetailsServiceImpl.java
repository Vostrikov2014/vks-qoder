package com.jmp.infrastructure.security;

import com.jmp.domain.entity.User;
import com.jmp.domain.repository.UserRepository;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * UserDetailsService implementation for Spring Security.
 * Loads user by ID (used as username in JWT subject).
 */
@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String userId) throws UsernameNotFoundException {
        User user = userRepository.findWithRolesById(UUID.fromString(userId))
            .orElseThrow(() -> new UsernameNotFoundException("User not found: " + userId));

        if (!user.isActive()) {
            throw new UsernameNotFoundException("User is not active: " + userId);
        }

        return new org.springframework.security.core.userdetails.User(
            user.getId().toString(),
            user.getPasswordHash(),
            user.isActive(),
            true,
            true,
            true,
            user.getRoles().stream()
                .map(role -> new SimpleGrantedAuthority(role.getName()))
                .collect(Collectors.toList())
        );
    }
}
