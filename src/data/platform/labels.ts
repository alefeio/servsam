/**
 * Rótulos pt-BR da interface de produção (/sistema). Não é conteúdo demonstrativo:
 * não carrega provenance e não deve ser misturado com `src/data/demo`.
 */

export const PROPOSAL_STATUS_LABELS = {
  draft: "Rascunho",
  sent: "Enviado",
  accepted: "Aceito",
  rejected: "Recusado",
  expired: "Expirado",
} as const;

export const PROPOSAL_STATUS_HINTS = {
  draft: "Em elaboração. Ainda não autoriza agenda.",
  sent: "Enviado ao cliente. Aguarda aprovação.",
  accepted: "Aprovado pelo cliente. Autoriza agendamento e ordem de serviço.",
  rejected: "Recusado pelo cliente.",
  expired: "A validade venceu sem aceite.",
} as const;

export const PURCHASE_ORDER_STATUS_LABELS = {
  registered: "Registrada",
  contracted: "Contratada",
  cancelled: "Cancelada",
} as const;

export const ENGAGEMENT_STATUS_LABELS = {
  active: "Ativa",
  cancelled: "Cancelada",
} as const;

export const ENGAGEMENT_ORIGIN_LABELS = {
  proposal: "Orçamento aceito",
  purchase_order: "O.C. recebida",
} as const;

export const PLATFORM_NAV = [
  {
    href: "/sistema",
    label: "Início",
    anyOf: ["dashboard.view"],
  },
  {
    href: "/sistema/clientes",
    label: "Clientes",
    anyOf: ["customer.view"],
  },
  {
    href: "/sistema/orcamentos",
    label: "Orçamentos",
    anyOf: ["proposal.view"],
  },
  {
    href: "/sistema/ordens-compra",
    label: "Ordens de compra",
    anyOf: ["contract.view"],
  },
  {
    href: "/sistema/contratacoes",
    label: "Contratações",
    anyOf: ["contract.view"],
  },
  {
    href: "/sistema/configuracoes/usuarios",
    label: "Usuários",
    anyOf: ["user.view", "user.manage"],
  },
  {
    href: "/sistema/configuracoes/perfis",
    label: "Perfis",
    anyOf: ["role.view", "role.manage"],
  },
] as const;
