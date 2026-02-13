CREATE POLICY "Admins can update import history"
  ON public.csv_import_history
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));