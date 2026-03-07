-- ==========================================================
-- EMERGENCY FIX + COMPLETE SETUP
-- Run this in Supabase SQL Editor. Run it in ONE go.
-- ==========================================================
-- ── STEP 1: Add is_admin column (safe repeat) ──
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
-- ── STEP 2: Drop the BAD recursive policies from 015 that broke everything ──
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
-- ── STEP 3: Ensure basic, SAFE profile policies exist ──
-- Everyone can read profiles (needed for auth to work)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR
SELECT USING (true);
-- Users can update only their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR
UPDATE TO authenticated USING (auth.uid() = id);
-- ── STEP 4: Set is_admin = true for kofisolo20@gmail.com ──
UPDATE public.profiles
SET is_admin = true
WHERE id = (
        SELECT id
        FROM auth.users
        WHERE email = 'kofisolo20@gmail.com'
    );
-- ── STEP 5: Verify - should return your row with is_admin = true ──
SELECT id,
    full_name,
    is_admin
FROM public.profiles
WHERE id = (
        SELECT id
        FROM auth.users
        WHERE email = 'kofisolo20@gmail.com'
    );
-- ── STEP 6: Fix report insertion policy ──
DROP POLICY IF EXISTS "Allow anyone to submit reports" ON public.reports;
CREATE POLICY "Allow anyone to submit reports" ON public.reports FOR
INSERT TO authenticated WITH CHECK (
        auth.uid() = reporter_id
        OR reporter_id IS NULL
    );
-- ── STEP 7: Storage bucket + policies ──
INSERT INTO storage.buckets (id, name, public)
VALUES ('evidence', 'evidence', true) ON CONFLICT (id) DO
UPDATE
SET public = true;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR
SELECT USING (bucket_id = 'evidence');
DROP POLICY IF EXISTS "Authenticated users can upload evidence" ON storage.objects;
CREATE POLICY "Authenticated users can upload evidence" ON storage.objects FOR
INSERT TO authenticated WITH CHECK (
        bucket_id = 'evidence'
        AND (storage.foldername(name)) [1] = auth.uid()::text
    );