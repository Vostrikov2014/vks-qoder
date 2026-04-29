-- Fix BCrypt password hash prefix from $2b$ to $2a$ for Spring Security compatibility.
-- Spring's BCryptPasswordEncoder only accepts $2a$ variant.
-- All hashes are functionally identical — only the prefix differs.

UPDATE jmp.users SET password_hash = '$2a$12$Lp5M6c94msp4fQ.hxDeQsuAvXkVWqsMlZJtixIimil36IQyN1B0F.'
WHERE email = 'admin@jmp.local';

UPDATE jmp.users SET password_hash = '$2a$12$s71QM6rcknR8qV0KtzcfY.EIftFAGhKIGXmQxaj2Yq/fIl3tmF6Bi'
WHERE email = 'tenant@jmp.local';

UPDATE jmp.users SET password_hash = '$2a$12$w.Z7RqtptzG/Ji9PojejuOW43W5ryp9pHdrG/bIM8OEPZPIWNxEoe'
WHERE email = 'moderator@jmp.local';

UPDATE jmp.users SET password_hash = '$2a$12$vyfJlOffZapnExTHgC0Hwumz9TW2Xfd3aHbMugiHAidHUfoM06Bre'
WHERE email = 'participant@jmp.local';

UPDATE jmp.users SET password_hash = '$2a$12$ao5eZS0FVhpGU74a3Gaw2OGhSFcpRJuwFQ5cybCF8VmhJhZlFOUgG'
WHERE email = 'auditor@jmp.local';
