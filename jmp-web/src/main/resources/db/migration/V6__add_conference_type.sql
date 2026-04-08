-- Add conference type column to distinguish between scheduled and permanent rooms
-- Per specification §5.3

-- Add type column with default value 'SCHEDULED'
ALTER TABLE jmp.conferences 
    ADD COLUMN IF NOT EXISTS type VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED';

-- Add index for type filtering
CREATE INDEX IF NOT EXISTS idx_conferences_type 
    ON jmp.conferences(type) 
    WHERE deleted_at IS NULL;

-- Add comment
COMMENT ON COLUMN jmp.conferences.type IS 'Type of conference: SCHEDULED (with fixed time) or PERMANENT (always available)';
