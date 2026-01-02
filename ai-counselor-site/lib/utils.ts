import clsx, { type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatNumber(value: number) {
  return Intl.NumberFormat("ja-JP", { maximumFractionDigits: 1 }).format(value);
}
