-- Phase 1: extend saved_calculations for shareable analysis reports
ALTER TABLE public.saved_calculations
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS share_slug text UNIQUE,
  ADD COLUMN IF NOT EXISTS report_id text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS ai_insights jsonb;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_saved_calculations_share_slug
  ON public.saved_calculations (share_slug)
  WHERE share_slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_saved_calculations_user_created
  ON public.saved_calculations (user_id, created_at DESC);

-- Keep updated_at fresh
DROP TRIGGER IF EXISTS trg_saved_calculations_touch_updated ON public.saved_calculations;
CREATE TRIGGER trg_saved_calculations_touch_updated
  BEFORE UPDATE ON public.saved_calculations
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Grants (idempotent, safe to re-run)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_calculations TO authenticated;
GRANT SELECT ON public.saved_calculations TO anon;
GRANT ALL ON public.saved_calculations TO service_role;

-- Public read policy: only rows explicitly marked public are visible to anon,
-- and only when accessed by share_slug (RLS applies to any SELECT that returns those rows).
DROP POLICY IF EXISTS "public shared calcs are readable" ON public.saved_calculations;
CREATE POLICY "public shared calcs are readable"
  ON public.saved_calculations
  FOR SELECT
  TO anon, authenticated
  USING (is_public = true AND share_slug IS NOT NULL);
