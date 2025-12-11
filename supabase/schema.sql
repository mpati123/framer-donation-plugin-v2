-- LupusUrsus Donations - Supabase Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CAMPAIGNS TABLE
-- ============================================
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Basic info
    title TEXT NOT NULL,
    description TEXT,
    excerpt TEXT,
    image_url TEXT,
    images JSONB DEFAULT '[]'::jsonb, -- Array of additional image URLs

    -- Campaign details
    beneficiary TEXT,
    goal_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    collected_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    donations_count INTEGER NOT NULL DEFAULT 0,

    -- Status
    is_active BOOLEAN DEFAULT true,
    end_date TIMESTAMPTZ,
    archived_at TIMESTAMPTZ, -- NULL = not archived, timestamp = archived

    -- Display settings
    progress_style TEXT DEFAULT 'default', -- default, striped, animated, gradient
    progress_color TEXT DEFAULT '#4CAF50',
    show_donors BOOLEAN DEFAULT true,

    -- External link (optional - for campaigns hosted elsewhere)
    external_url TEXT,

    -- SEO
    slug TEXT UNIQUE
);

-- ============================================
-- MIGRATIONS (run these if tables already exist)
-- ============================================
-- If you already have the tables and need to add missing columns, run:
--
-- ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS external_url TEXT;
-- ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;
-- ALTER TABLE donations ADD COLUMN IF NOT EXISTS stripe_payment_intent TEXT;
-- ALTER TABLE donations ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT false;
-- CREATE INDEX IF NOT EXISTS idx_donations_stripe_payment_intent ON donations(stripe_payment_intent);

-- ============================================
-- DONATIONS TABLE
-- ============================================
CREATE TABLE donations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Campaign relation
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,

    -- Donation details
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'PLN',

    -- Donor info
    donor_name TEXT,
    donor_email TEXT,
    message TEXT,
    is_anonymous BOOLEAN DEFAULT false,

    -- Payment info
    stripe_session_id TEXT,
    stripe_payment_intent TEXT,
    status TEXT DEFAULT 'pending', -- pending, completed, failed, refunded

    -- Metadata
    ip_address TEXT,
    user_agent TEXT
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_campaigns_is_active ON campaigns(is_active);
CREATE INDEX idx_campaigns_slug ON campaigns(slug);
CREATE INDEX idx_campaigns_archived ON campaigns(archived_at);
CREATE INDEX idx_donations_campaign_id ON donations(campaign_id);
CREATE INDEX idx_donations_status ON donations(status);
CREATE INDEX idx_donations_stripe_session ON donations(stripe_session_id);
CREATE INDEX idx_donations_stripe_payment_intent ON donations(stripe_payment_intent);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update campaign totals
CREATE OR REPLACE FUNCTION update_campaign_totals()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Recalculate for the campaign
        UPDATE campaigns
        SET
            collected_amount = COALESCE((
                SELECT SUM(amount)
                FROM donations
                WHERE campaign_id = NEW.campaign_id
                AND status = 'completed'
            ), 0),
            donations_count = (
                SELECT COUNT(*)
                FROM donations
                WHERE campaign_id = NEW.campaign_id
                AND status = 'completed'
            ),
            updated_at = NOW()
        WHERE id = NEW.campaign_id;
    END IF;

    IF TG_OP = 'DELETE' THEN
        UPDATE campaigns
        SET
            collected_amount = COALESCE((
                SELECT SUM(amount)
                FROM donations
                WHERE campaign_id = OLD.campaign_id
                AND status = 'completed'
            ), 0),
            donations_count = (
                SELECT COUNT(*)
                FROM donations
                WHERE campaign_id = OLD.campaign_id
                AND status = 'completed'
            ),
            updated_at = NOW()
        WHERE id = OLD.campaign_id;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update campaign totals
CREATE TRIGGER trigger_update_campaign_totals
AFTER INSERT OR UPDATE OR DELETE ON donations
FOR EACH ROW
EXECUTE FUNCTION update_campaign_totals();

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_campaigns_updated_at
BEFORE UPDATE ON campaigns
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- Campaigns: anyone can read active, non-archived campaigns
CREATE POLICY "Public can view active campaigns"
ON campaigns FOR SELECT
USING (is_active = true AND archived_at IS NULL);

-- Campaigns: service role can do everything (for admin API)
CREATE POLICY "Service role has full access to campaigns"
ON campaigns FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Donations: anyone can view completed donations for active campaigns
CREATE POLICY "Public can view completed donations"
ON donations FOR SELECT
USING (
    status = 'completed'
    AND EXISTS (
        SELECT 1 FROM campaigns
        WHERE campaigns.id = donations.campaign_id
        AND campaigns.is_active = true
        AND campaigns.archived_at IS NULL
    )
);

-- Donations: service role can do everything
CREATE POLICY "Service role has full access to donations"
ON donations FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- VIEWS
-- ============================================
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

-- ============================================
-- SAMPLE DATA (optional)
-- ============================================
/*
INSERT INTO campaigns (title, description, beneficiary, goal_amount, slug) VALUES
('Operacja dla Burka', 'Burek potrzebuje pilnej operacji biodra. Pomóżmy mu wrócić do zdrowia!', 'Burek - 5-letni kundelek', 5000, 'operacja-dla-burka'),
('Karma na zimę', 'Zbieramy na karmę dla zwierząt w schronisku na zimowe miesiące.', 'Schronisko Przyjaciel', 10000, 'karma-na-zime');
*/
