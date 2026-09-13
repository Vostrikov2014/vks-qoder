-- Permanent, revocable join links for conferences.
--
-- Replaces the previous behaviour where a shareable URL was assembled on the fly
-- as "<jitsiDomain>/<roomName>?jwt=<4-hour token>". Such a link expired together
-- with its token and could not be revoked, and — because it jumped straight to
-- Jitsi — bypassed the conference access policy entirely.
--
-- A conference link now stores only an unguessable slug. The URL
-- "https://<jmp-host>/j/<slug>" is stable and is served by the JMP SPA, which
-- calls GET /api/v1/join/{slug} to evaluate access and to mint a short-lived
-- Jitsi JWT at click time.
--
-- NOTE: the application runs with jpa.hibernate.ddl-auto=validate, so every
-- constraint declared on the ConferenceLink entity must be mirrored here.
CREATE TABLE IF NOT EXISTS jmp.conference_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conference_id UUID NOT NULL REFERENCES jmp.conferences(id) ON DELETE CASCADE,
    slug VARCHAR(32) NOT NULL,
    label VARCHAR(100),
    role VARCHAR(20) NOT NULL DEFAULT 'PARTICIPANT'
        CHECK (role IN ('PARTICIPANT', 'MODERATOR')),
    created_by UUID NOT NULL REFERENCES jmp.users(id),
    expires_at TIMESTAMP WITH TIME ZONE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    visit_count INTEGER NOT NULL DEFAULT 0,
    last_visited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_conference_links_slug UNIQUE (slug)
);

-- Supports "list links of a conference" and the lazy creation of the primary link.
CREATE INDEX IF NOT EXISTS idx_conference_links_conference
    ON jmp.conference_links (conference_id);
