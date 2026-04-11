-- Add test users for each role
-- Per specification §15.1-15.7

-- Create moderator user (password: moderator123)
INSERT INTO jmp.users (id, email, first_name, last_name, password_hash, status, email_verified, tenant_id)
VALUES (
    'cccccccc-cccc-cccc-cccc-ccccccccccc3',
    'moderator@jmp.local',
    'Conference',
    'Moderator',
    '$2b$12$CVhjbYi4OFz/EnRwmtHPIOpVzEnQTqJFwG9leyF7G4Gp.2xKB11QO',
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
    '$2b$12$HnNbH.FRZgJQHydvBTz6QeoHkNJJvQH3W.ymEYCUgmIYfcCpu8Zpm',
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
    '$2b$12$Quqp5d5OoWcQtirQop1yMeNKlo.cXy3ntKcByKLAV6LAqreB9mG1W',
    'ACTIVE',
    true,
    '11111111-1111-1111-1111-111111111111'
);

-- Assign AUDITOR role to auditor user
INSERT INTO jmp.user_roles (user_id, role_id) VALUES
    ('cccccccc-cccc-cccc-cccc-ccccccccccc5', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb5');
