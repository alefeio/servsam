import { z } from "zod";
import { MAX_CENTS } from "@/lib/platform/money";

const positiveCents = z
  .number()
  .int("Valor deve ser inteiro em centavos.")
  .positive("Valor deve ser maior que zero.")
  .max(MAX_CENTS, "Valor acima do limite permitido.");

function isValidCalendarDate(dateOnly: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) return false;
  const [year, month, day] = dateOnly.split("-").map(Number);
  if (!year || !month || !day) return false;
  const dt = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return (
    dt.getUTCFullYear() === year &&
    dt.getUTCMonth() === month - 1 &&
    dt.getUTCDate() === day
  );
}

export const createBillingRequestSchema = z.object({
  engagementId: z.string().min(1, "Contratação obrigatória."),
  description: z
    .string()
    .trim()
    .min(3, "Descreva a solicitação.")
    .max(500, "Descrição muito longa."),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  referenceAmountCents: positiveCents.optional().nullable(),
  idempotencyKey: z.string().trim().min(8).max(80).optional(),
});

export type CreateBillingRequestInput = z.infer<
  typeof createBillingRequestSchema
>;

export const processBillingRequestSchema = z.object({
  billingRequestId: z.string().min(1),
  markUnderReview: z.boolean().optional(),
  invoiceIssuedExternally: z.boolean(),
  externalDocumentRef: z
    .string()
    .trim()
    .max(200)
    .optional()
    .or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type ProcessBillingRequestInput = z.infer<
  typeof processBillingRequestSchema
>;

export const cancelBillingRequestSchema = z.object({
  billingRequestId: z.string().min(1),
  reason: z
    .string()
    .trim()
    .min(3, "Informe o motivo do cancelamento.")
    .max(500),
});

export type CancelBillingRequestInput = z.infer<
  typeof cancelBillingRequestSchema
>;

export const createReceiptEntrySchema = z.object({
  engagementId: z.string().min(1, "Contratação obrigatória."),
  kind: z.enum(["signal", "installment", "other"], {
    message: "Tipo de recebimento inválido.",
  }),
  amountCents: positiveCents,
  referenceDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida (AAAA-MM-DD).")
    .refine(isValidCalendarDate, "Data de referência inexistente no calendário."),
  paymentMethod: z
    .enum(["pix", "transfer", "cash", "check", "card", "other"])
    .optional()
    .nullable(),
  proofReference: z.string().trim().max(200).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  idempotencyKey: z.string().trim().min(8).max(80).optional(),
});

export type CreateReceiptEntryInput = z.infer<typeof createReceiptEntrySchema>;

export const confirmReceiptSchema = z.object({
  receiptEntryId: z.string().min(1),
  /** Valor efetivamente confirmado pelo Financeiro (obrigatório, em centavos). */
  confirmedAmountCents: positiveCents,
});

export type ConfirmReceiptInput = z.infer<typeof confirmReceiptSchema>;

export const rejectReceiptSchema = z.object({
  receiptEntryId: z.string().min(1),
  reason: z
    .string()
    .trim()
    .min(3, "Informe o motivo da rejeição.")
    .max(500),
});

export type RejectReceiptInput = z.infer<typeof rejectReceiptSchema>;

export const cancelReceiptSchema = z.object({
  receiptEntryId: z.string().min(1),
  reason: z
    .string()
    .trim()
    .min(3, "Informe o motivo do cancelamento.")
    .max(500),
});

export type CancelReceiptInput = z.infer<typeof cancelReceiptSchema>;

export const reverseReceiptSchema = z.object({
  receiptEntryId: z.string().min(1),
  reason: z
    .string()
    .trim()
    .min(3, "Informe o motivo da reversão.")
    .max(500),
});

export type ReverseReceiptInput = z.infer<typeof reverseReceiptSchema>;
