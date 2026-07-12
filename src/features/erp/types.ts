export type MockErpInvoice = {
  external_id: string;
  company_name: string;
  amount_aed: number;
  status: "paid" | "unpaid";
  updated_at: string;
};

export type MockErpEnvelope = {
  source: string;
  invoices: MockErpInvoice[];
};
