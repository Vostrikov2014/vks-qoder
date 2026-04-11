package com.jmp.infrastructure.websocket;

import com.jmp.application.service.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * WebSocket authentication interceptor.
 * Validates JWT tokens in STOMP CONNECT messages.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        
        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            String token = extractToken(accessor);
            
            if (token != null) {
                io.jsonwebtoken.Claims claims;
                try {
                    claims = jwtService.validateAccessToken(token);
                } catch (Exception e) {
                    log.warn("Invalid JWT token in WebSocket connection: {}", e.getMessage());
                    return message;
                }
                
                UUID userId = jwtService.extractUserId(token);
                UUID tenantId = jwtService.extractTenantId(token);
                List<String> roles = jwtService.extractRoles(token);
                
                List<SimpleGrantedAuthority> authorities = roles.stream()
                    .map(SimpleGrantedAuthority::new)
                    .toList();
                
                Authentication authentication = new UsernamePasswordAuthenticationToken(
                    userId,
                    null,
                    authorities
                );
                
                accessor.setUser(authentication);
                accessor.setSessionAttributes(Map.of("tenantId", tenantId));
                
                log.debug("WebSocket authenticated user: {}", userId);
            } else {
                log.warn("Invalid or missing JWT token in WebSocket connection");
            }
        }
        
        return message;
    }

    private String extractToken(StompHeaderAccessor accessor) {
        List<String> authorization = accessor.getNativeHeader("Authorization");
        
        if (authorization != null && !authorization.isEmpty()) {
            String bearerToken = authorization.get(0);
            if (bearerToken.startsWith("Bearer ")) {
                return bearerToken.substring(7);
            }
        }
        
        // Also check query parameter for SockJS fallback
        String login = accessor.getLogin();
        if (login != null && login.startsWith("Bearer ")) {
            return login.substring(7);
        }
        
        return null;
    }
}
