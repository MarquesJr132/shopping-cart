-- Create the user_role enum type
CREATE TYPE public.user_role AS ENUM ('admin', 'manager', 'procurement', 'user');

-- Update the profiles table to use the enum type (if it's not already using it)
-- This should already be set but we ensure it's properly configured
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'user'::user_role;