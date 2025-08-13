-- Drop ALL existing policies on profiles table to start fresh
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Managers can view their direct reports" ON public.profiles;
DROP POLICY IF EXISTS "Procurement can view profiles for workflow" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view basic profile info for business purposes" ON public.profiles;
DROP POLICY IF EXISTS "Procurement can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create security definer functions to safely access profile data
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role::text FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_current_user_profile_id()
RETURNS UUID AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create new secure RLS policies
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Managers can view direct reports" 
ON public.profiles 
FOR SELECT 
USING (manager_id = public.get_current_user_profile_id());

CREATE POLICY "Procurement staff can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.get_current_user_role() = 'procurement');

CREATE POLICY "Admin staff can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.get_current_user_role() = 'admin');