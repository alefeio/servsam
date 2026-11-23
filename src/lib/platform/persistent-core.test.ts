/**
 * @vitest-environment node
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { integrationDatabaseGuard } from "@/lib/db/test-guard";
import {
  detectBrDocument,
  formatBrDocument,
  isValidCnpj,
  isValidCpf,
} from "@/lib/platform/br-document";
import {
  contactInputSchema,
  customerInputSchema,
  unitInputSchema,
} from "@/lib/platform/customer-schemas";
import {
  businessYear,
  endOfBusinessDay,
  toDateInputValue,
} from "@/lib/platform/dates";
import {
  parseContactForm,
  parseCustomerForm,
  parseProposalForm,
} from "@/lib/platform/form-parsers";
import {
  centsToInputValue,
  computeProposalTotals,
  formatCents,
  lineTotalCents,
  MAX_CENTS,
  parseBrlToCents,
} from "@/lib/platform/money";
import { getNavItems } from "@/lib/platform/nav";
import { PERMISSIONS, seedGrantsFor } from "@/lib/platform/permissions";
import { proposalInputSchema } from "@/lib/platform/proposal-schemas";
import {
  allowedTransitions,
  canRevise,
  canTransition,
  checkTransition,
  isEditable,
  isPastValidity,
  permissionForTransition,
  PROPOSAL_STATUSES,
} from "@/lib/platform/proposal-state";
import { buildProposalSummary } from "@/lib/platform/proposal-summary";
import { formatProposalCode } from "@/lib/platform/proposals";

describe("CPF e CNPJ", () => {
  it("valida dígitos verificadores", () => {
    expect(isValidCpf("529.982.247-25")).toBe(true);
    expect(isValidCpf("529.982.247-24")).toBe(false);
    expect(isValidCpf("111.111.111-11")).toBe(false);
    expect(isValidCnpj("11.222.333/0001-81")).toBe(true);
    expect(isValidCnpj("11.222.333/0001-80")).toBe(false);
    expect(detectBrDocument("52998224725")).toBe("cpf");
    expect(detectBrDocument("11222333000181")).toBe("cnpj");
    expect(detectBrDocument("123")).toBeNull();
  });

  it("formata para exibição", () => {
    expect(formatBrDocument("52998224725")).toBe("529.982.247-25");
    expect(formatBrDocument("11222333000181")).toBe("11.222.333/0001-81");
    expect(formatBrDocument(null)).toBe("");
  });
});

describe("dinheiro em centavos", () => {
  it("lê valores em reais sem usar float", () => {
    expect(parseBrlToCents("1.234,56")).toEqual({ ok: true, cents: 123456 });
    expect(parseBrlToCents("R$ 99,9")).toEqual({ ok: true, cents: 9990 });
    expect(parseBrlToCents("1234.56")).toEqual({ ok: true, cents: 123456 });
    expect(parseBrlToCents("1.234")).toEqual({ ok: true, cents: 123400 });
    expect(parseBrlToCents("0")).toEqual({ ok: true, cents: 0 });
    expect(parseBrlToCents("0,10")).toEqual({ ok: true, cents: 10 });
  });

  it("rejeita lixo, três casas e valor acima do teto", () => {
    for (const bad of ["", "abc", "1,234", "-5", "1,2,3", "99999999999"]) {
      expect(parseBrlToCents(bad).ok).toBe(false);
    }
    expect(parseBrlToCents(String(MAX_CENTS / 100 + 1)).ok).toBe(false);
  });

  it("formata e devolve ao campo", () => {
    expect(formatCents(123456).replace(/\s/g, " ")).toBe("R$ 1.234,56");
    expect(centsToInputValue(123456)).toBe("1234,56");
    expect(centsToInputValue(5)).toBe("0,05");
  });

  it("calcula linha com quantidade decimal e arredonda ao centavo", () => {
    expect(lineTotalCents(2, 1050)).toBe(2100);
    expect(lineTotalCents(1.5, 1000)).toBe(1500);
    expect(lineTotalCents("0,333", 100)).toBe(33);
    expect(lineTotalCents(0.001, 150)).toBe(0);
    expect(lineTotalCents(0.005, 100)).toBe(1);
  });

  it("soma itens, aplica desconto e recusa excesso", () => {
    const lines = [
      { quantity: 2, unitPriceCents: 10000 },
      { quantity: 1, unitPriceCents: 5000 },
    ];
    expect(computeProposalTotals(lines, 1000)).toEqual({
      ok: true,
      subtotalCents: 25000,
      discountCents: 1000,
      totalCents: 24000,
    });
    expect(computeProposalTotals(lines, 25001)).toEqual({
      ok: false,
      reason: "discount_exceeds_subtotal",
    });
    expect(
      computeProposalTotals(
        [{ quantity: 999999.999, unitPriceCents: MAX_CENTS }],
        0,
      ),
    ).toEqual({ ok: false, reason: "overflow" });
  });
});

describe("datas de negócio", () => {
  it("vira o fim do dia em Brasília", () => {
    expect(endOfBusinessDay("2026-12-31")?.toISOString()).toBe(
      "2027-01-01T02:59:59.999Z",
    );
    expect(toDateInputValue(endOfBusinessDay("2026-12-31") as Date)).toBe(
      "2026-12-31",
    );
    expect(endOfBusinessDay("2026-02-30")).toBeNull();
    expect(endOfBusinessDay("31/12/2026")).toBeNull();
  });

  it("calcula o ano no fuso de Brasília", () => {
    expect(businessYear(new Date("2027-01-01T01:00:00Z"))).toBe(2026);
    expect(businessYear(new Date("2027-01-01T04:00:00Z"))).toBe(2027);
  });

  it("numera o orçamento por ano e sequência", () => {
    expect(formatProposalCode(2026, 1)).toBe("ORC-2026-0001");
    expect(formatProposalCode(2026, 12345)).toBe("ORC-2026-12345");
  });
});

describe("máquina de estados da proposta", () => {
  const now = new Date("2026-11-18T12:00:00Z");
  const future = new Date("2026-12-31T12:00:00Z");
  const past = new Date("2026-11-01T12:00:00Z");

  it("só permite as transições da arquitetura", () => {
    expect(allowedTransitions("draft")).toEqual(["sent"]);
    expect(allowedTransitions("sent")).toEqual([
      "accepted",
      "rejected",
      "expired",
    ]);
    for (const terminal of ["accepted", "rejected", "expired"] as const) {
      expect(allowedTransitions(terminal)).toEqual([]);
    }
    expect(canTransition("draft", "accepted")).toBe(false);
    expect(canTransition("accepted", "draft")).toBe(false);
    expect(canTransition("expired", "sent")).toBe(false);
  });

  it("edita só rascunho e revisa só decididas", () => {
    expect(PROPOSAL_STATUSES.filter(isEditable)).toEqual(["draft"]);
    expect(PROPOSAL_STATUSES.filter(canRevise)).toEqual([
      "accepted",
      "rejected",
      "expired",
    ]);
  });

  it("exige a chave de permissão por destino", () => {
    expect(permissionForTransition("sent")).toBe("proposal.send");
    expect(permissionForTransition("accepted")).toBe("proposal.approve");
    expect(permissionForTransition("rejected")).toBe("proposal.approve");
    expect(permissionForTransition("expired")).toBe("proposal.update");
    expect(permissionForTransition("draft")).toBeNull();
  });

  it("não envia sem item, sem valor ou com validade vencida", () => {
    const base = {
      from: "draft",
      to: "sent",
      validUntil: future,
      itemCount: 1,
      totalCents: 100,
      now,
    } as const;
    expect(checkTransition(base).ok).toBe(true);
    expect(checkTransition({ ...base, itemCount: 0 }).ok).toBe(false);
    expect(checkTransition({ ...base, totalCents: 0 }).ok).toBe(false);
    expect(checkTransition({ ...base, validUntil: past }).ok).toBe(false);
    expect(checkTransition({ ...base, validUntil: null }).ok).toBe(true);
  });

  it("não aceita depois da validade e só expira depois dela", () => {
    const sent = {
      from: "sent",
      validUntil: future,
      itemCount: 1,
      totalCents: 100,
      now,
    } as const;
    expect(checkTransition({ ...sent, to: "accepted" }).ok).toBe(true);
    expect(
      checkTransition({ ...sent, to: "accepted", validUntil: past }).ok,
    ).toBe(false);
    expect(checkTransition({ ...sent, to: "expired" }).ok).toBe(false);
    expect(
      checkTransition({ ...sent, to: "expired", validUntil: past }).ok,
    ).toBe(true);
    expect(
      checkTransition({ ...sent, to: "expired", validUntil: null }).ok,
    ).toBe(false);
    expect(
      checkTransition({ ...sent, to: "rejected", validUntil: past }).ok,
    ).toBe(true);
  });

  it("detecta validade vencida", () => {
    expect(isPastValidity(past, now)).toBe(true);
    expect(isPastValidity(future, now)).toBe(false);
    expect(isPastValidity(null, now)).toBe(false);
  });
});

describe("resumo do painel", () => {
  it("agrega por situação com zeros nas ausentes", () => {
    const summary = buildProposalSummary(
      [
        { status: "sent", count: 2, totalCents: 30000 },
        { status: "accepted", count: 1, totalCents: 12000 },
      ],
      1,
    );
    expect(summary.totalCount).toBe(3);
    expect(summary.byStatus.draft).toEqual({ count: 0, totalCents: 0 });
    expect(summary.openPipelineCents).toBe(30000);
    expect(summary.acceptedCents).toBe(12000);
    expect(summary.sentPastValidity).toBe(1);
  });
});

describe("navegação por permissão", () => {
  it("mostra Clientes e Orçamentos só com a chave de leitura", () => {
    const admin = new Set(
      seedGrantsFor("ADMINISTRATIVO").map((grant) => grant.key as string),
    );
    const labels = getNavItems(admin).map((item) => item.label);
    expect(labels).toContain("Clientes");
    expect(labels).toContain("Orçamentos");
    expect(labels).not.toContain("Usuários");

    expect(
      getNavItems(new Set(["dashboard.view"])).map((item) => item.label),
    ).toEqual(["Início"]);
    expect(
      getNavItems(new Set(["proposal.view"])).map((item) => item.label),
    ).toEqual(["Orçamentos"]);
    expect(
      getNavItems(new Set(["customer.view"])).map((item) => item.label),
    ).toEqual(["Clientes"]);
    expect(getNavItems(new Set()).length).toBe(0);
  });

  it("decide pela chave, não pelo nome do papel", () => {
    expect(getNavItems(new Set(["DIRETORIA"])).length).toBe(0);
  });
});

describe("leitura de formulários", () => {
  function form(entries: [string, string][]) {
    const data = new FormData();
    for (const [key, value] of entries) data.append(key, value);
    return data;
  }

  it("monta itens, ignora linha vazia e converte para centavos", () => {
    const parsed = parseProposalForm(
      form([
        ["customerId", "c1"],
        ["title", "Dedetização"],
        ["itemDescription", "Aplicação"],
        ["itemQuantity", "2"],
        ["itemUnitPrice", "1.500,50"],
        ["itemDescription", ""],
        ["itemQuantity", ""],
        ["itemUnitPrice", ""],
        ["discount", "10,00"],
      ]),
    );
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.input.items).toEqual([
        { description: "Aplicação", quantity: 2, unitPriceCents: 150050 },
      ]);
      expect(parsed.input.discountCents).toBe(1000);
    }
  });

  it("recusa valor ou quantidade inválidos com mensagem", () => {
    const badPrice = parseProposalForm(
      form([
        ["itemDescription", "X"],
        ["itemQuantity", "1"],
        ["itemUnitPrice", "abc"],
      ]),
    );
    expect(badPrice).toEqual({
      ok: false,
      message: "Item 1: valor unitário inválido.",
    });
    const badQuantity = parseProposalForm(
      form([
        ["itemDescription", "X"],
        ["itemQuantity", "0,0001"],
        ["itemUnitPrice", "1"],
      ]),
    );
    expect(badQuantity.ok).toBe(false);
    expect(parseProposalForm(form([["discount", "x"]]))).toEqual({
      ok: false,
      message: "Desconto inválido.",
    });
  });

  it("lê cliente e contato", () => {
    expect(parseCustomerForm(form([["legalName", " Acme "]])).legalName).toBe(
      " Acme ",
    );
    expect(parseContactForm(form([["isPrimary", "on"]])).isPrimary).toBe(true);
    expect(parseContactForm(form([])).isPrimary).toBe(false);
  });
});

describe("schemas Zod", () => {
  it("cliente: documento opcional, mas válido quando informado", () => {
    const ok = customerInputSchema.safeParse({
      legalName: "Condomínio Azul",
      document: "11.222.333/0001-81",
    });
    expect(ok.success).toBe(true);
    if (ok.success) expect(ok.data.document).toBe("11222333000181");
    expect(
      customerInputSchema.safeParse({ legalName: "Sem doc" }).success,
    ).toBe(true);
    expect(
      customerInputSchema.safeParse({ legalName: "Doc ruim", document: "123" })
        .success,
    ).toBe(false);
    expect(customerInputSchema.safeParse({ legalName: "A" }).success).toBe(
      false,
    );
  });

  it("contato: e-mail e telefone", () => {
    expect(
      contactInputSchema.safeParse({
        name: "Maria",
        email: "maria@exemplo.com.br",
        phone: "(11) 99999-0000",
      }).success,
    ).toBe(true);
    expect(
      contactInputSchema.safeParse({ name: "Maria", email: "nao-email" })
        .success,
    ).toBe(false);
    expect(
      contactInputSchema.safeParse({ name: "Maria", phone: "123" }).success,
    ).toBe(false);
  });

  it("unidade: UF e CEP", () => {
    const parsed = unitInputSchema.safeParse({
      name: "Sede",
      state: "sp",
      postalCode: "01310-100",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.state).toBe("SP");
      expect(parsed.data.postalCode).toBe("01310100");
    }
    expect(
      unitInputSchema.safeParse({ name: "Sede", state: "XX" }).success,
    ).toBe(false);
    expect(
      unitInputSchema.safeParse({ name: "Sede", postalCode: "123" }).success,
    ).toBe(false);
  });

  it("proposta: exige item, aceita validade válida", () => {
    const base = {
      customerId: "c1",
      title: "Controle de pragas",
      items: [{ description: "Aplicação", quantity: 1, unitPriceCents: 1000 }],
    };
    expect(proposalInputSchema.safeParse(base).success).toBe(true);
    expect(proposalInputSchema.safeParse({ ...base, items: [] }).success).toBe(
      false,
    );
    expect(
      proposalInputSchema.safeParse({ ...base, validUntil: "2026-13-40" })
        .success,
    ).toBe(false);
    expect(
      proposalInputSchema.safeParse({ ...base, validUntil: "2026-12-31" })
        .success,
    ).toBe(true);
    expect(
      proposalInputSchema.safeParse({
        ...base,
        items: [{ description: "X1", quantity: 1.0005, unitPriceCents: 1 }],
      }).success,
    ).toBe(false);
  });
});

describe("papéis semente e chaves", () => {
  const keys = new Set(
    PERMISSIONS.map((permission) => permission.key as string),
  );

  it("a taxonomia já traz as chaves de cliente e proposta", () => {
    for (const key of [
      "customer.view",
      "customer.create",
      "customer.update",
      "proposal.view",
      "proposal.create",
      "proposal.update",
      "proposal.send",
      "proposal.approve",
    ]) {
      expect(keys.has(key)).toBe(true);
    }
  });

  it("Administrativo, Gerência, Financeiro e Diretoria operam clientes e orçamentos", () => {
    for (const role of [
      "ADMINISTRATIVO",
      "GERENCIA",
      "FINANCEIRO",
      "DIRETORIA",
    ] as const) {
      const granted = new Set(
        seedGrantsFor(role).map((grant) => grant.key as string),
      );
      for (const key of [
        "customer.view",
        "customer.update",
        "proposal.view",
        "proposal.send",
        "contract.view",
        "contract.manage",
      ]) {
        expect(granted.has(key), `${role} ${key}`).toBe(true);
      }
    }
  });

  it("toda chave usada nos serviços e nas ações existe na taxonomia", () => {
    const files = [
      "customers.ts",
      "customer-actions.ts",
      "proposals.ts",
      "proposal-actions.ts",
      "proposal-state.ts",
      "engagements.ts",
      "engagement-actions.ts",
      "purchase-orders.ts",
      "purchase-order-actions.ts",
      "nav.ts",
    ];
    const pattern =
      /"((?:customer|proposal|audit|dashboard|contract)\.[a-z_]+)"/g;
    const used = new Set<string>();
    for (const file of files) {
      const source = readFileSync(
        join(process.cwd(), "src/lib/platform", file),
        "utf8",
      );
      for (const match of source.matchAll(pattern)) used.add(match[1]);
    }
    used.add("customer.view");
    expect(used.size).toBeGreaterThan(5);
    for (const key of used) expect(keys.has(key), key).toBe(true);
  });
});

function listSource(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...listSource(full));
    else if (/\.(ts|tsx)$/.test(name) && !/\.test\.(ts|tsx)$/.test(name))
      out.push(full);
  }
  return out;
}

describe("endurecimento de /sistema", () => {
  const roots = [
    "src/app/sistema",
    "src/features/platform",
    "src/lib/platform",
  ].map((dir) => join(process.cwd(), dir));
  const files = roots.flatMap(listSource);

  it("não mistura sessão, fixture ou localStorage do demo", () => {
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      expect(source, file).not.toMatch(
        /@\/lib\/demo|@\/data\/demo|localStorage|DEMO_SESSION|demo-repository/,
      );
    }
  });

  it("a UI não lê variáveis de ambiente nem segredos", () => {
    const ui = [
      ...listSource(join(process.cwd(), "src/app/sistema")),
      ...listSource(join(process.cwd(), "src/features/platform")),
    ];
    for (const file of ui) {
      const source = readFileSync(file, "utf8");
      expect(source, file).not.toMatch(
        /process\.env|DATABASE_URL|POSTGRES_URL|BETTER_AUTH_SECRET|HOMOL_/,
      );
    }
  });

  it("toda consulta dos serviços de cliente e proposta filtra por organizationId", () => {
    for (const file of ["customers.ts", "proposals.ts"]) {
      const source = readFileSync(
        join(process.cwd(), "src/lib/platform", file),
        "utf8",
      );
      const calls = [
        ...source.matchAll(
          /\.(findFirst|findMany|count|groupBy|updateMany|deleteMany)\(\{/g,
        ),
      ];
      expect(calls.length).toBeGreaterThan(5);
      for (const call of calls) {
        const window = source.slice(call.index, (call.index ?? 0) + 420);
        expect(window, `${file}: ${window.slice(0, 80)}`).toContain(
          "organizationId",
        );
      }
    }
  });

  it("toda Server Action de cliente e proposta passa por runGuarded", () => {
    for (const file of ["customer-actions.ts", "proposal-actions.ts"]) {
      const source = readFileSync(
        join(process.cwd(), "src/lib/platform", file),
        "utf8",
      );
      expect(source.startsWith('"use server"')).toBe(true);
      const exported = source.match(/export async function/g)?.length ?? 0;
      const guarded = source.match(/runGuarded\(/g)?.length ?? 0;
      expect(exported).toBeGreaterThanOrEqual(5);
      expect(guarded).toBe(exported);
    }
  });

  it("exclusão é lógica: nenhum delete de cliente, contato, unidade ou proposta", () => {
    for (const file of ["customers.ts", "proposals.ts"]) {
      const source = readFileSync(
        join(process.cwd(), "src/lib/platform", file),
        "utf8",
      );
      expect(source).not.toMatch(
        /(customer|customerContact|customerUnit|proposal)\.delete(Many)?\(/,
      );
    }
  });
});

describe("guarda dos testes de integração", () => {
  it("recusa production, development e preview sem HOMOL", () => {
    expect(
      integrationDatabaseGuard({
        VERCEL_ENV: "production",
        DATABASE_ENV: "preview",
      }).allowed,
    ).toBe(false);
    expect(
      integrationDatabaseGuard({ DATABASE_ENV: "production" }).allowed,
    ).toBe(false);
    expect(
      integrationDatabaseGuard({ DATABASE_ENV: "development" }).allowed,
    ).toBe(false);
    expect(integrationDatabaseGuard({}).allowed).toBe(false);
    expect(integrationDatabaseGuard({ DATABASE_ENV: "preview" }).allowed).toBe(
      false,
    );
    expect(
      integrationDatabaseGuard({
        DATABASE_ENV: "preview",
        HOMOL_POSTGRES_URL: "[SENSITIVE]",
      }).allowed,
    ).toBe(false);
  });

  it("aceita preview com HOMOL e test", () => {
    expect(
      integrationDatabaseGuard({
        DATABASE_ENV: "preview",
        HOMOL_POSTGRES_URL: "postgresql://homol",
      }).allowed,
    ).toBe(true);
    expect(integrationDatabaseGuard({ DATABASE_ENV: "test" }).allowed).toBe(
      true,
    );
  });
});
