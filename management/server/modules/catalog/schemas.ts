/** Câmpuri zod comune: crearea manuală și importul catalogului folosesc aceleași reguli. */
import { z } from "zod";

import { CURRENCIES } from "../../../shared/enums";
import { BILLINGS } from "../../../shared/offers";

export const text = (max: number) => z.string().trim().max(max, `Maximum ${max} de caractere`);
/** Sumă în unități minore: întreg, ≥ 0. */
export const minor = z.number().finite().int("Suma trebuie să fie în unități minore (întreg)").min(0).max(2_000_000_000);
export const currency = z.enum(CURRENCIES);

export const serviceFields = {
  categoryCode: z.string().regex(/^[A-Z]$/, "Cod de categorie invalid"),
  name: text(200).min(1, "Câmp obligatoriu"),
  shortDescription: text(300),
  description: text(4000),
  deliverables: text(2000),
  acceptance: text(2000),
  unit: text(40).min(1, "Câmp obligatoriu"),
  defaultQuantity: z.number().finite().min(0).max(1_000_000_000),
  recommendedPrice: minor.nullable(),
  currency: currency.nullable(),
  billing: z.enum(BILLINGS),
  defaultPeriods: z.number().int().min(1).max(600),
  defaultStatus: z.enum(["accepted", "optional", "client_direct"]),
  advanced: z.boolean(),
  duration: text(200),
  conditions: text(2000),
  sort: z.number().int().min(0).max(1_000_000),
};

export const serviceCode = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9][A-Z0-9_-]{0,19}$/, "Cod invalid (litere, cifre, - sau _, maximum 20)");

