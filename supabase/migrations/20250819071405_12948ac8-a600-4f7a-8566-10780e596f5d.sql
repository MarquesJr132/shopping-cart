-- Enable RLS on the request number counters table
ALTER TABLE public.request_number_counters ENABLE ROW LEVEL SECURITY;

-- Create policy to allow the function to access the counters
-- Only the generate_request_number function should access this table
CREATE POLICY "Allow function access to counters" 
ON public.request_number_counters 
FOR ALL 
USING (true) 
WITH CHECK (true);