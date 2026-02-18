ALTER TABLE public.user_roles DISABLE TRIGGER enforce_role_immutability;
UPDATE public.user_roles SET role = 'entreprise' WHERE user_id = '1063ca72-ecbf-4112-93e2-f34cfafe85f1';
ALTER TABLE public.user_roles ENABLE TRIGGER enforce_role_immutability;
