-- Update user_roles table to allow users to update their own role during onboarding
-- Remove the default value so new users start without a role
ALTER TABLE public.user_roles 
ALTER COLUMN role DROP DEFAULT;

-- Add UPDATE policy for users to set their own role if currently NULL
CREATE POLICY "Users can set their own role during onboarding"
ON public.user_roles
FOR UPDATE
USING (auth.uid() = user_id AND role IS NULL)
WITH CHECK (auth.uid() = user_id);

-- Update the trigger to not assign a default role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  
  -- Check if role was provided in metadata, otherwise skip role assignment
  IF NEW.raw_user_meta_data ->> 'role' IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, (NEW.raw_user_meta_data ->> 'role')::app_role);
  ELSE
    -- Create a user_roles entry with NULL role (will be set during onboarding)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, NULL);
  END IF;
  
  RETURN NEW;
END;
$function$;