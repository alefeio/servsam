"use server";

import { runGuarded, type ActionState } from "@/lib/platform/action-helpers";
import { parseProposalForm } from "@/lib/platform/form-parsers";
import {
  archiveProposal,
  createProposal,
  reviseProposal,
  transitionProposal,
  updateProposal,
} from "@/lib/platform/proposals";
import {
  permissionForTransition,
  isProposalStatus,
} from "@/lib/platform/proposal-state";

const LIST = "/sistema/orcamentos";
const detail = (id: string) => `${LIST}/${id}`;
const field = (form: FormData, name: string) => String(form.get(name) ?? "");

export async function createProposalAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runGuarded("proposal.create", async (actor) => {
    const parsed = parseProposalForm(formData);
    if (!parsed.ok) return parsed;
    const result = await createProposal(actor, parsed.input);
    if (!result.ok) return result;
    return { ok: true, redirectTo: detail(result.data.id) };
  });
}

export async function updateProposalAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runGuarded("proposal.update", async (actor) => {
    const proposalId = field(formData, "proposalId");
    const parsed = parseProposalForm(formData);
    if (!parsed.ok) return parsed;
    const result = await updateProposal(actor, proposalId, parsed.input);
    if (!result.ok) return result;
    return { ok: true, redirectTo: detail(proposalId) };
  });
}

export async function transitionProposalAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const target = field(formData, "to");
  // A chave exigida depende do destino. O serviço confere de novo, mas o gate fica no servidor.
  const permission = isProposalStatus(target)
    ? permissionForTransition(target)
    : null;
  return runGuarded(permission ?? "proposal.update", async (actor) => {
    const proposalId = field(formData, "proposalId");
    const result = await transitionProposal(actor, proposalId, target, {
      reason: field(formData, "reason"),
    });
    if (!result.ok) return result;
    return { ok: true, redirectTo: detail(proposalId) };
  });
}

export async function archiveProposalAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runGuarded("proposal.update", async (actor) => {
    const result = await archiveProposal(actor, field(formData, "proposalId"));
    if (!result.ok) return result;
    return { ok: true, redirectTo: LIST };
  });
}

export async function reviseProposalAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runGuarded("proposal.create", async (actor) => {
    const result = await reviseProposal(actor, field(formData, "proposalId"));
    if (!result.ok) return result;
    return { ok: true, redirectTo: detail(result.data.id) };
  });
}
