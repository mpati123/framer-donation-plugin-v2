-- Migration: Add settings table for organization configuration
-- Run this in Supabase SQL Editor

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    logo_url TEXT DEFAULT '',
    organization_name TEXT DEFAULT '',
    primary_color TEXT DEFAULT '#e74c3c',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Policy: anyone can read settings (public)
CREATE POLICY "Public can view settings"
ON settings FOR SELECT
USING (true);

-- Policy: service role can do everything (for API with service_role_key)
CREATE POLICY "Service role full access"
ON settings FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');
