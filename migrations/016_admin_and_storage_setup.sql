-- ============================================
-- ADMIN SETUP - Run this in Supabase SQL Editor
-- ============================================
-- Step 1: Add the is_admin column (safe to re-run)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
-- Step 2: Grant yourself admin access (kofisolo20@gmail.com)
UPDATE profiles
SET is_admin = true
WHERE id = (
        SELECT id
        FROM auth.users
        WHERE email = 'kofisolo20@gmail.com'
    );
-- Step 3: Confirm it worked (should return 1 row with is_admin = true)
SELECT id,
    full_name,
    is_admin
FROM profiles
WHERE id = (
        SELECT id
        FROM auth.users
        WHERE email = 'kofisolo20@gmail.com'
    );
-- ============================================
-- STORAGE PERMISSIONS (run if not done yet)
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('evidence', 'evidence', true) ON CONFLICT (id) DO NOTHING;
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE policyname = 'Public Access'
        AND tablename = 'objects'
) THEN CREATE POLICY "Public Access" ON storage.objects FOR
SELECT USING (bucket_id = 'evidence');
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE policyname = 'Authenticated users can upload evidence'
        AND tablename = 'objects'
) THEN CREATE POLICY "Authenticated users can upload evidence" ON storage.objects FOR
INSERT TO authenticated WITH CHECK (
        bucket_id = 'evidence'
        AND (storage.foldername(name)) [1] = auth.uid()::text
    );
END IF;
END $$;