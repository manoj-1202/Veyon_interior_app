ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS sound_amount DECIMAL(12, 2) NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.invoices'::regclass
      AND conname = 'invoices_sound_amount_check'
  ) THEN
    ALTER TABLE public.invoices
    ADD CONSTRAINT invoices_sound_amount_check CHECK (sound_amount >= 0);
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
