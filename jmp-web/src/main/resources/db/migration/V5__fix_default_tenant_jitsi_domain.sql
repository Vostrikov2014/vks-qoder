-- The seeded default tenant carried a Jitsi address with a path prefix
-- ('meet.slamx.ru/jitsi') from the layout where the web UI was served under
-- /jitsi. The contour now serves Jitsi at the root of its host (APP_PREFIX is
-- empty in docker-compose.yml), so such a prefix builds room URLs that do not
-- exist and every join link of this tenant fails.
--
-- tenant.jitsi_domain overrides jitsi.domain of the backend (see
-- JitsiLinkBuilder), therefore resetting it to NULL restores the single
-- "switch" the rest of the configuration follows: JITSI_DOMAIN of the backend
-- decides the address (meet.slamx.ru in production, localhost:8000 locally).
UPDATE jmp.tenants
SET jitsi_domain = NULL
WHERE id = '11111111-1111-1111-1111-111111111111'
  AND jitsi_domain = 'meet.slamx.ru/jitsi';
