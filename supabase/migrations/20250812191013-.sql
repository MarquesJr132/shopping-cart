-- Update the handle_new_user function to properly handle the user_role enum
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Create profile for new user
  INSERT INTO public.profiles (user_id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'User'),
    CASE 
      WHEN NEW.email = 'admin@admin.com' THEN 'admin'::public.user_role
      ELSE 'user'::public.user_role
    END
  );
  RETURN NEW;
END;
$function$;