-- Jitsi Management Platform - Schema
-- All tables in final state

CREATE SCHEMA IF NOT EXISTS jmp;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tenants table (unchanged from original V1)
CREATE TABLE IF NOT EXISTS jmp.tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    domain VARCHAR(255) UNIQUE,
    jitsi_domain VARCHAR(255),
    max_concurrent_conferences INTEGER DEFAULT 10,
    max_participants_per_conference INTEGER DEFAULT 100,
    max_recording_storage_mb BIGINT DEFAULT 10240,
    max_conference_duration_minutes INTEGER DEFAULT 240,
    allowed_features VARCHAR(255) DEFAULT 'chat,screen_share,recording,live_streaming',
    settings JSONB DEFAULT '{}',
    jitsi_config JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    suspended_at TIMESTAMP WITH TIME ZONE,
    suspension_reason VARCHAR(500)
);

-- 2. Permissions table (unchanged)
CREATE TABLE IF NOT EXISTS jmp.permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    resource_type VARCHAR(30) NOT NULL,
    action VARCHAR(20) NOT NULL,
    is_system_permission BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Roles table (unchanged)
CREATE TABLE IF NOT EXISTS jmp.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    role_type VARCHAR(20) NOT NULL,
    tenant_id UUID REFERENCES jmp.tenants(id),
    parent_role_id UUID REFERENCES jmp.roles(id),
    is_system_role BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Role permissions junction
CREATE TABLE IF NOT EXISTS jmp.role_permissions (
    role_id UUID NOT NULL REFERENCES jmp.roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES jmp.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 5. Users table — INCLUDES external_auth_id and external_auth_provider (was in V5)
CREATE TABLE IF NOT EXISTS jmp.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING_VERIFICATION',
    email_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    external_auth_id VARCHAR(255),
    external_auth_provider VARCHAR(50),
    tenant_id UUID NOT NULL REFERENCES jmp.tenants(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 6. User roles junction
CREATE TABLE IF NOT EXISTS jmp.user_roles (
    user_id UUID NOT NULL REFERENCES jmp.users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES jmp.roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- 7. Conferences table — INCLUDES type (V6), access_policy/allowed_domain/waiting_room_enabled/require_auth_for_assigned (V9)
CREATE TABLE IF NOT EXISTS jmp.conferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    tenant_id UUID NOT NULL REFERENCES jmp.tenants(id),
    created_by UUID NOT NULL REFERENCES jmp.users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    type VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    scheduled_start_at TIMESTAMP WITH TIME ZONE,
    scheduled_end_at TIMESTAMP WITH TIME ZONE,
    actual_started_at TIMESTAMP WITH TIME ZONE,
    actual_ended_at TIMESTAMP WITH TIME ZONE,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_rule VARCHAR(100),
    max_participants INTEGER,
    require_password BOOLEAN DEFAULT FALSE,
    password_hash VARCHAR(100),
    enable_lobby BOOLEAN DEFAULT FALSE,
    enable_recording BOOLEAN DEFAULT FALSE,
    enable_live_streaming BOOLEAN DEFAULT FALSE,
    enable_chat BOOLEAN DEFAULT TRUE,
    enable_screen_sharing BOOLEAN DEFAULT TRUE,
    mute_upon_entry BOOLEAN DEFAULT FALSE,
    require_signed_in BOOLEAN DEFAULT FALSE,
    access_policy VARCHAR(50) NOT NULL DEFAULT 'PUBLIC'
        CHECK (access_policy IN ('PUBLIC', 'ASSIGNED_ONLY', 'DOMAIN_RESTRICTED')),
    allowed_domain VARCHAR(255),
    waiting_room_enabled BOOLEAN DEFAULT false,
    require_auth_for_assigned BOOLEAN DEFAULT true,
    jitsi_options JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 8. Conference participants
CREATE TABLE IF NOT EXISTS jmp.conference_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conference_id UUID NOT NULL REFERENCES jmp.conferences(id) ON DELETE CASCADE,
    user_id UUID REFERENCES jmp.users(id),
    display_name VARCHAR(255),
    email VARCHAR(255),
    external_id VARCHAR(100),
    role VARCHAR(20) NOT NULL DEFAULT 'PARTICIPANT',
    status VARCHAR(20) NOT NULL DEFAULT 'INVITED',
    joined_at TIMESTAMP WITH TIME ZONE,
    left_at TIMESTAMP WITH TIME ZONE,
    is_moderator BOOLEAN DEFAULT FALSE,
    is_recorder BOOLEAN DEFAULT FALSE,
    is_silent BOOLEAN DEFAULT FALSE,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 9. Recordings (was V3)
CREATE TABLE IF NOT EXISTS jmp.recordings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conference_id UUID NOT NULL REFERENCES jmp.conferences(id),
    tenant_id UUID NOT NULL REFERENCES jmp.tenants(id),
    recording_key VARCHAR(255) NOT NULL UNIQUE,
    original_filename VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    recording_type VARCHAR(20) NOT NULL DEFAULT 'VIDEO',
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_seconds BIGINT,
    file_size_bytes BIGINT,
    file_hash_sha256 VARCHAR(64),
    mime_type VARCHAR(50),
    resolution_width INTEGER,
    resolution_height INTEGER,
    thumbnail_key VARCHAR(255),
    transcription JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    retention_until TIMESTAMP WITH TIME ZONE,
    is_encrypted BOOLEAN DEFAULT TRUE,
    encryption_key_id VARCHAR(100),
    download_count INTEGER DEFAULT 0,
    last_downloaded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 10. Audit logs (was V4)
CREATE TABLE IF NOT EXISTS jmp.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    user_id UUID REFERENCES jmp.users(id),
    tenant_id UUID,
    user_email VARCHAR(255),
    ip_address VARCHAR(50),
    user_agent VARCHAR(500),
    old_values JSONB,
    new_values JSONB,
    metadata JSONB,
    severity VARCHAR(20) DEFAULT 'INFO',
    error_message VARCHAR(1000),
    success BOOLEAN DEFAULT TRUE,
    processing_time_ms BIGINT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 11. Identity providers (was V5)
CREATE TABLE IF NOT EXISTS jmp.identity_providers (
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

-- 12. Participant assignments (was V9)
CREATE TABLE IF NOT EXISTS jmp.participant_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conference_id UUID NOT NULL REFERENCES jmp.conferences(id) ON DELETE CASCADE,
    user_id UUID REFERENCES jmp.users(id) ON DELETE SET NULL,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'PARTICIPANT' CHECK (role IN ('PARTICIPANT', 'MODERATOR', 'PRESENTER')),
    status VARCHAR(50) NOT NULL DEFAULT 'INVITED' CHECK (status IN ('INVITED', 'ACCEPTED', 'DECLINED', 'JOINED', 'REMOVED')),
    require_auth BOOLEAN DEFAULT true,
    invited_at TIMESTAMPTZ,
    responded_at TIMESTAMPTZ,
    joined_at TIMESTAMPTZ,
    left_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(conference_id, email)
);

-- 13. Assignment audit log (was V9)
CREATE TABLE IF NOT EXISTS jmp.assignment_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conference_id UUID NOT NULL REFERENCES jmp.conferences(id),
    actor_id UUID NOT NULL REFERENCES jmp.users(id),
    action VARCHAR(100) NOT NULL,
    target_user_id UUID,
    target_email VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON jmp.users(email) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_tenant ON jmp.users(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_status ON jmp.users(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_external_auth ON jmp.users(external_auth_provider, external_auth_id) WHERE external_auth_id IS NOT NULL;

-- Tenants indexes
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON jmp.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_domain ON jmp.tenants(domain);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON jmp.tenants(status);

-- Conferences indexes
CREATE INDEX IF NOT EXISTS idx_conferences_tenant ON jmp.conferences(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_conferences_status ON jmp.conferences(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_conferences_created_by ON jmp.conferences(created_by) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_conferences_scheduled ON jmp.conferences(scheduled_start_at, scheduled_end_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_conferences_room_name ON jmp.conferences(room_name, tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_conferences_type ON jmp.conferences(type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_conferences_access_policy ON jmp.conferences(access_policy);
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_conference_room ON jmp.conferences(room_name, tenant_id) WHERE deleted_at IS NULL;

-- Conference participants indexes
CREATE INDEX IF NOT EXISTS idx_participants_conference ON jmp.conference_participants(conference_id);
CREATE INDEX IF NOT EXISTS idx_participants_user ON jmp.conference_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_participants_status ON jmp.conference_participants(status);

-- Recordings indexes
CREATE INDEX IF NOT EXISTS idx_recordings_conference ON jmp.recordings(conference_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_recordings_tenant ON jmp.recordings(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_recordings_status ON jmp.recordings(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_recordings_retention ON jmp.recordings(retention_until) WHERE retention_until IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_recordings_created ON jmp.recordings(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_recordings_tenant_status ON jmp.recordings(tenant_id, status) WHERE deleted_at IS NULL;

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON jmp.audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON jmp.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON jmp.audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON jmp.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON jmp.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_created ON jmp.audit_logs(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_success ON jmp.audit_logs(success) WHERE success = FALSE;

-- Identity providers indexes
CREATE INDEX IF NOT EXISTS idx_identity_providers_tenant ON jmp.identity_providers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_identity_providers_enabled ON jmp.identity_providers(tenant_id, enabled);
CREATE UNIQUE INDEX IF NOT EXISTS idx_identity_providers_tenant_name ON jmp.identity_providers(tenant_id, name);

-- Participant assignments indexes
CREATE INDEX IF NOT EXISTS idx_participant_assignments_conference_id ON jmp.participant_assignments(conference_id);
CREATE INDEX IF NOT EXISTS idx_participant_assignments_user_id ON jmp.participant_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_participant_assignments_email ON jmp.participant_assignments(email);
CREATE INDEX IF NOT EXISTS idx_participant_assignments_status ON jmp.participant_assignments(status);

-- Assignment audit log indexes
CREATE INDEX IF NOT EXISTS idx_assignment_audit_log_conference_id ON jmp.assignment_audit_log(conference_id);
CREATE INDEX IF NOT EXISTS idx_assignment_audit_log_actor_id ON jmp.assignment_audit_log(actor_id);

-- =============================================
-- COMMENTS
-- =============================================
COMMENT ON TABLE jmp.tenants IS 'Organizations/tenants in the multi-tenant platform';
COMMENT ON TABLE jmp.users IS 'Platform users with tenant-scoped identity';
COMMENT ON TABLE jmp.roles IS 'RBAC roles with hierarchy support';
COMMENT ON TABLE jmp.permissions IS 'Fine-grained permissions for ABAC';
COMMENT ON TABLE jmp.conferences IS 'Jitsi video conference rooms';
COMMENT ON TABLE jmp.conference_participants IS 'Participants in conferences';
COMMENT ON TABLE jmp.recordings IS 'Conference recordings with S3 storage integration';
COMMENT ON TABLE jmp.audit_logs IS 'Audit trail for all system events';
COMMENT ON TABLE jmp.identity_providers IS 'SSO/OIDC identity provider configurations';
COMMENT ON TABLE jmp.participant_assignments IS 'Pre-assigned conference participants with access control';
COMMENT ON TABLE jmp.assignment_audit_log IS 'Audit trail for participant assignment changes';
COMMENT ON COLUMN jmp.conferences.type IS 'Type of conference: SCHEDULED (with fixed time) or PERMANENT (always available)';
