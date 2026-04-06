-- Create audit_logs table
-- Per specification §17.1-17.10

CREATE TABLE jmp.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    user_id UUID REFERENCES jmp.users(id),
    tenant_id UUID,
    user_email VARCHAR(255),
    ip_address VARCHAR(50),
    user_agent VARCHAR(500),
    old_values JSONB,
    new_values JSONB,
    metadata JSONB,
    severity VARCHAR(20) DEFAULT 'INFO',
    error_message VARCHAR(1000),
    success BOOLEAN DEFAULT TRUE,
    processing_time_ms BIGINT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_audit_logs_tenant ON jmp.audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_user ON jmp.audit_logs(user_id);
CREATE INDEX idx_audit_logs_event_type ON jmp.audit_logs(event_type);
CREATE INDEX idx_audit_logs_entity ON jmp.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON jmp.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_tenant_created ON jmp.audit_logs(tenant_id, created_at DESC);
CREATE INDEX idx_audit_logs_success ON jmp.audit_logs(success) WHERE success = FALSE;

-- Add comment
COMMENT ON TABLE jmp.audit_logs IS 'Audit trail for all system events';
