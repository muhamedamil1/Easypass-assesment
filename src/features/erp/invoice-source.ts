import type { MockErpEnvelope } from "./types";

export type InvoiceSource = {
  loadInvoices(): Promise<unknown>;
};

export function asMockErpEnvelope(payload: MockErpEnvelope) {
  return payload;
}
