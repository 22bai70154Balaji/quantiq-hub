// Curated top-50 tickers per market. Refreshed by the team, not by an external screener.

export type CatalogEntry = {
  symbol: string;
  name: string;
  region: "US" | "IN";
  currency: string;
  sector: string;
  assumedReturn: number;
  logoDomain?: string;
};

export const US_TOP_50: CatalogEntry[] = [
  { symbol: "AAPL", name: "Apple Inc.", region: "US", currency: "USD", sector: "Technology", assumedReturn: 15, logoDomain: "apple.com" },
  { symbol: "MSFT", name: "Microsoft Corp.", region: "US", currency: "USD", sector: "Technology", assumedReturn: 14, logoDomain: "microsoft.com" },
  { symbol: "NVDA", name: "NVIDIA Corp.", region: "US", currency: "USD", sector: "Semiconductors", assumedReturn: 22, logoDomain: "nvidia.com" },
  { symbol: "GOOGL", name: "Alphabet Inc.", region: "US", currency: "USD", sector: "Technology", assumedReturn: 13, logoDomain: "abc.xyz" },
  { symbol: "AMZN", name: "Amazon.com Inc.", region: "US", currency: "USD", sector: "Consumer Discretionary", assumedReturn: 13, logoDomain: "amazon.com" },
  { symbol: "META", name: "Meta Platforms", region: "US", currency: "USD", sector: "Technology", assumedReturn: 15, logoDomain: "meta.com" },
  { symbol: "TSLA", name: "Tesla Inc.", region: "US", currency: "USD", sector: "Automobiles", assumedReturn: 18, logoDomain: "tesla.com" },
  { symbol: "BRK.B", name: "Berkshire Hathaway", region: "US", currency: "USD", sector: "Financials", assumedReturn: 10, logoDomain: "berkshirehathaway.com" },
  { symbol: "JPM", name: "JPMorgan Chase", region: "US", currency: "USD", sector: "Financials", assumedReturn: 10, logoDomain: "jpmorganchase.com" },
  { symbol: "V", name: "Visa Inc.", region: "US", currency: "USD", sector: "Financials", assumedReturn: 13, logoDomain: "visa.com" },
  { symbol: "MA", name: "Mastercard Inc.", region: "US", currency: "USD", sector: "Financials", assumedReturn: 14, logoDomain: "mastercard.com" },
  { symbol: "UNH", name: "UnitedHealth Group", region: "US", currency: "USD", sector: "Healthcare", assumedReturn: 12, logoDomain: "unitedhealthgroup.com" },
  { symbol: "XOM", name: "ExxonMobil", region: "US", currency: "USD", sector: "Energy", assumedReturn: 8, logoDomain: "exxonmobil.com" },
  { symbol: "LLY", name: "Eli Lilly and Co.", region: "US", currency: "USD", sector: "Healthcare", assumedReturn: 17, logoDomain: "lilly.com" },
  { symbol: "JNJ", name: "Johnson & Johnson", region: "US", currency: "USD", sector: "Healthcare", assumedReturn: 9, logoDomain: "jnj.com" },
  { symbol: "PG", name: "Procter & Gamble", region: "US", currency: "USD", sector: "Consumer Staples", assumedReturn: 9, logoDomain: "pg.com" },
  { symbol: "HD", name: "Home Depot", region: "US", currency: "USD", sector: "Retail", assumedReturn: 12, logoDomain: "homedepot.com" },
  { symbol: "COST", name: "Costco Wholesale", region: "US", currency: "USD", sector: "Retail", assumedReturn: 14, logoDomain: "costco.com" },
  { symbol: "AVGO", name: "Broadcom Inc.", region: "US", currency: "USD", sector: "Semiconductors", assumedReturn: 18, logoDomain: "broadcom.com" },
  { symbol: "ORCL", name: "Oracle Corp.", region: "US", currency: "USD", sector: "Technology", assumedReturn: 11, logoDomain: "oracle.com" },
  { symbol: "ADBE", name: "Adobe Inc.", region: "US", currency: "USD", sector: "Technology", assumedReturn: 13, logoDomain: "adobe.com" },
  { symbol: "CRM", name: "Salesforce Inc.", region: "US", currency: "USD", sector: "Technology", assumedReturn: 13, logoDomain: "salesforce.com" },
  { symbol: "NFLX", name: "Netflix Inc.", region: "US", currency: "USD", sector: "Communications", assumedReturn: 15, logoDomain: "netflix.com" },
  { symbol: "AMD", name: "Advanced Micro Devices", region: "US", currency: "USD", sector: "Semiconductors", assumedReturn: 20, logoDomain: "amd.com" },
  { symbol: "INTC", name: "Intel Corp.", region: "US", currency: "USD", sector: "Semiconductors", assumedReturn: 8, logoDomain: "intel.com" },
  { symbol: "PEP", name: "PepsiCo Inc.", region: "US", currency: "USD", sector: "Consumer Staples", assumedReturn: 9, logoDomain: "pepsico.com" },
  { symbol: "KO", name: "Coca-Cola Co.", region: "US", currency: "USD", sector: "Consumer Staples", assumedReturn: 8, logoDomain: "coca-cola.com" },
  { symbol: "MCD", name: "McDonald's Corp.", region: "US", currency: "USD", sector: "Restaurants", assumedReturn: 10, logoDomain: "mcdonalds.com" },
  { symbol: "SBUX", name: "Starbucks Corp.", region: "US", currency: "USD", sector: "Restaurants", assumedReturn: 10, logoDomain: "starbucks.com" },
  { symbol: "NKE", name: "Nike Inc.", region: "US", currency: "USD", sector: "Apparel", assumedReturn: 10, logoDomain: "nike.com" },
  { symbol: "DIS", name: "Walt Disney Co.", region: "US", currency: "USD", sector: "Media", assumedReturn: 9, logoDomain: "thewaltdisneycompany.com" },
  { symbol: "BAC", name: "Bank of America", region: "US", currency: "USD", sector: "Financials", assumedReturn: 9, logoDomain: "bankofamerica.com" },
  { symbol: "WFC", name: "Wells Fargo", region: "US", currency: "USD", sector: "Financials", assumedReturn: 8, logoDomain: "wellsfargo.com" },
  { symbol: "GS", name: "Goldman Sachs", region: "US", currency: "USD", sector: "Financials", assumedReturn: 11, logoDomain: "goldmansachs.com" },
  { symbol: "MS", name: "Morgan Stanley", region: "US", currency: "USD", sector: "Financials", assumedReturn: 10, logoDomain: "morganstanley.com" },
  { symbol: "CVX", name: "Chevron Corp.", region: "US", currency: "USD", sector: "Energy", assumedReturn: 8, logoDomain: "chevron.com" },
  { symbol: "PFE", name: "Pfizer Inc.", region: "US", currency: "USD", sector: "Healthcare", assumedReturn: 6, logoDomain: "pfizer.com" },
  { symbol: "ABBV", name: "AbbVie Inc.", region: "US", currency: "USD", sector: "Healthcare", assumedReturn: 11, logoDomain: "abbvie.com" },
  { symbol: "MRK", name: "Merck & Co.", region: "US", currency: "USD", sector: "Healthcare", assumedReturn: 9, logoDomain: "merck.com" },
  { symbol: "CSCO", name: "Cisco Systems", region: "US", currency: "USD", sector: "Networking", assumedReturn: 8, logoDomain: "cisco.com" },
  { symbol: "TMO", name: "Thermo Fisher", region: "US", currency: "USD", sector: "Life Sciences", assumedReturn: 12, logoDomain: "thermofisher.com" },
  { symbol: "ACN", name: "Accenture plc", region: "US", currency: "USD", sector: "IT Services", assumedReturn: 12, logoDomain: "accenture.com" },
  { symbol: "T", name: "AT&T Inc.", region: "US", currency: "USD", sector: "Telecom", assumedReturn: 5, logoDomain: "att.com" },
  { symbol: "VZ", name: "Verizon Communications", region: "US", currency: "USD", sector: "Telecom", assumedReturn: 5, logoDomain: "verizon.com" },
  { symbol: "PYPL", name: "PayPal Holdings", region: "US", currency: "USD", sector: "Financials", assumedReturn: 10, logoDomain: "paypal.com" },
  { symbol: "UBER", name: "Uber Technologies", region: "US", currency: "USD", sector: "Transportation", assumedReturn: 14, logoDomain: "uber.com" },
  { symbol: "ABNB", name: "Airbnb Inc.", region: "US", currency: "USD", sector: "Travel", assumedReturn: 14, logoDomain: "airbnb.com" },
  { symbol: "SHOP", name: "Shopify Inc.", region: "US", currency: "USD", sector: "E-commerce", assumedReturn: 16, logoDomain: "shopify.com" },
  { symbol: "QCOM", name: "Qualcomm Inc.", region: "US", currency: "USD", sector: "Semiconductors", assumedReturn: 12, logoDomain: "qualcomm.com" },
  { symbol: "IBM", name: "IBM Corp.", region: "US", currency: "USD", sector: "Technology", assumedReturn: 8, logoDomain: "ibm.com" },
];

export const IN_TOP_50: CatalogEntry[] = [
  { symbol: "RELIANCE.NS", name: "Reliance Industries", region: "IN", currency: "INR", sector: "Conglomerate", assumedReturn: 14, logoDomain: "ril.com" },
  { symbol: "TCS.NS", name: "Tata Consultancy Services", region: "IN", currency: "INR", sector: "IT Services", assumedReturn: 13, logoDomain: "tcs.com" },
  { symbol: "HDFCBANK.NS", name: "HDFC Bank", region: "IN", currency: "INR", sector: "Banking", assumedReturn: 13, logoDomain: "hdfcbank.com" },
  { symbol: "INFY.NS", name: "Infosys", region: "IN", currency: "INR", sector: "IT Services", assumedReturn: 12, logoDomain: "infosys.com" },
  { symbol: "ICICIBANK.NS", name: "ICICI Bank", region: "IN", currency: "INR", sector: "Banking", assumedReturn: 14, logoDomain: "icicibank.com" },
  { symbol: "BHARTIARTL.NS", name: "Bharti Airtel", region: "IN", currency: "INR", sector: "Telecom", assumedReturn: 13, logoDomain: "airtel.in" },
  { symbol: "SBIN.NS", name: "State Bank of India", region: "IN", currency: "INR", sector: "Banking", assumedReturn: 12, logoDomain: "sbi.co.in" },
  { symbol: "LT.NS", name: "Larsen & Toubro", region: "IN", currency: "INR", sector: "Construction", assumedReturn: 13, logoDomain: "larsentoubro.com" },
  { symbol: "HINDUNILVR.NS", name: "Hindustan Unilever", region: "IN", currency: "INR", sector: "FMCG", assumedReturn: 10, logoDomain: "hul.co.in" },
  { symbol: "ITC.NS", name: "ITC Ltd.", region: "IN", currency: "INR", sector: "FMCG", assumedReturn: 11, logoDomain: "itcportal.com" },
  { symbol: "KOTAKBANK.NS", name: "Kotak Mahindra Bank", region: "IN", currency: "INR", sector: "Banking", assumedReturn: 13, logoDomain: "kotak.com" },
  { symbol: "AXISBANK.NS", name: "Axis Bank", region: "IN", currency: "INR", sector: "Banking", assumedReturn: 13, logoDomain: "axisbank.com" },
  { symbol: "BAJFINANCE.NS", name: "Bajaj Finance", region: "IN", currency: "INR", sector: "NBFC", assumedReturn: 18, logoDomain: "bajajfinserv.in" },
  { symbol: "ASIANPAINT.NS", name: "Asian Paints", region: "IN", currency: "INR", sector: "Paints", assumedReturn: 11, logoDomain: "asianpaints.com" },
  { symbol: "MARUTI.NS", name: "Maruti Suzuki", region: "IN", currency: "INR", sector: "Automobiles", assumedReturn: 12, logoDomain: "marutisuzuki.com" },
  { symbol: "TATAMOTORS.NS", name: "Tata Motors", region: "IN", currency: "INR", sector: "Automobiles", assumedReturn: 16, logoDomain: "tatamotors.com" },
  { symbol: "TATASTEEL.NS", name: "Tata Steel", region: "IN", currency: "INR", sector: "Metals", assumedReturn: 12, logoDomain: "tatasteel.com" },
  { symbol: "HCLTECH.NS", name: "HCL Technologies", region: "IN", currency: "INR", sector: "IT Services", assumedReturn: 12, logoDomain: "hcltech.com" },
  { symbol: "WIPRO.NS", name: "Wipro Ltd.", region: "IN", currency: "INR", sector: "IT Services", assumedReturn: 10, logoDomain: "wipro.com" },
  { symbol: "SUNPHARMA.NS", name: "Sun Pharmaceutical", region: "IN", currency: "INR", sector: "Pharma", assumedReturn: 12, logoDomain: "sunpharma.com" },
  { symbol: "TITAN.NS", name: "Titan Company", region: "IN", currency: "INR", sector: "Consumer", assumedReturn: 15, logoDomain: "titancompany.in" },
  { symbol: "ULTRACEMCO.NS", name: "UltraTech Cement", region: "IN", currency: "INR", sector: "Cement", assumedReturn: 12, logoDomain: "ultratechcement.com" },
  { symbol: "NESTLEIND.NS", name: "Nestle India", region: "IN", currency: "INR", sector: "FMCG", assumedReturn: 11, logoDomain: "nestle.in" },
  { symbol: "POWERGRID.NS", name: "Power Grid Corp.", region: "IN", currency: "INR", sector: "Utilities", assumedReturn: 11, logoDomain: "powergrid.in" },
  { symbol: "NTPC.NS", name: "NTPC Ltd.", region: "IN", currency: "INR", sector: "Utilities", assumedReturn: 11, logoDomain: "ntpc.co.in" },
  { symbol: "ONGC.NS", name: "Oil & Natural Gas Corp.", region: "IN", currency: "INR", sector: "Energy", assumedReturn: 9, logoDomain: "ongcindia.com" },
  { symbol: "COALINDIA.NS", name: "Coal India", region: "IN", currency: "INR", sector: "Mining", assumedReturn: 10, logoDomain: "coalindia.in" },
  { symbol: "M&M.NS", name: "Mahindra & Mahindra", region: "IN", currency: "INR", sector: "Automobiles", assumedReturn: 14, logoDomain: "mahindra.com" },
  { symbol: "ADANIENT.NS", name: "Adani Enterprises", region: "IN", currency: "INR", sector: "Conglomerate", assumedReturn: 18, logoDomain: "adanienterprises.com" },
  { symbol: "ADANIPORTS.NS", name: "Adani Ports & SEZ", region: "IN", currency: "INR", sector: "Logistics", assumedReturn: 15, logoDomain: "adaniports.com" },
  { symbol: "JSWSTEEL.NS", name: "JSW Steel", region: "IN", currency: "INR", sector: "Metals", assumedReturn: 12, logoDomain: "jsw.in" },
  { symbol: "HINDALCO.NS", name: "Hindalco Industries", region: "IN", currency: "INR", sector: "Metals", assumedReturn: 12, logoDomain: "hindalco.com" },
  { symbol: "BAJAJFINSV.NS", name: "Bajaj Finserv", region: "IN", currency: "INR", sector: "Financials", assumedReturn: 16, logoDomain: "bajajfinserv.in" },
  { symbol: "INDUSINDBK.NS", name: "IndusInd Bank", region: "IN", currency: "INR", sector: "Banking", assumedReturn: 12, logoDomain: "indusind.com" },
  { symbol: "TECHM.NS", name: "Tech Mahindra", region: "IN", currency: "INR", sector: "IT Services", assumedReturn: 11, logoDomain: "techmahindra.com" },
  { symbol: "DRREDDY.NS", name: "Dr. Reddy's Labs", region: "IN", currency: "INR", sector: "Pharma", assumedReturn: 11, logoDomain: "drreddys.com" },
  { symbol: "CIPLA.NS", name: "Cipla Ltd.", region: "IN", currency: "INR", sector: "Pharma", assumedReturn: 11, logoDomain: "cipla.com" },
  { symbol: "DIVISLAB.NS", name: "Divi's Laboratories", region: "IN", currency: "INR", sector: "Pharma", assumedReturn: 13, logoDomain: "divislabs.com" },
  { symbol: "GRASIM.NS", name: "Grasim Industries", region: "IN", currency: "INR", sector: "Conglomerate", assumedReturn: 11, logoDomain: "grasim.com" },
  { symbol: "BRITANNIA.NS", name: "Britannia Industries", region: "IN", currency: "INR", sector: "FMCG", assumedReturn: 11, logoDomain: "britannia.co.in" },
  { symbol: "EICHERMOT.NS", name: "Eicher Motors", region: "IN", currency: "INR", sector: "Automobiles", assumedReturn: 13, logoDomain: "eichermotors.com" },
  { symbol: "HEROMOTOCO.NS", name: "Hero MotoCorp", region: "IN", currency: "INR", sector: "Automobiles", assumedReturn: 10, logoDomain: "heromotocorp.com" },
  { symbol: "BAJAJ-AUTO.NS", name: "Bajaj Auto", region: "IN", currency: "INR", sector: "Automobiles", assumedReturn: 11, logoDomain: "bajajauto.com" },
  { symbol: "SBILIFE.NS", name: "SBI Life Insurance", region: "IN", currency: "INR", sector: "Insurance", assumedReturn: 13, logoDomain: "sbilife.co.in" },
  { symbol: "HDFCLIFE.NS", name: "HDFC Life Insurance", region: "IN", currency: "INR", sector: "Insurance", assumedReturn: 13, logoDomain: "hdfclife.com" },
  { symbol: "PIDILITIND.NS", name: "Pidilite Industries", region: "IN", currency: "INR", sector: "Chemicals", assumedReturn: 12, logoDomain: "pidilite.com" },
  { symbol: "DABUR.NS", name: "Dabur India", region: "IN", currency: "INR", sector: "FMCG", assumedReturn: 10, logoDomain: "dabur.com" },
  { symbol: "GODREJCP.NS", name: "Godrej Consumer Products", region: "IN", currency: "INR", sector: "FMCG", assumedReturn: 11, logoDomain: "godrejcp.com" },
  { symbol: "TATACONSUM.NS", name: "Tata Consumer Products", region: "IN", currency: "INR", sector: "FMCG", assumedReturn: 11, logoDomain: "tataconsumer.com" },
  { symbol: "ZOMATO.NS", name: "Zomato Ltd.", region: "IN", currency: "INR", sector: "Internet", assumedReturn: 17, logoDomain: "zomato.com" },
];

export const CATALOG: CatalogEntry[] = [...US_TOP_50, ...IN_TOP_50];
export const CATALOG_BY_SYMBOL: Record<string, CatalogEntry> = Object.fromEntries(
  CATALOG.map((c) => [c.symbol.toUpperCase(), c]),
);

export function getCatalogEntry(symbol: string): CatalogEntry | undefined {
  const s = symbol.toUpperCase();
  return CATALOG_BY_SYMBOL[s] ?? CATALOG_BY_SYMBOL[`${s}.NS`];
}
