-- Enum types
DO $$ BEGIN
  CREATE TYPE public.nw_kind AS ENUM ('asset','liability');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.nw_category AS ENUM (
    'cash','investments','real_estate','other_asset',
    'loan','credit_card','other_liability'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.asset_class AS ENUM (
    'stock','etf','mutual_fund','crypto','gold','fd','bond','epf','ppf','nps'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 1. net_worth_entries
CREATE TABLE public.net_worth_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind public.nw_kind NOT NULL,
  category public.nw_category NOT NULL,
  label text NOT NULL,
  amount numeric(14,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'INR',
  as_of date NOT NULL DEFAULT current_date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.net_worth_entries TO authenticated;
GRANT ALL ON public.net_worth_entries TO service_role;
ALTER TABLE public.net_worth_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own net worth entries"
  ON public.net_worth_entries FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_nw_entries_user ON public.net_worth_entries(user_id, as_of DESC);

CREATE TRIGGER trg_nw_entries_updated
  BEFORE UPDATE ON public.net_worth_entries
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 2. holdings
CREATE TABLE public.holdings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_class public.asset_class NOT NULL,
  symbol text,
  name text NOT NULL,
  quantity numeric(18,6) NOT NULL DEFAULT 0,
  avg_cost numeric(18,4) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'INR',
  manual_price numeric(18,4),
  purchase_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.holdings TO authenticated;
GRANT ALL ON public.holdings TO service_role;
ALTER TABLE public.holdings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own holdings"
  ON public.holdings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_holdings_user ON public.holdings(user_id);

CREATE TRIGGER trg_holdings_updated
  BEFORE UPDATE ON public.holdings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 3. holding_prices (shared cache)
CREATE TABLE public.holding_prices (
  symbol text NOT NULL,
  asset_class public.asset_class NOT NULL,
  price numeric(18,4) NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  fetched_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (symbol, asset_class)
);

GRANT SELECT ON public.holding_prices TO authenticated;
GRANT ALL ON public.holding_prices TO service_role;
ALTER TABLE public.holding_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated can read prices"
  ON public.holding_prices FOR SELECT
  TO authenticated
  USING (true);