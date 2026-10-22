"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createRoleAction, updateRolePermissionsAction, type ActionState } from "@/lib/platform/actions";

export type PermissionOption = { key: string; description: string };
export type RolePanel = {
  id: string;
  code: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissionKeys: string[];
};

export function RolesAdmin({
  roles,
  permissions,
  canManage,
}: {
  roles: RolePanel[];
  permissions: PermissionOption[];
  canManage: boolean;
}) {
  return (
    <div className="space-y-8">
      {canManage ? <CreateRoleForm /> : null}
      {roles.map((role) => (
        <RolePermissionsForm key={role.id} role={role} permissions={permissions} canManage={canManage} />
      ))}
    </div>
  );
}

function CreateRoleForm() {
  const [state, action, pending] = useActionState(createRoleAction, null as ActionState);
  return (
    <form action={action} className="space-y-4 rounded-xl border border-border bg-background p-4">
      <h2 className="text-lg font-semibold text-navy">Novo papel</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="role-name">Nome</Label>
          <Input id="role-name" name="name" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role-code">Código</Label>
          <Input id="role-code" name="code" required placeholder="OPERACAO" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="role-description">Descrição</Label>
        <Input id="role-description" name="description" required />
      </div>
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        Criar papel
      </Button>
    </form>
  );
}

function RolePermissionsForm({
  role,
  permissions,
  canManage,
}: {
  role: RolePanel;
  permissions: PermissionOption[];
  canManage: boolean;
}) {
  const [state, action, pending] = useActionState(updateRolePermissionsAction, null as ActionState);
  const selected = new Set(role.permissionKeys);
  return (
    <form action={action} className="space-y-4 rounded-xl border border-border bg-background p-4">
      <input type="hidden" name="roleId" value={role.id} />
      <div>
        <h2 className="text-lg font-semibold text-navy">{role.name}</h2>
        <p className="text-sm text-muted-foreground">
          {role.code}
          {role.isSystem ? " · papel semente" : ""} — {role.description}
        </p>
      </div>
      <fieldset className="grid gap-2 md:grid-cols-2">
        <legend className="sr-only">Permissões de {role.name}</legend>
        {permissions.map((permission) => (
          <label key={permission.key} className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              name="permission"
              value={permission.key}
              defaultChecked={selected.has(permission.key)}
              disabled={!canManage}
            />
            <span>
              <span className="font-medium">{permission.key}</span>
              <span className="block text-muted-foreground">{permission.description}</span>
            </span>
          </label>
        ))}
      </fieldset>
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {canManage ? (
        <Button type="submit" disabled={pending}>
          Salvar permissões
        </Button>
      ) : null}
    </form>
  );
}
