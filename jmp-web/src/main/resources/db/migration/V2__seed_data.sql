-- Jitsi Management Platform - Seed Data
-- Per specification §15.1-15.7

-- Insert default tenant
INSERT INTO jmp.tenants (id, name, slug, description, status, domain, jitsi_domain, 
    max_concurrent_conferences, max_participants_per_conference, max_recording_storage_mb,
    max_conference_duration_minutes, allowed_features)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Default Tenant', 'default', 
     'Default tenant for initial setup', 'ACTIVE', 'localhost', 'localhost:8443',
     50, 100, 51200, 240, 'chat,screen_share,recording,live_streaming');

-- Insert system permissions
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

-- Insert system roles
INSERT INTO jmp.roles (id, name, description, role_type, is_system_role) VALUES
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'ROLE_SUPER_ADMIN', 'Super Administrator - Full access to all tenants', 'SUPER_ADMIN', true),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'ROLE_TENANT_ADMIN', 'Tenant Administrator - Manages users and settings within their organization', 'TENANT_ADMIN', true),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 'ROLE_MODERATOR', 'Moderator - Creates and manages conferences', 'MODERATOR', true),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4', 'ROLE_PARTICIPANT', 'Participant - Joins conferences', 'PARTICIPANT', true),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb5', 'ROLE_AUDITOR', 'Auditor - Read-only access to logs and reports', 'AUDITOR', true),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb6', 'ROLE_SERVICE_ACCOUNT', 'Service Account - For CI/CD and integrations', 'SERVICE_ACCOUNT', true);

-- Assign permissions to SUPER_ADMIN (all permissions)
INSERT INTO jmp.role_permissions (role_id, permission_id)
SELECT 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', id FROM jmp.permissions;

-- Assign permissions to TENANT_ADMIN
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

-- Assign permissions to MODERATOR
INSERT INTO jmp.role_permissions (role_id, permission_id) VALUES
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa11'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa12'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa13'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa14'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa15'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa16');

-- Assign permissions to PARTICIPANT
INSERT INTO jmp.role_permissions (role_id, permission_id) VALUES
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa12'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa16');

-- Assign permissions to AUDITOR
INSERT INTO jmp.role_permissions (role_id, permission_id) VALUES
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb5', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb5', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb5', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa12'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb5', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa19'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb5', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa20');

-- Create default admin user (password: admin123)
-- BCrypt hash for 'admin123' with cost 12
INSERT INTO jmp.users (id, email, first_name, last_name, password_hash, status, email_verified, tenant_id)
VALUES (
    'cccccccc-cccc-cccc-cccc-ccccccccccc1',
    'admin@jmp.local',
    'System',
    'Administrator',
    '$2b$12$VPNQzjvAzi8z.Wp5HlQwGuKzNE.NV5hjUPoKHfob6HcjM0crAKwGu',
    'ACTIVE',
    true,
    '11111111-1111-1111-1111-111111111111'
);

-- Assign SUPER_ADMIN role to admin user
INSERT INTO jmp.user_roles (user_id, role_id) VALUES
    ('cccccccc-cccc-cccc-cccc-ccccccccccc1', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1');

-- Create default tenant admin user (password: tenant123)
INSERT INTO jmp.users (id, email, first_name, last_name, password_hash, status, email_verified, tenant_id)
VALUES (
    'cccccccc-cccc-cccc-cccc-ccccccccccc2',
    'tenant@jmp.local',
    'Tenant',
    'Administrator',
    '$2b$12$4WTo7yr/0d29SuNm0y.P/euMWed9W5Ld29A5RjeQZdD18iCf6p6ZW',
    'ACTIVE',
    true,
    '11111111-1111-1111-1111-111111111111'
);

-- Assign TENANT_ADMIN role to tenant admin user
INSERT INTO jmp.user_roles (user_id, role_id) VALUES
    ('cccccccc-cccc-cccc-cccc-ccccccccccc2', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2');
