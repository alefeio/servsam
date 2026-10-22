/**
 * Taxonomia da Sprint 9. Chaves pontilhadas, não o nome do papel.
 * "explicit" repete a matriz da Sprint 8. "inferred" repete célula marcada como inferida.
 * Processos e leads de produção não têm chave.
 */

export const PERMISSIONS = [
  { key: "dashboard.view", description: "Abrir o painel inicial do sistema" },
  { key: "customer.view", description: "Ver clientes, contatos e unidades" },
  { key: "customer.create", description: "Cadastrar clientes" },
  { key: "customer.update", description: "Editar clientes" },
  { key: "proposal.view", description: "Ver propostas" },
  { key: "proposal.create", description: "Criar propostas" },
  { key: "proposal.update", description: "Editar propostas" },
  { key: "proposal.send", description: "Enviar proposta ao cliente" },
  { key: "proposal.approve", description: "Registrar o aceite da proposta" },
  { key: "schedule.view", description: "Ver a agenda" },
  { key: "schedule.create", description: "Criar agendamentos" },
  { key: "schedule.update", description: "Alterar agendamentos" },
  { key: "service_order.view", description: "Ver ordens de serviço" },
  { key: "service_order.create", description: "Criar ordens de serviço" },
  { key: "service_order.update", description: "Editar ordens de serviço" },
  { key: "service_order.execute", description: "Registrar execução da ordem de serviço" },
  { key: "technical_report.view", description: "Ver relatórios técnicos" },
  { key: "technical_report.create", description: "Criar e emitir relatório técnico" },
  { key: "certificate.view", description: "Ver certificados e atestados" },
  { key: "certificate.create", description: "Montar certificado" },
  { key: "certificate.issue", description: "Emitir certificado" },
  { key: "contract.view", description: "Ver contratos" },
  { key: "contract.manage", description: "Criar e alterar contratos" },
  { key: "stock.view", description: "Ver produtos e estoque" },
  { key: "stock.manage", description: "Movimentar estoque e cadastro de produto" },
  { key: "finance.view", description: "Ver financeiro gerencial" },
  { key: "finance.manage", description: "Lançar e baixar financeiro gerencial" },
  { key: "employee.view", description: "Ver colaboradores" },
  { key: "employee.manage", description: "Editar colaboradores" },
  { key: "vehicle.view", description: "Ver veículos" },
  { key: "vehicle.manage", description: "Editar veículos" },
  { key: "tender.view", description: "Ver licitações" },
  { key: "tender.manage", description: "Editar licitações" },
  { key: "document.view", description: "Ver documentos e licenças" },
  { key: "document.manage", description: "Editar documentos e licenças" },
  { key: "report.managerial.view", description: "Ver relatórios gerenciais" },
  { key: "report.financial.view", description: "Ver relatórios do recorte financeiro" },
  { key: "user.view", description: "Ver usuários" },
  { key: "user.manage", description: "Criar, editar e ativar usuários" },
  { key: "role.view", description: "Ver papéis e permissões" },
  { key: "role.manage", description: "Editar papéis e permissões" },
  { key: "audit.view", description: "Ler a trilha de auditoria" },
] as const;

export type PermissionKey = (typeof PERMISSIONS)[number]["key"];

export const SEED_ROLE_CODES = [
  "ADMINISTRATIVO",
  "GERENCIA",
  "FINANCEIRO",
  "DIRETORIA",
] as const;

export type SeedRoleCode = (typeof SEED_ROLE_CODES)[number];

export const SEED_ROLE_LABELS: Record<SeedRoleCode, { name: string; description: string }> = {
  ADMINISTRATIVO: {
    name: "Administrativo",
    description: "Clientes, propostas, ordens, relatórios técnicos e certificados.",
  },
  GERENCIA: {
    name: "Gerência",
    description: "Acesso geral, sem o módulo financeiro e sem administrar papéis.",
  },
  FINANCEIRO: {
    name: "Financeiro",
    description: "Conjunto administrativo mais financeiro gerencial.",
  },
  DIRETORIA: {
    name: "Diretoria",
    description: "Todas as permissões, inclusive usuários, papéis e auditoria.",
  },
};

export type GrantBasis = "explicit" | "inferred";

const ALL_KEYS = PERMISSIONS.map((permission) => permission.key);

const ADMINISTRATIVO_EXPLICIT: PermissionKey[] = [
  "customer.view",
  "customer.create",
  "customer.update",
  "proposal.view",
  "proposal.create",
  "proposal.update",
  "proposal.send",
  "service_order.view",
  "service_order.create",
  "service_order.update",
  "service_order.execute",
  "technical_report.view",
  "technical_report.create",
  "certificate.view",
  "certificate.create",
  "certificate.issue",
];

const ADMINISTRATIVO_INFERRED: PermissionKey[] = [
  "dashboard.view",
  "proposal.approve",
  "schedule.view",
  "schedule.create",
  "schedule.update",
  "employee.view",
  "vehicle.view",
  "contract.view",
  "document.view",
];

const GERENCIA_EXCLUDED = new Set<PermissionKey>([
  "finance.view",
  "finance.manage",
  "user.view",
  "user.manage",
  "role.view",
  "role.manage",
  "audit.view",
  "report.financial.view",
]);

const FINANCEIRO_EXTRA_EXPLICIT: PermissionKey[] = [
  "finance.view",
  "finance.manage",
  "report.financial.view",
];

const FINANCEIRO_EXTRA_INFERRED: PermissionKey[] = ["contract.manage", "tender.view"];

/** Permissões que o papel sistema Diretoria não pode perder, para não travar a administração. */
export const DIRETORIA_LOCKED_PERMISSIONS: PermissionKey[] = [
  "user.manage",
  "role.manage",
  "audit.view",
];

export function seedGrantsFor(role: SeedRoleCode): { key: PermissionKey; basis: GrantBasis }[] {
  if (role === "DIRETORIA") {
    return ALL_KEYS.map((key) => ({ key, basis: "explicit" }));
  }

  if (role === "GERENCIA") {
    return ALL_KEYS.filter((key) => !GERENCIA_EXCLUDED.has(key)).map((key) => ({
      key,
      basis: "explicit",
    }));
  }

  const grants = new Map<PermissionKey, GrantBasis>();
  for (const key of ADMINISTRATIVO_EXPLICIT) grants.set(key, "explicit");
  for (const key of ADMINISTRATIVO_INFERRED) grants.set(key, "inferred");

  if (role === "FINANCEIRO") {
    for (const key of FINANCEIRO_EXTRA_EXPLICIT) grants.set(key, "explicit");
    for (const key of FINANCEIRO_EXTRA_INFERRED) grants.set(key, "inferred");
  }

  return [...grants.entries()].map(([key, basis]) => ({ key, basis }));
}

export function hasPermission(granted: ReadonlySet<string>, permission: string): boolean {
  return granted.has(permission);
}

export function unionPermissions(grants: readonly (readonly string[])[]): Set<string> {
  const effective = new Set<string>();
  for (const grant of grants) {
    for (const key of grant) effective.add(key);
  }
  return effective;
}
