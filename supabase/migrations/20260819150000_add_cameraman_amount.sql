-- Internal-only tracking amount. It is deliberately separate from invoice totals.
ALTER TABLE public.invoices
ADD COLUMN cameraman_amount DECIMAL(12, 2) NOT NULL DEFAULT 0
CHECK (cameraman_amount >= 0);
