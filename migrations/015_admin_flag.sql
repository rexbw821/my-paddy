-- migrations/015_admin_flag.sql
-- Run this in your Supabase SQL Editor

-- 1. Add is_admin column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- 2. Update RLS policies to allow admins to see everything
-- Since Supabase RLS policies are additive, we add new policies for admins.

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

-- Allow admins to update any profile (e.g., to promote others)
CREATE POLICY "Admins can update any profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated 
USING (
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

-- Note: You need to set your first admin account manually:
-- UPDATE profiles SET is_admin = true WHERE email = 'YOUR_EMAIL';
-- OR
-- UPDATE profiles SET is_admin = true WHERE id = 'YOUR_USER_ID';
