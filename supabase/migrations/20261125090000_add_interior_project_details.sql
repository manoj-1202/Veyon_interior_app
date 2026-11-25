ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS site_address TEXT,
  ADD COLUMN IF NOT EXISTS site_contact_name TEXT,
  ADD COLUMN IF NOT EXISTS site_contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS measurement_date DATE,
  ADD COLUMN IF NOT EXISTS installation_date DATE,
  ADD COLUMN IF NOT EXISTS project_stage TEXT NOT NULL DEFAULT 'approved';

ALTER TABLE public.invoices
  ADD CONSTRAINT invoices_project_stage_check CHECK (project_stage IN (
    'site_measurement',
    'quotation_sent',
    'approved',
    'in_production',
    'ready_for_installation',
    'installation_scheduled',
    'completed'
  ));

ALTER TABLE public.invoice_items
  ADD COLUMN IF NOT EXISTS width_mm NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS height_mm NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS profile_series TEXT,
  ADD COLUMN IF NOT EXISTS glass_specification TEXT,
  ADD COLUMN IF NOT EXISTS finish TEXT,
  ADD COLUMN IF NOT EXISTS hardware_specification TEXT,
  ADD COLUMN IF NOT EXISTS installation_included BOOLEAN NOT NULL DEFAULT TRUE;
