import type { InvoiceStatus } from "../../../shared/enums";

export interface ItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRateBp: number;
}

/** Valoarea netă a liniei; cantitatea are maxim 3 zecimale, deci calculul rămâne pe întregi. */
export function lineNet(quantity: number, unitPrice: number): number {
  return Math.round((Math.round(quantity * 1000) * unitPrice) / 1000);
}

/** TVA-ul se calculează și se rotunjește pe linie, apoi se adună. */
export function invoiceTotals(items: ItemInput[]) {
  let subtotal = 0;
  let vat = 0;
  for (const item of items) {
    const net = lineNet(item.quantity, item.unitPrice);
    subtotal += net;
    vat += Math.round((net * item.vatRateBp) / 10000);
  }
  return { subtotal, vat, total: subtotal + vat };
}

/** Statusul rezultă din sume și scadență; Draft și Cancelled se schimbă doar explicit. */
export function deriveStatus(
  current: InvoiceStatus,
  total: number,
  paid: number,
  dueDate: string,
  today: string,
): InvoiceStatus {
  if (current === "Draft" || current === "Cancelled") return current;
  if (paid >= total) return "Paid";
  if (dueDate < today) return "Overdue";
  return paid > 0 ? "Partially Paid" : "Issued";
}

export function convertMinor(amount: number, rate: number): number {
  return Math.round(amount * rate);
}

// ponytail: zi UTC; lângă miezul nopții scadența poate întârzia câteva ore, fus orar configurabil dacă deranjează.
export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}
