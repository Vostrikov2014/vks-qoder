-- Add test users for each role
-- Per specification §15.1-15.7

-- Create moderator user (password: moderator123)
INSERT INTO jmp.users (id, email, first_name, last_name, password_hash, status, email_verified, tenant_id)
VALUES (
    'cccccccc-cccc-cccc-cccc-ccccccccccc3',
    'moderator@jmp.local',
    'Conference',
    'Moderator',
    '$2a$12$w.Z7RqtptzG/Ji9PojejuOW43W5ryp9pHdrG/bIM8OEPZPIWNxEoe',
    'ACTIVE',
    true,
    '11111111-1111-1111-1111-111111111111'
);

-- Assign MODERATOR role to moderator user
INSERT INTO jmp.user_roles (user_id, role_id) VALUES
    ('cccccccc-cccc-cccc-cccc-ccccccccccc3', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3');

-- Create participant user (password: participant123)
INSERT INTO jmp.users (id, email, first_name, last_name, password_hash, status, email_verified, tenant_id)
VALUES (
    'cccccccc-cccc-cccc-cccc-ccccccccccc4',
    'participant@jmp.local',
    'Conference',
    'Participant',
    '$2a$12$vyfJlOffZapnExTHgC0Hwumz9TW2Xfd3aHbMugiHAidHUfoM06Bre',
    'ACTIVE',
    true,
    '11111111-1111-1111-1111-111111111111'
);

-- Assign PARTICIPANT role to participant user
INSERT INTO jmp.user_roles (user_id, role_id) VALUES
    ('cccccccc-cccc-cccc-cccc-ccccccccccc4', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4');

-- Create auditor user (password: auditor123)
INSERT INTO jmp.users (id, email, first_name, last_name, password_hash, status, email_verified, tenant_id)
VALUES (
    'cccccccc-cccc-cccc-cccc-ccccccccccc5',
    'auditor@jmp.local',
    'System',
    'Auditor',
    '$2a$12$ao5eZS0FVhpGU74a3Gaw2OGhSFcpRJuwFQ5cybCF8VmhJhZlFOUgG',
    'ACTIVE',
    true,
    '11111111-1111-1111-1111-111111111111'
);

-- Assign AUDITOR role to auditor user
INSERT INTO jmp.user_roles (user_id, role_id) VALUES
    ('cccccccc-cccc-cccc-cccc-ccccccccccc5', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb5');
