package com.jmp.domain.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

/**
 * Identity Provider configuration for SSO/OIDC.
 * Per specification §19.1-19.10
 */
@Entity
@Table(name = "identity_providers", schema = "jmp")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
public class IdentityProvider {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @NotNull
    @Size(max = 100)
    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Size(max = 500)
    @Column(name = "description", length = 500)
    private String description;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "provider_type", nullable = false, length = 20)
    private ProviderType providerType = ProviderType.OIDC;

    @NotNull
    @Size(max = 500)
    @Column(name = "issuer_url", nullable = false, length = 500)
    private String issuerUrl;

    @NotNull
    @Size(max = 500)
    @Column(name = "authorization_endpoint", nullable = false, length = 500)
    private String authorizationEndpoint;

    @NotNull
    @Size(max = 500)
    @Column(name = "token_endpoint", nullable = false, length = 500)
    private String tokenEndpoint;

    @Size(max = 500)
    @Column(name = "userinfo_endpoint", length = 500)
    private String userinfoEndpoint;

    @Size(max = 500)
    @Column(name = "jwks_uri", length = 500)
    private String jwksUri;

    @NotNull
    @Size(max = 255)
    @Column(name = "client_id", nullable = false, length = 255)
    private String clientId;

    @NotNull
    @Size(max = 500)
    @Column(name = "client_secret", nullable = false, length = 500)
    private String clientSecret;

    @Size(max = 500)
    @Column(name = "redirect_uri", length = 500)
    private String redirectUri;

    @Size(max = 1000)
    @Column(name = "scopes", length = 1000)
    private String scopes = "openid profile email";

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "attribute_mapping", columnDefinition = "jsonb")
    private Map<String, String> attributeMapping = new HashMap<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "additional_config", columnDefinition = "jsonb")
    private Map<String, Object> additionalConfig = new HashMap<>();

    @Column(name = "enabled")
    private Boolean enabled = true;

    @Column(name = "auto_provision_users")
    private Boolean autoProvisionUsers = true;

    @Column(name = "force_sso")
    private Boolean forceSso = false;

    @Size(max = 100)
    @Column(name = "default_role", length = 100)
    private String defaultRole = "PARTICIPANT";

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        IdentityProvider that = (IdentityProvider) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "IdentityProvider{" +
            "id=" + id +
            ", name='" + name + '\'' +
            ", providerType=" + providerType +
            ", issuerUrl='" + issuerUrl + '\'' +
            ", enabled=" + enabled +
            '}';
    }

    public enum ProviderType {
        OIDC,
        SAML,
        OAUTH2,
        LDAP,
        AZURE_AD,
        GOOGLE_WORKSPACE,
        OKTA
    }
}
