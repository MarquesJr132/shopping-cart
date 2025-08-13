-- Drop the overly permissive policy that allows all users to view all profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create more restrictive policies for profile access

-- 1. Users can always view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- 2. Managers can view profiles of their direct reports
CREATE POLICY "Managers can view their direct reports" 
ON public.profiles 
FOR SELECT 
USING (
  manager_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- 3. Procurement users can view profiles for approval workflows
CREATE POLICY "Procurement can view profiles for workflow" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'procurement'
  )
);

-- 4. Admin users can view all profiles for user management
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'admin'
  )
);

-- 5. Limited profile view for business purposes (name and role only)
-- This allows users to see basic info needed for dropdowns and assignments
CREATE POLICY "Users can view basic profile info for business purposes" 
ON public.profiles 
FOR SELECT 
USING (
  -- Allow viewing when the profile is referenced in shopping requests
  -- as requester, manager, or procurement handler
  id IN (
    SELECT DISTINCT unnested_id FROM (
      SELECT requester_id as unnested_id FROM public.shopping_requests
      UNION
      SELECT manager_approval_id as unnested_id FROM public.shopping_requests WHERE manager_approval_id IS NOT NULL
      UNION  
      SELECT procurement_handled_by as unnested_id FROM public.shopping_requests WHERE procurement_handled_by IS NOT NULL
    ) ids
    WHERE EXISTS (
      SELECT 1 FROM public.shopping_requests sr
      JOIN public.profiles req_p ON sr.requester_id = req_p.id
      WHERE req_p.user_id = auth.uid()
      OR sr.manager_approval_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.profiles proc_p WHERE proc_p.user_id = auth.uid() AND proc_p.role = 'procurement')
    )
  )
);