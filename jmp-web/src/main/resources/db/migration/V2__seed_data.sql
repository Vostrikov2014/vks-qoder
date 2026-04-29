-- Jitsi Management Platform - Seed Data

-- Default tenant (with production jitsi_domain from the start)
INSERT INTO jmp.tenants (id, name, slug, description, status, domain, jitsi_domain, 
    max_concurrent_conferences, max_participants_per_conference, max_recording_storage_mb,
    max_conference_duration_minutes, allowed_features)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Default Tenant', 'default', 
     'Default tenant for initial setup', 'ACTIVE', 'a.slamx.ru', 'a.slamx.ru/jitsi',
     50, 100, 51200, 240, 'chat,screen_share,recording,live_streaming');

-- System permissions (21 total)
INSERT INTO jmp.permissions (id, name, description, resource_type, action, is_system_permission) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'user:create', 'Create users', 'USER', 'CREATE', true),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'user:read', 'Read user data', 'USER', 'READ', true),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'user:update', 'Update users', 'USER', 'UPDATE', true),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', 'user:delete', 'Delete users', 'USER', 'DELETE', true),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', 'user:list', 'List users', 'USER', 'LIST', true),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6', 'tenant:create', 'Create tenants', 'TENANT', 'CREATE', true),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa7', 'tenant:read', 'Read tenant data', 'TENANT', 'READ', true),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa8', 'tenant:update', 'Update tenants', 'TENANT', 'UPDATE', true),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa9', 'tenant:delete', 'Delete tenants', 'TENANT', 'DELETE', true),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa10', 'tenant:manage', 'Manage tenants', 'TENANT', 'MANAGE', true),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa11', 'conference:create', 'Create conferences', 'CONFERENCE', 'CREATE', true),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa12', 'conference:read', 'Read conference data', 'CONFERENCE', 'READ', true),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa13', 'conference:update', 'Update conferences', 'CONFERENCE', 'UPDATE', true),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa14', 'conference:delete', 'Delete conferences', 'CONFERENCE', 'DELETE', true),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa15', 'conference:manage', 'Manage conferences', 'CONFERENCE', 'MANAGE', true),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa16', 'recording:read', 'Read recordings', 'RECORDING', 'READ', true),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa17', 'recording:delete', 'Delete recordings', 'RECORDING', 'DELETE', true),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa18', 'recording:manage', 'Manage recordings', 'RECORDING', 'MANAGE', true),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa19', 'audit_log:read', 'Read audit logs', 'AUDIT_LOG', 'READ', true),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa20', 'audit_log:export', 'Export audit logs', 'AUDIT_LOG', 'READ', true),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa21', 'system:admin', 'Full system access', 'SYSTEM', 'ADMIN', true);

-- System roles (6 total)
INSERT INTO jmp.roles (id, name, description, role_type, is_system_role) VALUES
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'ROLE_SUPER_ADMIN', 'Super Administrator - Full access to all tenants', 'SUPER_ADMIN', true),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'ROLE_TENANT_ADMIN', 'Tenant Administrator - Manages users and settings within their organization', 'TENANT_ADMIN', true),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 'ROLE_MODERATOR', 'Moderator - Creates and manages conferences', 'MODERATOR', true),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4', 'ROLE_PARTICIPANT', 'Participant - Joins conferences', 'PARTICIPANT', true),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb5', 'ROLE_AUDITOR', 'Auditor - Read-only access to logs and reports', 'AUDITOR', true),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb6', 'ROLE_SERVICE_ACCOUNT', 'Service Account - For CI/CD and integrations', 'SERVICE_ACCOUNT', true);

-- SUPER_ADMIN gets all permissions
INSERT INTO jmp.role_permissions (role_id, permission_id)
SELECT 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', id FROM jmp.permissions;

-- TENANT_ADMIN permissions
INSERT INTO jmp.role_permissions (role_id, permission_id) VALUES
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa7'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa8'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa11'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa12'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa13'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa14'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa15'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa16'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa17'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa18'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa19'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa20');

-- MODERATOR permissions
INSERT INTO jmp.role_permissions (role_id, permission_id) VALUES
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa11'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa12'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa13'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa14'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa15'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa16');

-- PARTICIPANT permissions
INSERT INTO jmp.role_permissions (role_id, permission_id) VALUES
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa12'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa16');

-- AUDITOR permissions
INSERT INTO jmp.role_permissions (role_id, permission_id) VALUES
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb5', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb5', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb5', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa12'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb5', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa19'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb5', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa20');

-- ALL test users with correct $2a$ bcrypt hashes
-- Admin (password: admin123)
INSERT INTO jmp.users (id, email, first_name, last_name, password_hash, status, email_verified, tenant_id)
VALUES ('cccccccc-cccc-cccc-cccc-ccccccccccc1', 'admin@jmp.local', 'System', 'Administrator',
    '$2a$12$Lp5M6c94msp4fQ.hxDeQsuAvXkVWqsMlZJtixIimil36IQyN1B0F.', 'ACTIVE', true,
    '11111111-1111-1111-1111-111111111111');

-- Tenant admin (password: tenant123)
INSERT INTO jmp.users (id, email, first_name, last_name, password_hash, status, email_verified, tenant_id)
VALUES ('cccccccc-cccc-cccc-cccc-ccccccccccc2', 'tenant@jmp.local', 'Tenant', 'Administrator',
    '$2a$12$s71QM6rcknR8qV0KtzcfY.EIftFAGhKIGXmQxaj2Yq/fIl3tmF6Bi', 'ACTIVE', true,
    '11111111-1111-1111-1111-111111111111');

-- Moderator (password: moderator123)
INSERT INTO jmp.users (id, email, first_name, last_name, password_hash, status, email_verified, tenant_id)
VALUES ('cccccccc-cccc-cccc-cccc-ccccccccccc3', 'moderator@jmp.local', 'Conference', 'Moderator',
    '$2a$12$w.Z7RqtptzG/Ji9PojejuOW43W5ryp9pHdrG/bIM8OEPZPIWNxEoe', 'ACTIVE', true,
    '11111111-1111-1111-1111-111111111111');

-- Participant (password: participant123)
INSERT INTO jmp.users (id, email, first_name, last_name, password_hash, status, email_verified, tenant_id)
VALUES ('cccccccc-cccc-cccc-cccc-ccccccccccc4', 'participant@jmp.local', 'Conference', 'Participant',
    '$2a$12$vyfJlOffZapnExTHgC0Hwumz9TW2Xfd3aHbMugiHAidHUfoM06Bre', 'ACTIVE', true,
    '11111111-1111-1111-1111-111111111111');

-- Auditor (password: auditor123)
INSERT INTO jmp.users (id, email, first_name, last_name, password_hash, status, email_verified, tenant_id)
VALUES ('cccccccc-cccc-cccc-cccc-ccccccccccc5', 'auditor@jmp.local', 'System', 'Auditor',
    '$2a$12$ao5eZS0FVhpGU74a3Gaw2OGhSFcpRJuwFQ5cybCF8VmhJhZlFOUgG', 'ACTIVE', true,
    '11111111-1111-1111-1111-111111111111');

-- User role assignments
INSERT INTO jmp.user_roles (user_id, role_id) VALUES
    ('cccccccc-cccc-cccc-cccc-ccccccccccc1', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1'),
    ('cccccccc-cccc-cccc-cccc-ccccccccccc2', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2'),
    ('cccccccc-cccc-cccc-cccc-ccccccccccc3', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3'),
    ('cccccccc-cccc-cccc-cccc-ccccccccccc4', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4'),
    ('cccccccc-cccc-cccc-cccc-ccccccccccc5', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb5');
