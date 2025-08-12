-- Create admin user with email admin@admin.com and profile
-- First, create the admin user in auth.users table through a migration
-- Note: In production, you would create this through Supabase Auth Admin API

-- Insert a sample admin profile (this will be created when admin signs up)
-- For now, we'll create a trigger to handle this automatically

-- Create function to handle new user creation and assign admin role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile for new user
  INSERT INTO public.profiles (user_id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'User'),
    CASE 
      WHEN NEW.email = 'admin@admin.com' THEN 'admin'::user_role
      ELSE 'user'::user_role
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add admin role to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin';