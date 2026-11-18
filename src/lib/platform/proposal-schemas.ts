import { z } from "zod";
import { optionalText } from "@/lib/platform/customer-schemas";
import { endOfBusinessDay } from "@/lib/platform/dates";
import { MAX_CENTS } from "@/lib/platform/money";

export const MAX_PROPOSAL_ITEMS = 50;

export const proposalItemSchema = z.object({
  description: z.string().trim().min(2, "Descreva o item.").max(300),
  quantity: z
    .number()
    .positive("A quantidade deve ser maior que zero.")
    .max(999_999.999)
    .refine(
      (value) => Math.abs(value * 1000 - Math.round(value * 1000)) < 1e-6,
      {
        message: "Use até 3 casas decimais na quantidade.",
      },
    ),
  unitPriceCents: z.number().int().min(0).max(MAX_CENTS),
});

export type ProposalItemInput = z.input<typeof proposalItemSchema>;

export const proposalInputSchema = z.object({
  customerId: z.string().min(1, "Escolha o cliente."),
  customerUnitId: z
    .string()
    .optional()
    .transform((value) => (value ? value : undefined)),
  title: z.string().trim().min(3, "Informe o título do orçamento.").max(160),
  /** AAAA-MM-DD. Vira o fim do dia em Brasília. */
  validUntil: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined))
    .refine(
      (value) => value === undefined || endOfBusinessDay(value) !== null,
      {
        message: "Data de validade inválida.",
      },
    ),
  paymentTerms: optionalText(500),
  commercialConditions: optionalText(2000),
  observations: optionalText(2000),
  discountCents: z.number().int().min(0).max(MAX_CENTS).default(0),
  items: z
    .array(proposalItemSchema)
    .min(1, "Inclua ao menos um item.")
    .max(MAX_PROPOSAL_ITEMS, `Use até ${MAX_PROPOSAL_ITEMS} itens.`),
});

export type ProposalInput = z.input<typeof proposalInputSchema>;

export const rejectionSchema = z.object({
  reason: optionalText(500),
});
