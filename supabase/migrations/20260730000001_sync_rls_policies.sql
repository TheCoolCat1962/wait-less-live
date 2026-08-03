-- =============================================================================
-- RLS POLICY ALIGNMENT MIGRATION
-- 
-- IMPORTANT: Run this migration via Supabase Dashboard SQL Editor or CLI
-- 
-- Background:
-- - The original migration files define permissive policies (WITH CHECK true)
-- - REST API testing shows the actual database denies INSERT/UPDATE/DELETE for anon
-- - This migration removes the misleading permissive policies
-- =============================================================================

BEGIN;

-- =============================================================================
-- BUSINESSES TABLE
-- =============================================================================

-- Remove permissive policies (they don't match actual DB state)
DROP POLICY IF EXISTS "Anyone can add businesses" ON public.businesses;
DROP POLICY IF EXISTS "Anyone can update business metadata" ON public.businesses;

-- Ensure SELECT is public (this is intentional - businesses are publicly viewable)
DROP POLICY IF EXISTS "Businesses are publicly readable" ON public.businesses;
CREATE POLICY "Businesses are publicly readable" 
  ON public.businesses FOR SELECT 
  USING (true);

-- INSERT: Block direct INSERT for anon/authenticated users
-- Application inserts happen via server functions with proper validation
DROP POLICY IF EXISTS "Businesses direct INSERT blocked" ON public.businesses;
CREATE POLICY "Businesses direct INSERT blocked" 
  ON public.businesses FOR INSERT 
  WITH CHECK (false);

-- UPDATE: Block direct UPDATE for anon/authenticated users
DROP POLICY IF EXISTS "Businesses direct UPDATE blocked" ON public.businesses;
CREATE POLICY "Businesses direct UPDATE blocked" 
  ON public.businesses FOR UPDATE 
  USING (false);

-- DELETE: Block direct DELETE (businesses should not be deleted)
DROP POLICY IF EXISTS "Businesses direct DELETE blocked" ON public.businesses;
CREATE POLICY "Businesses direct DELETE blocked" 
  ON public.businesses FOR DELETE 
  USING (false);

-- =============================================================================
-- WAIT_REPORTS TABLE
-- =============================================================================

-- Remove permissive policy
DROP POLICY IF EXISTS "Anyone can submit wait reports" ON public.wait_reports;

-- Ensure SELECT is public (wait times are publicly viewable)
DROP POLICY IF EXISTS "Wait reports are publicly readable" ON public.wait_reports;
CREATE POLICY "Wait reports are publicly readable" 
  ON public.wait_reports FOR SELECT 
  USING (true);

-- INSERT: Block direct INSERT for anon/authenticated users
-- Application inserts happen via submitWaitReport server function
DROP POLICY IF EXISTS "Wait reports direct INSERT blocked" ON public.wait_reports;
CREATE POLICY "Wait reports direct INSERT blocked" 
  ON public.wait_reports FOR INSERT 
  WITH CHECK (false);

COMMIT;

-- =============================================================================
-- VERIFICATION: Run this query to verify policies after applying
-- =============================================================================
-- SELECT 
--   tablename,
--   policyname,
--   cmd,
--   permissive,
--   CASE WHEN cmd = 'SELECT' THEN qual ELSE NULL END as using_expr,
--   CASE WHEN cmd IN ('INSERT', 'UPDATE', 'DELETE') THEN with_check ELSE NULL END as with_check_expr
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND tablename IN ('businesses', 'wait_reports')
-- ORDER BY tablename, cmd;
