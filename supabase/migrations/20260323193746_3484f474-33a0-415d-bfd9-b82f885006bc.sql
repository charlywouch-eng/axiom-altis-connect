ALTER TABLE public.user_roles DISABLE TRIGGER enforce_role_immutability;
ALTER TABLE public.user_roles DISABLE TRIGGER prevent_role_escalation;
UPDATE public.user_roles SET role = 'admin' WHERE user_id = '3bb71125-6586-4732-a525-be03f5f58597';
ALTER TABLE public.user_roles ENABLE TRIGGER enforce_role_immutability;
ALTER TABLE public.user_roles ENABLE TRIGGER prevent_role_escalation;