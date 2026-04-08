-- Update existing tenants with NULL jitsi_domain to use a default value
-- This ensures backward compatibility for tenants created before jitsi_domain was required

UPDATE jmp.tenants 
SET jitsi_domain = 'meet.jit.si' 
WHERE jitsi_domain IS NULL OR jitsi_domain = '';
