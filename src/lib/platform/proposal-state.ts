/**
 * Máquina de estados da proposta (UI: "Orçamento").
 * Fonte: docs/architecture/v1/state-machines.md.
 * Módulo puro: sem Prisma, sem I/O.
 */

export const PROPOSAL_STATUSES = [
  "draft",
  "sent",
  "accepted",
  "rejected",
  "expired",
] as const;

export type ProposalStatusValue = (typeof PROPOSAL_STATUSES)[number];

const TRANSITIONS: Record<ProposalStatusValue, readonly ProposalStatusValue[]> =
  {
    draft: ["sent"],
    sent: ["accepted", "rejected", "expired"],
    accepted: [],
    rejected: [],
    expired: [],
  };

export function isProposalStatus(value: string): value is ProposalStatusValue {
  return (PROPOSAL_STATUSES as readonly string[]).includes(value);
}

export function allowedTransitions(
  from: ProposalStatusValue,
): readonly ProposalStatusValue[] {
  return TRANSITIONS[from];
}

export function canTransition(
  from: ProposalStatusValue,
  to: ProposalStatusValue,
): boolean {
  return TRANSITIONS[from].includes(to);
}

/** Chave de permissão exigida para chegar ao estado de destino. */
export function permissionForTransition(
  to: ProposalStatusValue,
): string | null {
  switch (to) {
    case "sent":
      return "proposal.send";
    case "accepted":
    case "rejected":
      return "proposal.approve";
    case "expired":
      return "proposal.update";
    case "draft":
      return null;
  }
}

/** Só rascunho edita conteúdo. Depois de enviada, ajuste vira outra proposta. */
export function isEditable(status: ProposalStatusValue): boolean {
  return status === "draft";
}

/** Aceita, recusada ou expirada podem originar uma nova proposta. */
export function canRevise(status: ProposalStatusValue): boolean {
  return status === "accepted" || status === "rejected" || status === "expired";
}

/** Enviada com a validade já vencida: ainda `sent`, mas não aceitável. */
export function isPastValidity(validUntil: Date | null, now: Date): boolean {
  return validUntil !== null && validUntil.getTime() < now.getTime();
}

export type TransitionCheck = { ok: true } | { ok: false; message: string };

export function checkTransition(input: {
  from: ProposalStatusValue;
  to: ProposalStatusValue;
  validUntil: Date | null;
  itemCount: number;
  totalCents: number;
  now: Date;
}): TransitionCheck {
  if (!canTransition(input.from, input.to)) {
    return { ok: false, message: "Esta mudança de situação não é permitida." };
  }

  if (input.to === "sent") {
    if (input.itemCount < 1 || input.totalCents <= 0) {
      return {
        ok: false,
        message: "Inclua ao menos um item com valor antes de enviar.",
      };
    }
    if (isPastValidity(input.validUntil, input.now)) {
      return {
        ok: false,
        message: "A validade já passou. Ajuste a data antes de enviar.",
      };
    }
  }

  if (input.to === "accepted" && isPastValidity(input.validUntil, input.now)) {
    return {
      ok: false,
      message:
        "A validade estourou sem aceite. Marque como expirada e crie nova proposta.",
    };
  }

  if (input.to === "expired" && !isPastValidity(input.validUntil, input.now)) {
    return { ok: false, message: "A validade ainda não venceu." };
  }

  return { ok: true };
}
