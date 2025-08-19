-- Create a robust, concurrent-safe counter for request numbers
CREATE TABLE IF NOT EXISTS public.request_number_counters (
  year TEXT PRIMARY KEY,
  last_number INTEGER NOT NULL DEFAULT 0
);

-- Update generator to use atomic counter instead of scanning table
CREATE OR REPLACE FUNCTION public.generate_request_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  current_year TEXT;
  next_number INTEGER;
BEGIN
  current_year := EXTRACT(YEAR FROM NOW())::TEXT;

  -- Ensure the counter row exists for this year
  INSERT INTO public.request_number_counters (year, last_number)
  VALUES (current_year, 0)
  ON CONFLICT (year) DO NOTHING;

  -- Atomically increment and get the next number
  UPDATE public.request_number_counters
  SET last_number = last_number + 1
  WHERE year = current_year
  RETURNING last_number INTO next_number;

  RETURN 'SC' || current_year || LPAD(next_number::TEXT, 4, '0');
END;
$$;