export const CURRENCY_SYMBOL = "₹";
export const USD_TO_INR = 83;

export function usd(amount: number): number {
  return parseFloat((amount * USD_TO_INR).toFixed(2));
}

export function fmt(amount: number): string {
  return `₹${(amount * USD_TO_INR).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export function fmtRaw(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}
