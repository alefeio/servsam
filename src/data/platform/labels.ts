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

export const SERVICE_ORDER_STATUS_LABELS = {
  issued: "Emitida",
  scheduled: "Agendada",
  in_progress: "Em execução",
  completed: "Concluída",
  cancelled: "Cancelada",
} as const;

export const APPOINTMENT_STATUS_LABELS = {
  scheduled: "Agendado",
  completed: "Realizado",
  cancelled: "Cancelado",
} as const;

export const BILLING_REQUEST_STATUS_LABELS = {
  requested: "Solicitada",
  under_review: "Em análise",
  processed: "Processada",
  cancelled: "Cancelada",
} as const;

export const BILLING_REQUEST_TYPE_LABELS = {
  invoice_provision: "Providências de nota fiscal",
} as const;

export const RECEIPT_KIND_LABELS = {
  signal: "Sinal",
  installment: "Parcela / recebimento",
  other: "Outro recebimento",
} as const;

export const RECEIPT_STATUS_LABELS = {
  pending: "Aguardando confirmação",
  confirmed: "Confirmado pelo Financeiro",
  rejected: "Rejeitado",
  cancelled: "Cancelado",
  reversed: "Revertido",
} as const;

export const RECEIPT_PAYMENT_METHOD_LABELS = {
  pix: "PIX",
  transfer: "Transferência",
  cash: "Dinheiro",
  check: "Cheque",
  card: "Cartão",
  other: "Outro",
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
    href: "/sistema/ordens-servico",
    label: "Ordens de serviço",
    anyOf: ["service_order.view"],
  },
  {
    href: "/sistema/agenda",
    label: "Agenda",
    anyOf: ["schedule.view"],
  },
  {
    href: "/sistema/colaboradores",
    label: "Colaboradores",
    anyOf: ["employee.view"],
  },
  {
    href: "/sistema/financeiro",
    label: "Financeiro",
    anyOf: ["finance.view", "finance.manage"],
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
