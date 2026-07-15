
CREATE TABLE public.businesses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  google_place_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  category TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.businesses TO anon, authenticated;
GRANT ALL ON public.businesses TO service_role;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Businesses are publicly readable" ON public.businesses FOR SELECT USING (true);
CREATE POLICY "Anyone can add businesses" ON public.businesses FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update business metadata" ON public.businesses FOR UPDATE USING (true) WITH CHECK (true);

CREATE INDEX businesses_lat_lng_idx ON public.businesses (lat, lng);

CREATE TABLE public.wait_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  minutes INTEGER NOT NULL CHECK (minutes >= 0 AND minutes <= 240),
  reporter_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.wait_reports TO anon, authenticated;
GRANT ALL ON public.wait_reports TO service_role;
ALTER TABLE public.wait_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Wait reports are publicly readable" ON public.wait_reports FOR SELECT USING (true);
CREATE POLICY "Anyone can submit wait reports" ON public.wait_reports FOR INSERT WITH CHECK (true);

CREATE INDEX wait_reports_business_created_idx ON public.wait_reports (business_id, created_at DESC);
