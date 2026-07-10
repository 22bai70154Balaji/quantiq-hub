export type Country = "IN" | "US" | "AE";

export const COUNTRIES: Record<Country, { name: string; currency: string; symbol: string; flag: string; locale: string }> = {
  IN: { name: "India", currency: "INR", symbol: "₹", flag: "🇮🇳", locale: "en-IN" },
  US: { name: "United States", currency: "USD", symbol: "$", flag: "🇺🇸", locale: "en-US" },
  AE: { name: "UAE", currency: "AED", symbol: "د.إ", flag: "🇦🇪", locale: "en-AE" },
};

export function formatMoney(amount: number, country: Country = "IN", opts: Intl.NumberFormatOptions = {}) {
  const { locale, currency } = COUNTRIES[country];
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
    ...opts,
  }).format(isFinite(amount) ? amount : 0);
}

export function formatNumber(amount: number, country: Country = "IN") {
  return new Intl.NumberFormat(COUNTRIES[country].locale, { maximumFractionDigits: 2 }).format(
    isFinite(amount) ? amount : 0,
  );
}
