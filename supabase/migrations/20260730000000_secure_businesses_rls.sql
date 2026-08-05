-- =============================================================================
-- SECURE BUSINESSES TABLE RLS
-- 
-- BEFORE APPLYING: 
-- 1. Add SUPABASE_SERVICE_ROLE_KEY to environment
-- 2. Create a Supabase Edge Function "upsert-business" that:
--    - Runs with service_role
--    - Accepts place_id
--    - Fetches data from Google Places API
--    - Upserts to businesses table
-- 3. Update queueless.functions.ts to call the Edge Function
--    instead of directly using supabase.from('businesses').upsert()
-- =============================================================================

-- Step 1: Remove permissive policies
DROP POLICY IF EXISTS "Anyone can add businesses" ON public.businesses;
DROP POLICY IF EXISTS "Anyone can update business metadata" ON public.businesses;

-- Step 2: Allow INSERT/UPDATE only via service role (Edge Functions)
-- This blocks anon/authenticated users from direct INSERT/UPDATE
CREATE POLICY "Businesses INSERT restricted to service role" ON public.businesses
  FOR INSERT TO service_role
  WITH CHECK (true);

CREATE POLICY "Businesses UPDATE restricted to service role" ON public.businesses
  FOR UPDATE TO service_role
  USING (true)
  WITH CHECK (true);

-- SELECT remains public (anyone can view businesses)
-- Note: The existing "Businesses are publicly readable" policy remains

-- =============================================================================
-- VERIFICATION QUERY - Run this to check policies after applying:
-- SELECT policyname, cmd, permissive, roles, qual, with_check
-- FROM pg_policies 
-- WHERE tablename = 'businesses';
-- =============================================================================
