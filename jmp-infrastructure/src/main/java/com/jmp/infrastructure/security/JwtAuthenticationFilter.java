package com.jmp.infrastructure.security;

import com.jmp.application.service.JwtService;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * JWT authentication filter for validating access tokens.
 * Per specification §8.2
 */
@Component
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    public JwtAuthenticationFilter(JwtService jwtService, UserDetailsService userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            String jwt = extractJwtFromRequest(request);

            if (jwt != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                Claims claims = jwtService.validateAccessToken(jwt);
                
                String userId = claims.getSubject();
                List<String> roles = claims.get("roles", List.class);

                UserDetails userDetails = userDetailsService.loadUserByUsername(userId);

                List<SimpleGrantedAuthority> authorities = roles.stream()
                    .map(SimpleGrantedAuthority::new)
                    .collect(Collectors.toList());

                UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        authorities
                    );

                authentication.setDetails(new WebAuthenticationDetails(request, claims));
                SecurityContextHolder.getContext().setAuthentication(authentication);

                log.debug("Authenticated user: {}, URI: {}", userId, request.getRequestURI());
            }
        } catch (Exception e) {
            log.error("Cannot set user authentication: {}", e.getMessage());
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }

    private String extractJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/api/v1/auth/") ||
               path.startsWith("/api/v1/webhooks/") ||
               path.equals("/actuator/health") ||
               path.startsWith("/swagger-ui/") ||
               path.startsWith("/v3/api-docs/");
    }

    /**
     * Custom authentication details holding JWT claims.
     */
    public static class WebAuthenticationDetails {
        private final HttpServletRequest request;
        private final Claims claims;

        public WebAuthenticationDetails(HttpServletRequest request, Claims claims) {
            this.request = request;
            this.claims = claims;
        }

        public UUID getTenantId() {
            String tenantId = claims.get("tenant_id", String.class);
            return tenantId != null ? UUID.fromString(tenantId) : null;
        }

        public UUID getUserId() {
            return UUID.fromString(claims.getSubject());
        }

        public String getRemoteAddress() {
            return request.getRemoteAddr();
        }
    }
}
