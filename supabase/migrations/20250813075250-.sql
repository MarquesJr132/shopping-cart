-- Add user_id column to shopping_cart_items table to associate cart items with users
ALTER TABLE public.shopping_cart_items 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Set user_id to NOT NULL after adding the column
ALTER TABLE public.shopping_cart_items 
ALTER COLUMN user_id SET NOT NULL;

-- Drop existing overly permissive RLS policies
DROP POLICY IF EXISTS "Users can delete cart items" ON public.shopping_cart_items;
DROP POLICY IF EXISTS "Users can insert cart items" ON public.shopping_cart_items;
DROP POLICY IF EXISTS "Users can update cart items" ON public.shopping_cart_items;
DROP POLICY IF EXISTS "Users can view all cart items" ON public.shopping_cart_items;

-- Create secure RLS policies that restrict access to user's own cart items only
CREATE POLICY "Users can view their own cart items" 
ON public.shopping_cart_items 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cart items" 
ON public.shopping_cart_items 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cart items" 
ON public.shopping_cart_items 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cart items" 
ON public.shopping_cart_items 
FOR DELETE 
USING (auth.uid() = user_id);