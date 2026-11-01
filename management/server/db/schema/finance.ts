import type { AnyPgColumn } from "drizzle-orm/pg-core";
import {
  boolean,
  date,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import type { Currency, ExpenseCategory, InvoiceStatus } from "../../../shared/enums";

import { clients, projects } from "./core";
import { documents } from "./ops";

const primaryId = () => uuid("id").primaryKey().defaultRandom();

const timestamps = () => ({
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

const softDelete = () => timestamp("deleted_at", { withTimezone: true });

/** §12 Invoices. Toate sumele sunt în minor units (integer) + moneda facturii. */
export const invoices = pgTable(
  "invoices",
  {
    id: primaryId(),
    number: text("number").notNull().unique(),
    clientId: uuid("client_id")
      .notNull()
      .references((): AnyPgColumn => clients.id, { onDelete: "restrict" }),
    projectId: uuid("project_id").references((): AnyPgColumn => projects.id, {
      onDelete: "set null",
    }),
    issueDate: date("issue_date").notNull(),
    dueDate: date("due_date").notNull(),
    currency: text("currency").$type<Currency>().notNull(),
    subtotal: integer("subtotal").notNull(),
    vat: integer("vat").notNull(),
    total: integer("total").notNull(),
    status: text("status").$type<InvoiceStatus>().notNull(),
    /** Cheia fișierului PDF în storage (local sau S3). */
    file: text("file"),
    /** ID în sistemul extern (ex: SAGA), pentru extensie ulterioară. */
    externalId: text("external_id"),
    isDemo: boolean("is_demo").notNull().default(false),
    deletedAt: softDelete(),
    ...timestamps(),
  },
  (t) => [
    index("invoices_client_id_idx").on(t.clientId),
    index("invoices_project_id_idx").on(t.projectId),
    index("invoices_status_idx").on(t.status),
    index("invoices_issue_date_idx").on(t.issueDate),
    index("invoices_due_date_idx").on(t.dueDate),
    index("invoices_external_id_idx").on(t.externalId),
  ],
);

/** Linii de factură. `quantity` poate fi fracționar (ore, zile). */
export const invoiceItems = pgTable(
  "invoice_items",
  {
    id: primaryId(),
    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    quantity: numeric("quantity", { precision: 12, scale: 3 }).notNull(),
    /** Preț unitar în minor units. */
    unitPrice: integer("unit_price").notNull(),
    /** Cota VAT în basis points (ex: 1900 = 19%). */
    vatRateBp: integer("vat_rate_bp").notNull(),
    total: integer("total").notNull(),
    ...timestamps(),
  },
  (t) => [index("invoice_items_invoice_id_idx").on(t.invoiceId)],
);

/** §12 Payments — N plăți pentru o factură; soldul se calculează, nu se stochează. */
export const payments = pgTable(
  "payments",
  {
    id: primaryId(),
    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    currency: text("currency").$type<Currency>().notNull(),
    paidAt: timestamp("paid_at", { withTimezone: true }).notNull(),
    method: text("method"),
    reference: text("reference"),
    notes: text("notes"),
    isDemo: boolean("is_demo").notNull().default(false),
    deletedAt: softDelete(),
    ...timestamps(),
  },
  (t) => [
    index("payments_invoice_id_idx").on(t.invoiceId),
    index("payments_paid_at_idx").on(t.paidAt),
    index("payments_method_idx").on(t.method),
  ],
);

/** §12 Expenses — cheltuieli directe (profit proiect = venit − costuri directe). */
export const expenses = pgTable(
  "expenses",
  {
    id: primaryId(),
    name: text("name").notNull(),
    category: text("category").$type<ExpenseCategory>().notNull(),
    supplier: text("supplier"),
    projectId: uuid("project_id").references((): AnyPgColumn => projects.id, {
      onDelete: "set null",
    }),
    amount: integer("amount").notNull(),
    currency: text("currency").$type<Currency>().notNull(),
    spentAt: timestamp("spent_at", { withTimezone: true }).notNull(),
    recurring: boolean("recurring").notNull().default(false),
    attachmentDocumentId: uuid("attachment_document_id").references(
      (): AnyPgColumn => documents.id,
      { onDelete: "set null" },
    ),
    isDemo: boolean("is_demo").notNull().default(false),
    deletedAt: softDelete(),
    ...timestamps(),
  },
  (t) => [
    index("expenses_project_id_idx").on(t.projectId),
    index("expenses_category_idx").on(t.category),
    index("expenses_spent_at_idx").on(t.spentAt),
    index("expenses_supplier_idx").on(t.supplier),
    index("expenses_currency_idx").on(t.currency),
    index("expenses_attachment_document_id_idx").on(t.attachmentDocumentId),
  ],
);

/**
 * Cursuri de schimb datate. Conversiile între monede se fac doar cu aceste cursuri,
 * niciodată cu sume amestecate.
 */
export const exchangeRates = pgTable(
  "exchange_rates",
  {
    id: primaryId(),
    date: date("date").notNull(),
    fromCurrency: text("from_currency").$type<Currency>().notNull(),
    toCurrency: text("to_currency").$type<Currency>().notNull(),
    rate: numeric("rate", { precision: 18, scale: 8 }).notNull(),
    source: text("source"),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("exchange_rates_date_from_to_idx").on(t.date, t.fromCurrency, t.toCurrency),
    index("exchange_rates_date_idx").on(t.date),
    index("exchange_rates_from_currency_idx").on(t.fromCurrency),
    index("exchange_rates_to_currency_idx").on(t.toCurrency),
  ],
);
