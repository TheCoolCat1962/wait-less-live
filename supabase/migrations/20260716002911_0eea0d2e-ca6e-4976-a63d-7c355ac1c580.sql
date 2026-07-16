
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS primary_type text;

ALTER TABLE public.wait_reports
  ADD COLUMN IF NOT EXISTS comment text,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'quick';

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'wait_reports_source_check'
  ) THEN
    ALTER TABLE public.wait_reports
      ADD CONSTRAINT wait_reports_source_check
      CHECK (source IN ('quick','exact','timer'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS wait_reports_business_created_idx
  ON public.wait_reports (business_id, created_at DESC);
