-- Jitsi Management Platform - Initial Schema Migration
-- Per specification §9.1-9.10

-- Create schema
CREATE SCHEMA IF NOT EXISTS jmp;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tenants table
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

-- Permissions table
CREATE TABLE IF NOT EXISTS jmp.permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    resource_type VARCHAR(30) NOT NULL,
    action VARCHAR(20) NOT NULL,
    is_system_permission BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Roles table
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

-- Role permissions junction table
CREATE TABLE IF NOT EXISTS jmp.role_permissions (
    role_id UUID NOT NULL REFERENCES jmp.roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES jmp.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- Users table
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
    tenant_id UUID NOT NULL REFERENCES jmp.tenants(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- User roles junction table
CREATE TABLE IF NOT EXISTS jmp.user_roles (
    user_id UUID NOT NULL REFERENCES jmp.users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES jmp.roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- Conferences table
CREATE TABLE IF NOT EXISTS jmp.conferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    tenant_id UUID NOT NULL REFERENCES jmp.tenants(id),
    created_by UUID NOT NULL REFERENCES jmp.users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
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
    jitsi_options JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Conference participants table
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON jmp.users(email) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_tenant ON jmp.users(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_status ON jmp.users(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_tenants_slug ON jmp.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_domain ON jmp.tenants(domain);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON jmp.tenants(status);

CREATE INDEX IF NOT EXISTS idx_conferences_tenant ON jmp.conferences(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_conferences_status ON jmp.conferences(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_conferences_created_by ON jmp.conferences(created_by) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_conferences_scheduled ON jmp.conferences(scheduled_start_at, scheduled_end_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_conferences_room_name ON jmp.conferences(room_name, tenant_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_participants_conference ON jmp.conference_participants(conference_id);
CREATE INDEX IF NOT EXISTS idx_participants_user ON jmp.conference_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_participants_status ON jmp.conference_participants(status);

-- Unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_conference_room 
    ON jmp.conferences(room_name, tenant_id) 
    WHERE deleted_at IS NULL;

-- Comments
COMMENT ON TABLE jmp.tenants IS 'Organizations/tenants in the multi-tenant platform';
COMMENT ON TABLE jmp.users IS 'Platform users with tenant-scoped identity';
COMMENT ON TABLE jmp.roles IS 'RBAC roles with hierarchy support';
COMMENT ON TABLE jmp.permissions IS 'Fine-grained permissions for ABAC';
COMMENT ON TABLE jmp.conferences IS 'Jitsi video conference rooms';
COMMENT ON TABLE jmp.conference_participants IS 'Participants in conferences';
