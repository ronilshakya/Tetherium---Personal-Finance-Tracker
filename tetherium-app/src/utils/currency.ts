const LOCALE_MAP: Record<string, string> = {
  NPR: "en-NP",
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
  INR: "en-IN",
};

export function formatCurrency(
  amount: number | string,
  currency: string = "NPR",
): string {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  const locale = LOCALE_MAP[currency] ?? "en-US";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
