-- Create identity_providers table
-- Per specification §19.1-19.10

CREATE TABLE jmp.identity_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES jmp.tenants(id),
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    provider_type VARCHAR(20) NOT NULL DEFAULT 'OIDC',
    issuer_url VARCHAR(500) NOT NULL,
    authorization_endpoint VARCHAR(500) NOT NULL,
    token_endpoint VARCHAR(500) NOT NULL,
    userinfo_endpoint VARCHAR(500),
    jwks_uri VARCHAR(500),
    client_id VARCHAR(255) NOT NULL,
    client_secret VARCHAR(500) NOT NULL,
    redirect_uri VARCHAR(500),
    scopes VARCHAR(1000) DEFAULT 'openid profile email',
    attribute_mapping JSONB DEFAULT '{}',
    additional_config JSONB DEFAULT '{}',
    enabled BOOLEAN DEFAULT TRUE,
    auto_provision_users BOOLEAN DEFAULT TRUE,
    force_sso BOOLEAN DEFAULT FALSE,
    default_role VARCHAR(100) DEFAULT 'PARTICIPANT',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_identity_providers_tenant ON jmp.identity_providers(tenant_id);
CREATE INDEX idx_identity_providers_enabled ON jmp.identity_providers(tenant_id, enabled);

-- Unique constraint for tenant + name
CREATE UNIQUE INDEX idx_identity_providers_tenant_name ON jmp.identity_providers(tenant_id, name);

-- Add comment
COMMENT ON TABLE jmp.identity_providers IS 'SSO/OIDC identity provider configurations';

-- Add columns to users table for external auth
ALTER TABLE jmp.users ADD COLUMN IF NOT EXISTS external_auth_id VARCHAR(255);
ALTER TABLE jmp.users ADD COLUMN IF NOT EXISTS external_auth_provider VARCHAR(50);

CREATE INDEX idx_users_external_auth ON jmp.users(external_auth_provider, external_auth_id) 
WHERE external_auth_id IS NOT NULL;
