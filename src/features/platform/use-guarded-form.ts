"use client";

import { startTransition, useActionState, type FormEvent } from "react";
import type { ActionState } from "@/lib/platform/action-helpers";

type FormAction = (
  previous: ActionState,
  formData: FormData,
) => Promise<ActionState>;

/**
 * Liga um formulário a uma Server Action sem perder o que a pessoa digitou.
 * `<form action={fn}>` zera os campos não controlados quando a ação termina, inclusive
 * quando ela devolve erro de validação. Aqui o envio é interceptado, a ação roda em
 * transição e os campos permanecem. Sucesso redireciona no servidor.
 */
export function useGuardedForm(action: FormAction) {
  const [state, dispatch, pending] = useActionState(
    action,
    null as ActionState,
  );

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => dispatch(data));
  }

  return { state, pending, onSubmit };
}
