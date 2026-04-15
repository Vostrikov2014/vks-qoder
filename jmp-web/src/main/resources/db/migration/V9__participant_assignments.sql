-- Add access policy columns to conferences
ALTER TABLE jmp.conferences ADD COLUMN access_policy VARCHAR(50) NOT NULL DEFAULT 'PUBLIC'
    CHECK (access_policy IN ('PUBLIC', 'ASSIGNED_ONLY', 'DOMAIN_RESTRICTED'));
ALTER TABLE jmp.conferences ADD COLUMN allowed_domain VARCHAR(255);
ALTER TABLE jmp.conferences ADD COLUMN waiting_room_enabled BOOLEAN DEFAULT false;
ALTER TABLE jmp.conferences ADD COLUMN require_auth_for_assigned BOOLEAN DEFAULT true;

-- Participant assignments table
CREATE TABLE jmp.participant_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conference_id UUID NOT NULL REFERENCES jmp.conferences(id) ON DELETE CASCADE,
    user_id UUID REFERENCES jmp.users(id) ON DELETE SET NULL,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'PARTICIPANT' CHECK (role IN ('PARTICIPANT', 'MODERATOR', 'PRESENTER')),
    status VARCHAR(50) NOT NULL DEFAULT 'INVITED' CHECK (status IN ('INVITED', 'ACCEPTED', 'DECLINED', 'JOINED', 'REMOVED')),
    require_auth BOOLEAN DEFAULT true,
    invited_at TIMESTAMPTZ,
    responded_at TIMESTAMPTZ,
    joined_at TIMESTAMPTZ,
    left_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(conference_id, email)
);

-- Assignment audit log
CREATE TABLE jmp.assignment_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conference_id UUID NOT NULL REFERENCES jmp.conferences(id),
    actor_id UUID NOT NULL REFERENCES jmp.users(id),
    action VARCHAR(100) NOT NULL,
    target_user_id UUID,
    target_email VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_participant_assignments_conference_id ON jmp.participant_assignments(conference_id);
CREATE INDEX idx_participant_assignments_user_id ON jmp.participant_assignments(user_id);
CREATE INDEX idx_participant_assignments_email ON jmp.participant_assignments(email);
CREATE INDEX idx_participant_assignments_status ON jmp.participant_assignments(status);
CREATE INDEX idx_assignment_audit_log_conference_id ON jmp.assignment_audit_log(conference_id);
CREATE INDEX idx_assignment_audit_log_actor_id ON jmp.assignment_audit_log(actor_id);
CREATE INDEX idx_conferences_access_policy ON jmp.conferences(access_policy);
