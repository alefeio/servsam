"use client";

import { useActionState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FutureCapabilityNotice,
  IMPLEMENTED_PERMISSION_PREFIXES,
  PERMISSION_DOMAIN_LABELS,
  permissionDomain,
} from "@/features/platform/form-parts";
import {
  createRoleAction,
  updateRolePermissionsAction,
  type ActionState,
} from "@/lib/platform/actions";

export type PermissionOption = { key: string; description: string };
export type RolePanel = {
  id: string;
  code: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissionKeys: string[];
};

function groupPermissions(permissions: PermissionOption[]) {
  const groups = new Map<string, PermissionOption[]>();
  for (const permission of permissions) {
    const domain = permissionDomain(permission.key);
    const list = groups.get(domain) ?? [];
    list.push(permission);
    groups.set(domain, list);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
}

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
      <FutureCapabilityNotice>
        Permissões de agenda, OS, contratos, estoque e financeiro já existem no RBAC
        para sprints futuras, mas não abrem módulos operacionais nesta versão.
      </FutureCapabilityNotice>
      {canManage ? <CreateRoleForm /> : null}
      {roles.map((role) => (
        <RolePermissionsForm
          key={role.id}
          role={role}
          permissions={permissions}
          canManage={canManage}
        />
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
      {state?.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Criando..." : "Criar papel"}
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
  const [state, action, pending] = useActionState(
    updateRolePermissionsAction,
    null as ActionState,
  );
  const selected = new Set(role.permissionKeys);
  const groups = useMemo(() => groupPermissions(permissions), [permissions]);

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
      <div className="space-y-3">
        {groups.map(([domain, items]) => {
          const implemented = IMPLEMENTED_PERMISSION_PREFIXES.has(domain);
          const selectedInGroup = items.filter((item) => selected.has(item.key)).length;
          return (
            <details
              key={domain}
              className="rounded-lg border border-border bg-muted/20 open:bg-background"
              open={implemented}
            >
              <summary className="cursor-pointer list-none px-3 py-2 text-sm font-semibold text-navy marker:content-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal">
                <span className="flex flex-wrap items-center gap-2">
                  <span aria-hidden="true" className="text-muted-foreground">
                    ▾
                  </span>
                  {PERMISSION_DOMAIN_LABELS[domain] ?? domain}
                  <span className="text-xs font-normal text-muted-foreground">
                    {selectedInGroup}/{items.length}
                  </span>
                  {!implemented ? (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      Sprint futura
                    </span>
                  ) : null}
                </span>
              </summary>
              <fieldset className="space-y-2 border-t border-border px-3 py-3">
                <legend className="sr-only">
                  Permissões do domínio {PERMISSION_DOMAIN_LABELS[domain] ?? domain}
                </legend>
                <div className="grid gap-2 md:grid-cols-2">
                  {items.map((permission) => (
                    <label
                      key={permission.key}
                      className="flex items-start gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        name="permission"
                        value={permission.key}
                        defaultChecked={selected.has(permission.key)}
                        disabled={!canManage}
                        className="mt-1"
                      />
                      <span>
                        <span className="font-medium">{permission.description}</span>
                        <span className="block text-xs text-muted-foreground">
                          {permission.key}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </details>
          );
        })}
      </div>
      {state?.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      {canManage ? (
        <Button
          type="submit"
          disabled={pending}
          onClick={(event) => {
            if (
              !window.confirm(
                `Salvar as permissões do perfil “${role.name}”? Alterações sensíveis afetam o acesso imediato.`,
              )
            ) {
              event.preventDefault();
            }
          }}
        >
          {pending ? "Salvando..." : "Salvar permissões"}
        </Button>
      ) : null}
    </form>
  );
}
