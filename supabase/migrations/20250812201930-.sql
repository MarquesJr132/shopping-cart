-- Add cost center field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN cost_center TEXT;