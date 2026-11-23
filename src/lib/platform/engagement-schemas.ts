import { z } from "zod";
import { optionalText } from "@/lib/platform/customer-schemas";

export const createEngagementFromProposalSchema = z.object({
  proposalId: z.string().min(1, "Informe o orçamento."),
  notes: optionalText(2000),
});

export type CreateEngagementFromProposalInput = z.input<
  typeof createEngagementFromProposalSchema
>;

export const createEngagementFromPurchaseOrderSchema = z.object({
  purchaseOrderId: z.string().min(1, "Informe a ordem de compra."),
  notes: optionalText(2000),
});

export type CreateEngagementFromPurchaseOrderInput = z.input<
  typeof createEngagementFromPurchaseOrderSchema
>;
