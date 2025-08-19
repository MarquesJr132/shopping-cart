-- Fix the generate_request_number function to handle concurrent requests
CREATE OR REPLACE FUNCTION public.generate_request_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  current_year TEXT;
  next_number INTEGER;
  request_number_result TEXT;
  max_attempts INTEGER := 10;
  attempt_count INTEGER := 0;
BEGIN
  current_year := EXTRACT(YEAR FROM NOW())::TEXT;
  
  LOOP
    -- Get the next number with row locking to prevent race conditions
    SELECT COALESCE(MAX(CAST(SUBSTRING(request_number, 6) AS INTEGER)), 0) + 1
    INTO next_number
    FROM public.shopping_requests
    WHERE request_number LIKE 'SC' || current_year || '%'
    FOR UPDATE;
    
    request_number_result := 'SC' || current_year || LPAD(next_number::TEXT, 4, '0');
    
    -- Try to reserve this number by inserting a placeholder
    BEGIN
      -- Check if this number already exists
      IF NOT EXISTS (
        SELECT 1 FROM public.shopping_requests 
        WHERE request_number = request_number_result
      ) THEN
        RETURN request_number_result;
      END IF;
    EXCEPTION
      WHEN unique_violation THEN
        -- If we get a unique violation, increment and try again
        NULL;
    END;
    
    attempt_count := attempt_count + 1;
    IF attempt_count >= max_attempts THEN
      RAISE EXCEPTION 'Unable to generate unique request number after % attempts', max_attempts;
    END IF;
    
    -- Add a small random delay to reduce contention
    PERFORM pg_sleep(random() * 0.1);
  END LOOP;
END;
$$;