import { describe, expect, it, vi } from "vitest";

import { syncInvoicesFromPayload } from "../../src/features/invoices/sync-service";

const validPayload = {
  source: "mock-erp",
  invoices: [
    {
      external_id: "INV-1",
      company_name: "Falcon Trading LLC",
      amount_aed: 10,
      status: "paid",
      updated_at: "2026-06-01T00:00:00Z",
    },
    {
      external_id: "INV-1",
      company_name: "Falcon Trading LLC",
      amount_aed: 11,
      status: "paid",
      updated_at: "2026-06-02T00:00:00Z",
    },
  ],
};

describe("syncInvoicesFromPayload", () => {
  it("validates and reduces before calling the RPC", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: {
        inserted: 1,
        updated: 0,
        affected: 1,
        final_count: 1,
      },
      error: null,
    });

    const result = await syncInvoicesFromPayload(validPayload, { rpc } as never);

    expect(rpc).toHaveBeenCalledWith("sync_invoices", {
      p_rows: [
        expect.objectContaining({
          external_id: "INV-1",
          amount_aed: 11,
          source_updated_at: "2026-06-02T00:00:00.000Z",
        }),
      ],
    });
    expect(result).toMatchObject({
      source: "mock-erp",
      received: 2,
      unique: 1,
      affected: 1,
      unchangedOrStale: 0,
      finalInvoiceCount: 1,
    });
  });

  it("stops before RPC on equal-timestamp conflict", async () => {
    const rpc = vi.fn();

    await expect(
      syncInvoicesFromPayload(
        {
          source: "mock-erp",
          invoices: [
            {
              external_id: "INV-1",
              company_name: "Falcon Trading LLC",
              amount_aed: 10,
              status: "paid",
              updated_at: "2026-06-01T00:00:00Z",
            },
            {
              external_id: "INV-1",
              company_name: "Falcon Trading LLC",
              amount_aed: 11,
              status: "paid",
              updated_at: "2026-06-01T00:00:00Z",
            },
          ],
        },
        { rpc } as never,
      ),
    ).rejects.toThrow("CONFLICTING_SOURCE_VERSIONS");

    expect(rpc).not.toHaveBeenCalled();
  });
});
