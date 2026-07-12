import { z } from "zod";

import type { ParsedInvoice } from "./types";

const isoInstantSchema = z.string().refine((value) => {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed);
}, "updated_at must be a valid ISO timestamp");

const amountAedSchema = z.number().finite().nonnegative().refine((value) => {
  const cents = value * 100;
  return Math.abs(cents - Math.round(cents)) < 1e-9;
}, "amount_aed must have at most two decimal places");

export const erpInvoiceSchema = z.object({
  external_id: z.string().trim().min(1),
  company_name: z.string().trim().min(1),
  amount_aed: amountAedSchema,
  status: z.enum(["paid", "unpaid"]),
  updated_at: isoInstantSchema,
});

export const erpEnvelopeSchema = z.object({
  source: z.string().trim().min(1),
  invoices: z.array(erpInvoiceSchema),
});

export type ErpEnvelope = z.infer<typeof erpEnvelopeSchema>;

export function parseErpEnvelope(payload: unknown) {
  const envelope = erpEnvelopeSchema.parse(payload);
  const source = envelope.source.trim();

  const invoices: ParsedInvoice[] = envelope.invoices.map((invoice) => {
    const updatedAtMs = Date.parse(invoice.updated_at);

    return {
      source,
      externalId: invoice.external_id.trim(),
      companyName: invoice.company_name.trim(),
      amountAed: invoice.amount_aed,
      status: invoice.status,
      updatedAt: new Date(updatedAtMs).toISOString(),
      updatedAtMs,
    };
  });

  return {
    source,
    invoices,
  };
}
