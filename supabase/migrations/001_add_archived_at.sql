-- Migration: Add archived_at column to campaigns table
-- Run this if you already have the database set up

-- Add archived_at column
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- Add index for archived_at
CREATE INDEX IF NOT EXISTS idx_campaigns_archived ON campaigns(archived_at);

-- Update RLS policies
DROP POLICY IF EXISTS "Public can view active campaigns" ON campaigns;
CREATE POLICY "Public can view active campaigns"
ON campaigns FOR SELECT
USING (is_active = true AND archived_at IS NULL);

-- Update campaign_stats view
CREATE OR REPLACE VIEW campaign_stats AS
SELECT
    c.*,
    CASE
        WHEN c.goal_amount > 0
        THEN ROUND((c.collected_amount / c.goal_amount * 100)::numeric, 0)
        ELSE 0
    END as percentage,
    CASE
        WHEN c.archived_at IS NOT NULL THEN 'archived'
        WHEN c.end_date IS NOT NULL AND c.end_date < NOW() THEN 'ended'
        WHEN c.is_active = false THEN 'inactive'
        ELSE 'active'
    END as status
FROM campaigns c;
