import { z } from "zod";
import { optionalText } from "@/lib/platform/customer-schemas";
import { endOfBusinessDay } from "@/lib/platform/dates";
import { MAX_CENTS } from "@/lib/platform/money";
import { proposalItemSchema } from "@/lib/platform/proposal-schemas";

export const MAX_PURCHASE_ORDER_ITEMS = 50;

export const purchaseOrderInputSchema = z.object({
  customerId: z.string().min(1, "Escolha o cliente."),
  customerUnitId: z
    .string()
    .optional()
    .transform((value) => (value ? value : undefined)),
  externalNumber: z
    .string()
    .trim()
    .min(1, "Informe o número da O.C. do cliente.")
    .max(80),
  receivedAt: z
    .string()
    .trim()
    .min(1, "Informe a data de recebimento.")
    .refine((value) => endOfBusinessDay(value) !== null, {
      message: "Data de recebimento inválida.",
    }),
  description: z
    .string()
    .trim()
    .min(3, "Descreva a O.C. recebida.")
    .max(500),
  observations: optionalText(2000),
  documentReference: optionalText(300),
  agreedAmountCents: z.number().int().min(0).max(MAX_CENTS).optional(),
  items: z
    .array(proposalItemSchema)
    .min(1, "Inclua ao menos um item de serviço.")
    .max(MAX_PURCHASE_ORDER_ITEMS, `Use até ${MAX_PURCHASE_ORDER_ITEMS} itens.`),
});

export type PurchaseOrderInput = z.input<typeof purchaseOrderInputSchema>;
