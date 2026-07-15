import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type RefreshResult = {
  updated: number;
  skipped: number;
  errors: string[];
  results: Array<{ symbol: string; asset_class: string; price: number; currency: string; source: string }>;
};

// Refreshes cached prices for all holdings the user owns that have a symbol.
// Uses Finnhub for stock/etf and CoinGecko for crypto. Caches results in `holding_prices`.
export const refreshPortfolioPrices = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<RefreshResult> => {
    const { fetchFinnhubQuote, fetchCoinGeckoQuote, fetchIndianApiQuote, convert } = await import("./prices.server");

    const { data: holdings, error } = await context.supabase
      .from("holdings")
      .select("symbol, asset_class, currency")
      .not("symbol", "is", null);
    if (error) throw new Error(error.message);

    // Unique keys
    const seen = new Set<string>();
    const targets: Array<{ symbol: string; asset_class: string; currency: string }> = [];
    for (const h of holdings ?? []) {
      const s = (h.symbol ?? "").trim();
      if (!s) continue;
      const key = `${s}:${h.asset_class}`;
      if (seen.has(key)) continue;
      seen.add(key);
      targets.push({ symbol: s, asset_class: h.asset_class, currency: h.currency ?? "USD" });
    }

    const errors: string[] = [];
    const results: RefreshResult["results"] = [];
    let updated = 0;
    let skipped = 0;

    for (const t of targets) {
      try {
        let quote = null;
        if (t.asset_class === "crypto") {
          quote = await fetchCoinGeckoQuote(t.symbol, t.currency.toLowerCase());
        } else if (t.asset_class === "stock" || t.asset_class === "etf") {
          quote = await fetchFinnhubQuote(t.symbol);
        } else {
          skipped++;
          continue;
        }

        if (!quote) {
          skipped++;
          errors.push(`${t.symbol}: no price`);
          continue;
        }

        // Convert to holding's currency
        let priceInHoldingCcy = quote.price;
        if (quote.currency !== t.currency) {
          priceInHoldingCcy = await convert(quote.price, quote.currency, t.currency);
        }

        const { error: upErr } = await context.supabase
          .from("holding_prices")
          .upsert(
            {
              symbol: t.symbol,
              asset_class: t.asset_class,
              price: priceInHoldingCcy,
              currency: t.currency,
              fetched_at: new Date().toISOString(),
            },
            { onConflict: "symbol,asset_class" },
          );
        if (upErr) {
          errors.push(`${t.symbol}: ${upErr.message}`);
          continue;
        }
        updated++;
        results.push({
          symbol: t.symbol,
          asset_class: t.asset_class,
          price: priceInHoldingCcy,
          currency: t.currency,
          source: quote.source,
        });
      } catch (e) {
        errors.push(`${t.symbol}: ${e instanceof Error ? e.message : "failed"}`);
      }
    }

    return { updated, skipped, errors, results };
  });
