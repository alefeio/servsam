"use server";

import { runGuarded, type ActionState } from "@/lib/platform/action-helpers";
import {
  addCustomerContact,
  addCustomerUnit,
  archiveCustomer,
  archiveCustomerContact,
  archiveCustomerUnit,
  createCustomer,
  restoreCustomer,
  updateCustomer,
  updateCustomerContact,
  updateCustomerUnit,
} from "@/lib/platform/customers";
import {
  parseContactForm,
  parseCustomerForm,
  parseUnitForm,
} from "@/lib/platform/form-parsers";

const LIST = "/sistema/clientes";
const detail = (id: string) => `${LIST}/${id}`;
const field = (form: FormData, name: string) => String(form.get(name) ?? "");

export async function createCustomerAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runGuarded("customer.create", async (actor) => {
    const result = await createCustomer(actor, parseCustomerForm(formData));
    if (!result.ok) return result;
    return { ok: true, redirectTo: detail(result.data.id) };
  });
}

export async function updateCustomerAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runGuarded("customer.update", async (actor) => {
    const customerId = field(formData, "customerId");
    const result = await updateCustomer(
      actor,
      customerId,
      parseCustomerForm(formData),
    );
    if (!result.ok) return result;
    return { ok: true, redirectTo: detail(customerId) };
  });
}

export async function archiveCustomerAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runGuarded("customer.update", async (actor) => {
    const result = await archiveCustomer(actor, field(formData, "customerId"));
    if (!result.ok) return result;
    return { ok: true, redirectTo: LIST };
  });
}

export async function restoreCustomerAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runGuarded("customer.update", async (actor) => {
    const customerId = field(formData, "customerId");
    const result = await restoreCustomer(actor, customerId);
    if (!result.ok) return result;
    return { ok: true, redirectTo: detail(customerId) };
  });
}

export async function addContactAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runGuarded("customer.update", async (actor) => {
    const customerId = field(formData, "customerId");
    const result = await addCustomerContact(
      actor,
      customerId,
      parseContactForm(formData),
    );
    if (!result.ok) return result;
    return { ok: true, redirectTo: detail(customerId) };
  });
}

export async function updateContactAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runGuarded("customer.update", async (actor) => {
    const result = await updateCustomerContact(
      actor,
      field(formData, "contactId"),
      parseContactForm(formData),
    );
    if (!result.ok) return result;
    return { ok: true, redirectTo: detail(field(formData, "customerId")) };
  });
}

export async function archiveContactAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runGuarded("customer.update", async (actor) => {
    const result = await archiveCustomerContact(
      actor,
      field(formData, "contactId"),
    );
    if (!result.ok) return result;
    return { ok: true, redirectTo: detail(result.data.customerId) };
  });
}

export async function addUnitAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runGuarded("customer.update", async (actor) => {
    const customerId = field(formData, "customerId");
    const result = await addCustomerUnit(
      actor,
      customerId,
      parseUnitForm(formData),
    );
    if (!result.ok) return result;
    return { ok: true, redirectTo: detail(customerId) };
  });
}

export async function updateUnitAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runGuarded("customer.update", async (actor) => {
    const result = await updateCustomerUnit(
      actor,
      field(formData, "unitId"),
      parseUnitForm(formData),
    );
    if (!result.ok) return result;
    return { ok: true, redirectTo: detail(field(formData, "customerId")) };
  });
}

export async function archiveUnitAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runGuarded("customer.update", async (actor) => {
    const result = await archiveCustomerUnit(actor, field(formData, "unitId"));
    if (!result.ok) return result;
    return { ok: true, redirectTo: detail(result.data.customerId) };
  });
}
