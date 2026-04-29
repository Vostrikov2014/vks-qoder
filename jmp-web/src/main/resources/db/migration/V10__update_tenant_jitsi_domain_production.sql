-- Update jitsi_domain for all tenants to point to production Jitsi instance
-- Previously set to 'localhost:8000' in seed data (V2) or 'meet.jit.si' in V7
UPDATE jmp.tenants
SET jitsi_domain = 'a.slamx.ru/jitsi'
WHERE jitsi_domain IN ('localhost:8000', 'meet.jit.si', 'localhost');
