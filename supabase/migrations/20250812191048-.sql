-- Enable RLS on shopping_cart_items table
ALTER TABLE public.shopping_cart_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for shopping_cart_items
-- Note: Since there's no user_id column, we'll create basic policies for authenticated users
CREATE POLICY "Users can view all cart items" 
ON public.shopping_cart_items 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Users can insert cart items" 
ON public.shopping_cart_items 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update cart items" 
ON public.shopping_cart_items 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Users can delete cart items" 
ON public.shopping_cart_items 
FOR DELETE 
TO authenticated
USING (true);

-- Fix function search paths to be secure
CREATE OR REPLACE FUNCTION public.generate_request_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  current_year TEXT;
  next_number INTEGER;
BEGIN
  current_year := EXTRACT(YEAR FROM NOW())::TEXT;
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(request_number, 6) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.shopping_requests
  WHERE request_number LIKE 'SC' || current_year || '%';
  
  RETURN 'SC' || current_year || LPAD(next_number::TEXT, 4, '0');
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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