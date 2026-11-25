import { z } from "zod";

const positiveCents = z
  .number()
  .int("Valor deve ser inteiro em centavos.")
  .positive("Valor deve ser maior que zero.");

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
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida (AAAA-MM-DD)."),
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
  /** Valor efetivamente confirmado; padrão = valor solicitado. */
  confirmedAmountCents: positiveCents.optional(),
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
