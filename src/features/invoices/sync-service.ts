import type { SupabaseClient } from "@supabase/supabase-js";

import { parseErpEnvelope } from "./schemas";
import { reduceInvoiceVersions } from "./deduplicate";
import type { InvoiceSyncResult } from "./types";

type RpcResult = {
  received?: number;
  inserted?: number;
  updated?: number;
  affected?: number;
  final_count?: number;
};

export async function syncInvoicesFromPayload(
  payload: unknown,
  client: SupabaseClient,
): Promise<InvoiceSyncResult> {
  const startedAt = Date.now();
  const runId = crypto.randomUUID();
  const parsed = parseErpEnvelope(payload);
  const reduced = reduceInvoiceVersions(parsed.source, parsed.invoices);

  const { data, error } = await client.rpc("sync_invoices", {
    p_rows: reduced.rows,
  });

  if (error) {
    throw new Error(error.message);
  }

  const rpcResult = (data ?? {}) as RpcResult;
  const affected = Number(rpcResult.affected ?? 0);
  const finalInvoiceCount = Number(rpcResult.final_count ?? 0);

  return {
    runId,
    source: reduced.source,
    received: reduced.received,
    unique: reduced.unique,
    affected,
    unchangedOrStale: reduced.unique - affected,
    finalInvoiceCount,
    inserted: Number(rpcResult.inserted ?? 0),
    updated: Number(rpcResult.updated ?? 0),
    durationMs: Date.now() - startedAt,
  };
}

export function toSyncCompletedEvent(result: InvoiceSyncResult) {
  return {
    event: "invoice_sync_completed",
    runId: result.runId,
    source: result.source,
    received: result.received,
    unique: result.unique,
    affected: result.affected,
    unchangedOrStale: result.unchangedOrStale,
    finalInvoiceCount: result.finalInvoiceCount,
    durationMs: result.durationMs,
  };
}
