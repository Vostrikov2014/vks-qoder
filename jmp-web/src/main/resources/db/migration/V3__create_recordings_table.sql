-- Create recordings table
-- Per specification §5.6, §16.1-16.10

CREATE TABLE jmp.recordings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conference_id UUID NOT NULL REFERENCES jmp.conferences(id),
    tenant_id UUID NOT NULL REFERENCES jmp.tenants(id),
    recording_key VARCHAR(255) NOT NULL UNIQUE,
    original_filename VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    recording_type VARCHAR(20) NOT NULL DEFAULT 'VIDEO',
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_seconds BIGINT,
    file_size_bytes BIGINT,
    file_hash_sha256 VARCHAR(64),
    mime_type VARCHAR(50),
    resolution_width INTEGER,
    resolution_height INTEGER,
    thumbnail_key VARCHAR(255),
    transcription JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    retention_until TIMESTAMP WITH TIME ZONE,
    is_encrypted BOOLEAN DEFAULT TRUE,
    encryption_key_id VARCHAR(100),
    download_count INTEGER DEFAULT 0,
    last_downloaded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_recordings_conference ON jmp.recordings(conference_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_recordings_tenant ON jmp.recordings(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_recordings_status ON jmp.recordings(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_recordings_retention ON jmp.recordings(retention_until) WHERE retention_until IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_recordings_created ON jmp.recordings(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_recordings_tenant_status ON jmp.recordings(tenant_id, status) WHERE deleted_at IS NULL;

-- Add comment
COMMENT ON TABLE jmp.recordings IS 'Conference recordings with S3 storage integration';
