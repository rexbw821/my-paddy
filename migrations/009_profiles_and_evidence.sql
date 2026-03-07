-- migrations/009_profiles_and_evidence.sql
-- Run this in your Supabase SQL Editor

-- 1. Create Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    reputation_score INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- 2. Create Evidence Table
CREATE TABLE IF NOT EXISTS evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
    uploader_id UUID REFERENCES profiles(id),
    file_url TEXT NOT NULL,
    file_type TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on evidence
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Evidence viewable by everyone" ON evidence
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can upload evidence" ON evidence
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = uploader_id);

-- 3. Link Reports to Profiles (Reporter Id)
-- Note: reporter_id column might already exist, linking it now
ALTER TABLE reports 
    ADD CONSTRAINT fk_reporter 
    FOREIGN KEY (reporter_id) REFERENCES profiles(id);
