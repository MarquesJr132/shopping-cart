-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('user', 'manager', 'procurement');

-- Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  manager_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create shopping cart items table
CREATE TABLE public.shopping_cart_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_code TEXT NOT NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL CHECK (quantity > 0),
  unit TEXT NOT NULL CHECK (unit IN ('Kg', 'Liter', 'Unit', 'Piece', 'Box', 'Meter')),
  unit_price DECIMAL(10,2),
  total_price DECIMAL(10,2),
  supplier TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create shopping cart requests table
CREATE TABLE public.shopping_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_number TEXT NOT NULL UNIQUE,
  requester_id UUID NOT NULL REFERENCES public.profiles(id),
  request_type TEXT NOT NULL CHECK (request_type IN ('service', 'material')),
  delivery_date DATE,
  preferred_supplier TEXT,
  client_name TEXT,
  client_id TEXT,
  justification TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'completed', 'cancelled')),
  total_amount DECIMAL(12,2) DEFAULT 0,
  manager_approval_id UUID REFERENCES public.profiles(id),
  manager_approved_at TIMESTAMP WITH TIME ZONE,
  manager_comments TEXT,
  procurement_handled_by UUID REFERENCES public.profiles(id),
  procurement_completed_at TIMESTAMP WITH TIME ZONE,
  procurement_notes TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on shopping requests
ALTER TABLE public.shopping_requests ENABLE ROW LEVEL SECURITY;

-- Create junction table for request items
CREATE TABLE public.request_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.shopping_requests(id) ON DELETE CASCADE,
  item_code TEXT NOT NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL CHECK (quantity > 0),
  unit TEXT NOT NULL,
  unit_price DECIMAL(10,2),
  total_price DECIMAL(10,2),
  supplier TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on request items
ALTER TABLE public.request_items ENABLE ROW LEVEL SECURITY;

-- Create function to generate request numbers
CREATE OR REPLACE FUNCTION generate_request_number()
RETURNS TEXT AS $$
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
$$ LANGUAGE plpgsql;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shopping_requests_updated_at
  BEFORE UPDATE ON public.shopping_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies for profiles
CREATE POLICY "Users can view all profiles" 
  ON public.profiles 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for shopping requests
CREATE POLICY "Users can view their own requests and requests they can manage" 
  ON public.shopping_requests 
  FOR SELECT 
  USING (
    requester_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
    manager_approval_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.user_id = auth.uid() AND p.role = 'procurement'
    )
  );

CREATE POLICY "Users can insert their own requests" 
  ON public.shopping_requests 
  FOR INSERT 
  WITH CHECK (requester_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update requests they own or manage" 
  ON public.shopping_requests 
  FOR UPDATE 
  USING (
    requester_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
    manager_approval_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.user_id = auth.uid() AND p.role = 'procurement'
    )
  );

-- Create RLS policies for request items
CREATE POLICY "Users can view items for requests they can access" 
  ON public.request_items 
  FOR SELECT 
  USING (
    request_id IN (
      SELECT sr.id FROM public.shopping_requests sr
      JOIN public.profiles p ON sr.requester_id = p.id
      WHERE p.user_id = auth.uid()
      OR sr.manager_approval_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.profiles p2 
        WHERE p2.user_id = auth.uid() AND p2.role = 'procurement'
      )
    )
  );

CREATE POLICY "Users can insert items for their own requests" 
  ON public.request_items 
  FOR INSERT 
  WITH CHECK (
    request_id IN (
      SELECT sr.id FROM public.shopping_requests sr
      JOIN public.profiles p ON sr.requester_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update items for requests they can manage" 
  ON public.request_items 
  FOR UPDATE 
  USING (
    request_id IN (
      SELECT sr.id FROM public.shopping_requests sr
      JOIN public.profiles p ON sr.requester_id = p.id
      WHERE p.user_id = auth.uid()
      OR sr.manager_approval_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.profiles p2 
        WHERE p2.user_id = auth.uid() AND p2.role = 'procurement'
      )
    )
  );

CREATE POLICY "Users can delete items for requests they own" 
  ON public.request_items 
  FOR DELETE 
  USING (
    request_id IN (
      SELECT sr.id FROM public.shopping_requests sr
      JOIN public.profiles p ON sr.requester_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );