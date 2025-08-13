-- Drop all the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Managers can view their direct reports" ON public.profiles;
DROP POLICY IF EXISTS "Procurement can view profiles for workflow" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view basic profile info for business purposes" ON public.profiles;

-- Create a security definer function to get current user's role safely
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role::text FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create a security definer function to get current user's profile ID safely
CREATE OR REPLACE FUNCTION public.get_current_user_profile_id()
RETURNS UUID AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create safe RLS policies using security definer functions

-- 1. Users can always view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- 2. Managers can view profiles of their direct reports
CREATE POLICY "Managers can view their direct reports" 
ON public.profiles 
FOR SELECT 
USING (manager_id = public.get_current_user_profile_id());

-- 3. Procurement users can view all profiles for workflow management
CREATE POLICY "Procurement can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.get_current_user_role() = 'procurement');

-- 4. Admin users can view all profiles for user management
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.get_current_user_role() = 'admin');