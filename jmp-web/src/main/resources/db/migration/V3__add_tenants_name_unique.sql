-- Add missing UNIQUE constraint on tenants.name
-- Matches Tenant entity @Column(unique = true) declaration
ALTER TABLE jmp.tenants ADD CONSTRAINT uk_tenants_name UNIQUE (name);
