"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticatedUser } from "@/lib/platform/access";
import {
  cancelBillingRequest,
  cancelReceipt,
  confirmReceipt,
  createBillingRequest,
  createReceiptEntry,
  processBillingRequest,
  rejectReceipt,
  reverseReceipt,
} from "@/lib/platform/finance";
import { PermissionError } from "@/lib/platform/permission-error";
import { DENIED_MESSAGE } from "@/lib/platform/service-result";

function field(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === "string" ? value : "";
}

function parseOptionalCents(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const normalized = trimmed.replace(/\./g, "").replace(",", ".");
  const asNumber = Number(normalized);
  if (!Number.isFinite(asNumber)) return undefined;
  // Aceita reais (1.500,00) convertendo para centavos se houver vírgula/ponto decimal.
  if (trimmed.includes(",") || /^\d+\.\d{1,2}$/.test(trimmed)) {
    return Math.round(asNumber * 100);
  }
  // Inteiro puro: tratado como centavos.
  if (/^\d+$/.test(trimmed)) return Number(trimmed);
  return Math.round(asNumber * 100);
}

function parseReaisToCents(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const normalized = trimmed.replace(/\./g, "").replace(",", ".");
  const asNumber = Number(normalized);
  if (!Number.isFinite(asNumber) || asNumber <= 0) return undefined;
  return Math.round(asNumber * 100);
}

export type FinanceActionState = {
  ok: boolean;
  message?: string;
};

export async function createBillingRequestAction(
  _prev: FinanceActionState,
  form: FormData,
): Promise<FinanceActionState> {
  try {
    const actor = await requireAuthenticatedUser();
    const engagementId = field(form, "engagementId");
    const result = await createBillingRequest(actor, {
      engagementId,
      description: field(form, "description"),
      notes: field(form, "notes"),
      referenceAmountCents: parseReaisToCents(field(form, "referenceAmountReais")),
      idempotencyKey: field(form, "idempotencyKey") || undefined,
    });
    if (!result.ok) return { ok: false, message: result.message };
    revalidatePath(`/sistema/contratacoes/${engagementId}`);
    revalidatePath("/sistema/financeiro");
    return { ok: true, message: "Solicitação fiscal registrada." };
  } catch (error) {
    if (error instanceof PermissionError) {
      return { ok: false, message: DENIED_MESSAGE };
    }
    throw error;
  }
}

export async function processBillingRequestAction(
  _prev: FinanceActionState,
  form: FormData,
): Promise<FinanceActionState> {
  try {
    const actor = await requireAuthenticatedUser();
    const billingRequestId = field(form, "billingRequestId");
    const engagementId = field(form, "engagementId");
    const result = await processBillingRequest(actor, {
      billingRequestId,
      markUnderReview: field(form, "markUnderReview") === "1",
      invoiceIssuedExternally: field(form, "invoiceIssuedExternally") === "1",
      externalDocumentRef: field(form, "externalDocumentRef"),
      notes: field(form, "notes"),
    });
    if (!result.ok) return { ok: false, message: result.message };
    if (engagementId) revalidatePath(`/sistema/contratacoes/${engagementId}`);
    revalidatePath("/sistema/financeiro");
    return { ok: true, message: "Solicitação atualizada pelo Financeiro." };
  } catch (error) {
    if (error instanceof PermissionError) {
      return { ok: false, message: DENIED_MESSAGE };
    }
    throw error;
  }
}

export async function cancelBillingRequestAction(
  _prev: FinanceActionState,
  form: FormData,
): Promise<FinanceActionState> {
  try {
    const actor = await requireAuthenticatedUser();
    const engagementId = field(form, "engagementId");
    const result = await cancelBillingRequest(actor, {
      billingRequestId: field(form, "billingRequestId"),
      reason: field(form, "reason"),
    });
    if (!result.ok) return { ok: false, message: result.message };
    if (engagementId) revalidatePath(`/sistema/contratacoes/${engagementId}`);
    revalidatePath("/sistema/financeiro");
    return { ok: true, message: "Solicitação cancelada." };
  } catch (error) {
    if (error instanceof PermissionError) {
      return { ok: false, message: DENIED_MESSAGE };
    }
    throw error;
  }
}

export async function createReceiptEntryAction(
  _prev: FinanceActionState,
  form: FormData,
): Promise<FinanceActionState> {
  try {
    const actor = await requireAuthenticatedUser();
    const engagementId = field(form, "engagementId");
    const amountCents = parseReaisToCents(field(form, "amountReais"));
    if (!amountCents) {
      return { ok: false, message: "Informe um valor válido em reais." };
    }
    const paymentMethodRaw = field(form, "paymentMethod");
    const result = await createReceiptEntry(actor, {
      engagementId,
      kind: field(form, "kind") as "signal" | "installment" | "other",
      amountCents,
      referenceDate: field(form, "referenceDate"),
      paymentMethod: paymentMethodRaw
        ? (paymentMethodRaw as
            | "pix"
            | "transfer"
            | "cash"
            | "check"
            | "card"
            | "other")
        : null,
      proofReference: field(form, "proofReference"),
      notes: field(form, "notes"),
      idempotencyKey: field(form, "idempotencyKey") || undefined,
    });
    if (!result.ok) return { ok: false, message: result.message };
    revalidatePath(`/sistema/contratacoes/${engagementId}`);
    revalidatePath("/sistema/financeiro");
    return {
      ok: true,
      message: "Recebimento enviado para conferência do Financeiro.",
    };
  } catch (error) {
    if (error instanceof PermissionError) {
      return { ok: false, message: DENIED_MESSAGE };
    }
    throw error;
  }
}

export async function confirmReceiptAction(
  _prev: FinanceActionState,
  form: FormData,
): Promise<FinanceActionState> {
  try {
    const actor = await requireAuthenticatedUser();
    const engagementId = field(form, "engagementId");
    const confirmed = parseOptionalCents(field(form, "confirmedAmountCents"));
    const result = await confirmReceipt(actor, {
      receiptEntryId: field(form, "receiptEntryId"),
      confirmedAmountCents: confirmed,
    });
    if (!result.ok) return { ok: false, message: result.message };
    if (engagementId) revalidatePath(`/sistema/contratacoes/${engagementId}`);
    revalidatePath("/sistema/financeiro");
    return {
      ok: true,
      message: "Recebimento confirmado manualmente pelo Financeiro.",
    };
  } catch (error) {
    if (error instanceof PermissionError) {
      return { ok: false, message: DENIED_MESSAGE };
    }
    throw error;
  }
}

export async function rejectReceiptAction(
  _prev: FinanceActionState,
  form: FormData,
): Promise<FinanceActionState> {
  try {
    const actor = await requireAuthenticatedUser();
    const engagementId = field(form, "engagementId");
    const result = await rejectReceipt(actor, {
      receiptEntryId: field(form, "receiptEntryId"),
      reason: field(form, "reason"),
    });
    if (!result.ok) return { ok: false, message: result.message };
    if (engagementId) revalidatePath(`/sistema/contratacoes/${engagementId}`);
    revalidatePath("/sistema/financeiro");
    return { ok: true, message: "Recebimento rejeitado." };
  } catch (error) {
    if (error instanceof PermissionError) {
      return { ok: false, message: DENIED_MESSAGE };
    }
    throw error;
  }
}

export async function cancelReceiptAction(
  _prev: FinanceActionState,
  form: FormData,
): Promise<FinanceActionState> {
  try {
    const actor = await requireAuthenticatedUser();
    const engagementId = field(form, "engagementId");
    const result = await cancelReceipt(actor, {
      receiptEntryId: field(form, "receiptEntryId"),
      reason: field(form, "reason"),
    });
    if (!result.ok) return { ok: false, message: result.message };
    if (engagementId) revalidatePath(`/sistema/contratacoes/${engagementId}`);
    revalidatePath("/sistema/financeiro");
    return { ok: true, message: "Lançamento pendente cancelado." };
  } catch (error) {
    if (error instanceof PermissionError) {
      return { ok: false, message: DENIED_MESSAGE };
    }
    throw error;
  }
}

export async function reverseReceiptAction(
  _prev: FinanceActionState,
  form: FormData,
): Promise<FinanceActionState> {
  try {
    const actor = await requireAuthenticatedUser();
    const engagementId = field(form, "engagementId");
    const result = await reverseReceipt(actor, {
      receiptEntryId: field(form, "receiptEntryId"),
      reason: field(form, "reason"),
    });
    if (!result.ok) return { ok: false, message: result.message };
    if (engagementId) revalidatePath(`/sistema/contratacoes/${engagementId}`);
    revalidatePath("/sistema/financeiro");
    return { ok: true, message: "Confirmação revertida com auditoria." };
  } catch (error) {
    if (error instanceof PermissionError) {
      return { ok: false, message: DENIED_MESSAGE };
    }
    throw error;
  }
}
