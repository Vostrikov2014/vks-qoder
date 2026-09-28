-- Jitsi moved from its own host (https://meet.slamx.ru) to a path prefix on the platform
-- host (https://a.slamx.ru/meet-legacy), and that host no longer has a listener at all: the
-- server block was dropped from nginx-proxy.conf. A tenants.jitsi_domain still naming it
-- wins over the backend property (JitsiLinkBuilder.jitsiBaseUrl), so such a row would keep
-- producing dead room URLs with nothing in the logs to explain why.
--
-- Cleared to NULL rather than rewritten to 'a.slamx.ru/meet-legacy' on purpose: the per-tenant
-- value is meant for a tenant that really lives on another Jitsi address. Copying the
-- global address into every row would only recreate, one level down, the drift this column
-- is supposed to avoid — the new address then has to be updated in two places. With NULL the
-- single switch stays JITSI_DOMAIN / jitsi.domain, which V5 established for the default
-- tenant already.
UPDATE jmp.tenants
SET jitsi_domain = NULL
WHERE lower(jitsi_domain) LIKE '%meet.slamx.ru%';
