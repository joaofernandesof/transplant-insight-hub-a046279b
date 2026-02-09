-- Create the trigger that was missing
CREATE TRIGGER generate_reminders_on_appointment
  AFTER INSERT OR UPDATE ON public.avivar_appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_reminders_for_appointment();
