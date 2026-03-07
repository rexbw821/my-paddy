-- 1. Ensure the profiles table has a safe default for reputation_score
ALTER TABLE public.profiles
  ALTER COLUMN reputation_score SET DEFAULT 0;

-- 2. Enable Realtime for profiles so the UI updates instantly after sign-up
-- (Run in Supabase Dashboard → Database → Replication → profiles table → tick enabled)

-- 3. Ensure existing auth.users who don't have a profile row get one
-- (Backfill for any user created before the trigger was added)
INSERT INTO public.profiles (id, full_name, reputation_score)
SELECT
  u.id,
  u.raw_user_meta_data->>'full_name',
  0
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 4. Verify the trigger is in place
-- Expected output: 1 row named "on_auth_user_created"
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
