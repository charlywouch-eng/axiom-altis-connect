
-- Add import_id to talent_profiles to link profiles to their import
ALTER TABLE public.talent_profiles ADD COLUMN import_id uuid REFERENCES public.csv_import_history(id) ON DELETE CASCADE;

-- Allow admins to delete from csv_import_history (cascade will delete linked talent_profiles)
CREATE POLICY "Admins can delete import history"
ON public.csv_import_history
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete talent_profiles
CREATE POLICY "Admins can delete talent_profiles"
ON public.talent_profiles
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to insert talent_profiles (for CSV import)
CREATE POLICY "Admins can insert talent_profiles"
ON public.talent_profiles
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
