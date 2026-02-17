
-- Trigger function to prevent role changes after onboarding
CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- If the old role is NOT NULL, block the update (role already set)
  -- Exception: allow admins (via service role) to change roles
  IF OLD.role IS NOT NULL AND NEW.role IS DISTINCT FROM OLD.role THEN
    -- Check if this is a service_role call (admin action)
    IF current_setting('role', true) = 'service_role' THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Role cannot be changed after onboarding';
  END IF;
  RETURN NEW;
END;
$$;

-- Attach trigger to user_roles table
CREATE TRIGGER enforce_role_immutability
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_role_change();
