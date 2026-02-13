
-- Create table for CSV import history
CREATE TABLE public.csv_import_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  profiles_count INTEGER NOT NULL DEFAULT 0,
  errors_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'success',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.csv_import_history ENABLE ROW LEVEL SECURITY;

-- Only admins can view and insert
CREATE POLICY "Admins can view import history"
  ON public.csv_import_history
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert import history"
  ON public.csv_import_history
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
