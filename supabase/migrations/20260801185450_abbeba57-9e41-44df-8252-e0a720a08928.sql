-- businesses: remove permissive public write policies
DROP POLICY IF EXISTS "Anyone can add businesses" ON public.businesses;
DROP POLICY IF EXISTS "Anyone can update business metadata" ON public.businesses;
DROP POLICY IF EXISTS "Anyone can insert businesses" ON public.businesses;
DROP POLICY IF EXISTS "Anyone can update businesses" ON public.businesses;

-- wait_reports: remove permissive public insert policy
DROP POLICY IF EXISTS "Anyone can submit wait reports" ON public.wait_reports;
DROP POLICY IF EXISTS "Anyone can insert wait reports" ON public.wait_reports;

-- Writes now happen exclusively through trusted server code (service_role),
-- which validates input and enforces rate limiting / abuse checks.
REVOKE INSERT, UPDATE, DELETE ON public.businesses FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.wait_reports FROM anon, authenticated;

-- Public read access stays intact.
GRANT SELECT ON public.businesses TO anon, authenticated;
GRANT SELECT ON public.wait_reports TO anon, authenticated;
GRANT ALL ON public.businesses TO service_role;
GRANT ALL ON public.wait_reports TO service_role;