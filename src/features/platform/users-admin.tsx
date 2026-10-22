"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createUserAction,
  setUserActiveAction,
  updateUserAction,
  type ActionState,
} from "@/lib/platform/actions";

export type UserRow = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  roleIds: string[];
};

export type RoleOption = { id: string; name: string };

export function UsersAdmin({
  users,
  roles,
  canManage,
}: {
  users: UserRow[];
  roles: RoleOption[];
  canManage: boolean;
}) {
  return (
    <div className="space-y-8">
      {canManage ? <CreateUserForm roles={roles} /> : null}
      <ul className="space-y-4">
        {users.map((user) => (
          <li key={user.id} className="rounded-xl border border-border bg-background p-4">
            <UserEditor user={user} roles={roles} canManage={canManage} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function CreateUserForm({ roles }: { roles: RoleOption[] }) {
  const [state, action, pending] = useActionState(createUserAction, null as ActionState);
  return (
    <form action={action} className="space-y-4 rounded-xl border border-border bg-background p-4">
      <h2 className="text-lg font-semibold text-navy">Novo usuário</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nome" name="name" />
        <Field label="E-mail" name="email" type="email" />
        <Field label="Senha inicial" name="password" type="password" />
      </div>
      <RoleChecks roles={roles} selected={[]} />
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        Criar usuário
      </Button>
    </form>
  );
}

function UserEditor({
  user,
  roles,
  canManage,
}: {
  user: UserRow;
  roles: RoleOption[];
  canManage: boolean;
}) {
  const [state, action, pending] = useActionState(updateUserAction, null as ActionState);
  if (!canManage) {
    return (
      <div>
        <p className="font-medium">{user.name}</p>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{user.email}</p>
        <p className="text-sm font-medium">{user.isActive ? "Ativo" : "Inativo"}</p>
      </div>
      <form action={action} className="space-y-4">
        <input type="hidden" name="userId" value={user.id} />
        <Field label="Nome" name="name" defaultValue={user.name} />
        <RoleChecks roles={roles} selected={user.roleIds} />
        {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
        <Button type="submit" disabled={pending}>
          Salvar
        </Button>
      </form>
      <form action={setUserActiveAction}>
        <input type="hidden" name="userId" value={user.id} />
        <input type="hidden" name="isActive" value={user.isActive ? "false" : "true"} />
        <Button type="submit" variant="outline">
          {user.isActive ? "Desativar" : "Ativar"}
        </Button>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={`${name}-${defaultValue ?? "new"}`}>{label}</Label>
      <Input id={`${name}-${defaultValue ?? "new"}`} name={name} type={type} defaultValue={defaultValue} required />
    </div>
  );
}

function RoleChecks({ roles, selected }: { roles: RoleOption[]; selected: string[] }) {
  const selectedSet = new Set(selected);
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">Papéis</legend>
      <div className="flex flex-wrap gap-3">
        {roles.map((role) => (
          <label key={role.id} className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="roleId" value={role.id} defaultChecked={selectedSet.has(role.id)} />
            {role.name}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
