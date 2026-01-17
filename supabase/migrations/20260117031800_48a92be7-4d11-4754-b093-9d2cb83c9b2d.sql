-- Create a function to call the edge function when a lead is inserted
CREATE OR REPLACE FUNCTION public.notify_new_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  edge_function_url text;
  response_status integer;
BEGIN
  -- Only notify for new leads with a state
  IF NEW.state IS NOT NULL THEN
    -- Call edge function asynchronously using pg_net if available
    -- For now, we'll rely on the frontend to call the function
    -- This trigger just logs the event
    RAISE LOG 'New lead inserted: % in state %', NEW.name, NEW.state;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new leads
DROP TRIGGER IF EXISTS on_lead_created ON public.leads;
CREATE TRIGGER on_lead_created
  AFTER INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_lead();