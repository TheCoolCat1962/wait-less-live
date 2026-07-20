-- Add performance indexes for QueueLess search and query optimization

-- Index for geographic queries (lat/lng range searches)
CREATE INDEX IF NOT EXISTS businesses_lat_lng_idx_optimized
  ON public.businesses (lat, lng)
  WHERE lat IS NOT NULL AND lng IS NOT NULL;

-- Index for category filtering
CREATE INDEX IF NOT EXISTS businesses_category_idx
  ON public.businesses (category)
  WHERE category IS NOT NULL;

-- Index for primary_type filtering (used by search ranking)
CREATE INDEX IF NOT EXISTS businesses_primary_type_idx
  ON public.businesses (primary_type)
  WHERE primary_type IS NOT NULL;

-- Index for city filtering
CREATE INDEX IF NOT EXISTS businesses_city_idx
  ON public.businesses (city)
  WHERE city IS NOT NULL;

-- Index for name searches (partial text search optimization)
CREATE INDEX IF NOT EXISTS businesses_name_idx
  ON public.businesses USING btree (name);

-- Index for Google Place ID lookups (used during upsert)
CREATE INDEX IF NOT EXISTS businesses_google_place_id_idx
  ON public.businesses (google_place_id);

-- Index for wait reports by business and recency (used in aggregation)
CREATE INDEX IF NOT EXISTS wait_reports_business_created_idx_optimized
  ON public.wait_reports (business_id, created_at DESC)
  WHERE created_at > now() - interval '90 minutes';

-- Index for finding recent reports across all businesses
CREATE INDEX IF NOT EXISTS wait_reports_created_idx
  ON public.wait_reports (created_at DESC)
  WHERE created_at > now() - interval '90 minutes';

-- Index for reporter key lookups (to track user contributions)
CREATE INDEX IF NOT EXISTS wait_reports_reporter_key_idx
  ON public.wait_reports (reporter_key)
  WHERE reporter_key IS NOT NULL;

-- Composite index for efficient search result ranking
CREATE INDEX IF NOT EXISTS businesses_search_ranking_idx
  ON public.businesses (category, lat, lng)
  WHERE category IS NOT NULL AND lat IS NOT NULL AND lng IS NOT NULL;

-- Index for updated_at to support cache invalidation
CREATE INDEX IF NOT EXISTS businesses_updated_at_idx
  ON public.businesses (updated_at DESC);
