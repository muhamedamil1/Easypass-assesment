import { describe, expect, it } from "vitest";

import { loadMockErpInvoicePayload } from "../../src/features/erp/mock-erp-source";
import { parseErpEnvelope } from "../../src/features/invoices/schemas";

describe("ERP invoice schema", () => {
  it("parses the canonical payload", async () => {
    const parsed = parseErpEnvelope(await loadMockErpInvoicePayload());

    expect(parsed.source).toBe("mock-erp");
    expect(parsed.invoices).toHaveLength(8);
  });

  it("rejects invalid status", () => {
    expect(() =>
      parseErpEnvelope({
        source: "mock-erp",
        invoices: [
          {
            external_id: "INV-BAD",
            company_name: "Falcon Trading LLC",
            amount_aed: 1,
            status: "void",
            updated_at: "2026-06-01T00:00:00Z",
          },
        ],
      }),
    ).toThrow();
  });

  it("rejects invalid timestamp", () => {
    expect(() =>
      parseErpEnvelope({
        source: "mock-erp",
        invoices: [
          {
            external_id: "INV-BAD",
            company_name: "Falcon Trading LLC",
            amount_aed: 1,
            status: "paid",
            updated_at: "not-a-date",
          },
        ],
      }),
    ).toThrow();
  });

  it("rejects negative amounts", () => {
    expect(() =>
      parseErpEnvelope({
        source: "mock-erp",
        invoices: [
          {
            external_id: "INV-BAD",
            company_name: "Falcon Trading LLC",
            amount_aed: -1,
            status: "paid",
            updated_at: "2026-06-01T00:00:00Z",
          },
        ],
      }),
    ).toThrow();
  });

  it("rejects amounts with more than two decimals", () => {
    expect(() =>
      parseErpEnvelope({
        source: "mock-erp",
        invoices: [
          {
            external_id: "INV-BAD",
            company_name: "Falcon Trading LLC",
            amount_aed: 1.999,
            status: "paid",
            updated_at: "2026-06-01T00:00:00Z",
          },
        ],
      }),
    ).toThrow();
  });

  it("rejects blank required strings", () => {
    expect(() =>
      parseErpEnvelope({
        source: " ",
        invoices: [
          {
            external_id: " ",
            company_name: " ",
            amount_aed: 1,
            status: "paid",
            updated_at: "2026-06-01T00:00:00Z",
          },
        ],
      }),
    ).toThrow();
  });
});
