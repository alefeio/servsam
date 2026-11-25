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
import { parseBrlToCents } from "@/lib/platform/money";
import {
  parseConfirmedCentsField,
  parseOptionalReferenceReais,
} from "@/lib/platform/finance-parse";

function field(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === "string" ? value : "";
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
    const reference = parseOptionalReferenceReais(
      field(form, "referenceAmountReais"),
    );
    if (!reference.ok) return { ok: false, message: reference.message };
    const idempotencyKey = field(form, "idempotencyKey");
    if (!idempotencyKey || idempotencyKey.length < 8) {
      return { ok: false, message: "Chave de idempotência ausente ou inválida." };
    }
    const result = await createBillingRequest(actor, {
      engagementId,
      description: field(form, "description"),
      notes: field(form, "notes"),
      referenceAmountCents: reference.cents,
      idempotencyKey,
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
    const amountParsed = parseBrlToCents(field(form, "amountReais"));
    if (!amountParsed.ok || amountParsed.cents <= 0) {
      return {
        ok: false,
        message: "Informe um valor válido em reais (ex.: 1.234,56).",
      };
    }
    const idempotencyKey = field(form, "idempotencyKey");
    if (!idempotencyKey || idempotencyKey.length < 8) {
      return { ok: false, message: "Chave de idempotência ausente ou inválida." };
    }
    const paymentMethodRaw = field(form, "paymentMethod");
    const result = await createReceiptEntry(actor, {
      engagementId,
      kind: field(form, "kind") as "signal" | "installment" | "other",
      amountCents: amountParsed.cents,
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
      idempotencyKey,
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
    const confirmed = parseConfirmedCentsField(
      field(form, "confirmedAmountCents"),
    );
    if (!confirmed.ok) return { ok: false, message: confirmed.message };
    const result = await confirmReceipt(actor, {
      receiptEntryId: field(form, "receiptEntryId"),
      confirmedAmountCents: confirmed.cents,
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
