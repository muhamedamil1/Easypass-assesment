import { z } from "zod";

import { serviceRequestStatuses } from "./types";

const formValue = z
  .unknown()
  .transform((value) => (typeof value === "string" ? value : ""));

export const companyIdSchema = z.string().uuid();

export const createRequestSchema = z.object({
  companyId: companyIdSchema,
  title: formValue.pipe(z.string().trim().min(1).max(200)),
});

export const updateRequestStatusSchema = z.object({
  companyId: companyIdSchema,
  requestId: z.string().uuid(),
  status: z.enum(serviceRequestStatuses),
});

export type CreateRequestInput = z.infer<typeof createRequestSchema>;
export type UpdateRequestStatusInput = z.infer<
  typeof updateRequestStatusSchema
>;
