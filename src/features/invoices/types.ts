export type InvoiceStatus = "paid" | "unpaid";

export type ParsedInvoice = {
  source: string;
  externalId: string;
  companyName: string;
  amountAed: number;
  status: InvoiceStatus;
  updatedAt: string;
  updatedAtMs: number;
};

export type ReducedInvoiceRow = {
  source: string;
  external_id: string;
  source_company_name: string;
  amount_aed: number;
  status: InvoiceStatus;
  source_updated_at: string;
  company_name: string;
  updated_at: string;
};

export type ReducedInvoiceBatch = {
  source: string;
  received: number;
  unique: number;
  rows: ReducedInvoiceRow[];
};

export type InvoiceSyncResult = {
  runId: string;
  source: string;
  received: number;
  unique: number;
  affected: number;
  unchangedOrStale: number;
  finalInvoiceCount: number;
  inserted: number;
  updated: number;
  durationMs: number;
};
