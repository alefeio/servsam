/**
 * Envio transacional de e-mail (servidor). Não loga tokens, URLs com token nem API keys.
 */

export type SendPasswordResetInput = {
  to: string;
  resetUrl: string;
};

export type EmailSendResult =
  | { ok: true; provider: "resend" | "test" }
  | { ok: false; reason: "not_configured" | "send_failed" | "invalid_from" };

export function isTransactionalEmailConfigured(
  env: Record<string, string | undefined> = process.env,
): boolean {
  if (env.VITEST === "true" && env.EMAIL_TEST_MODE === "true") return true;
  const key = env.RESEND_API_KEY?.trim();
  const from = env.RESEND_FROM_EMAIL?.trim();
  return Boolean(key && from && from.includes("@"));
}

export function getPasswordResetEmailCopy(): {
  subject: string;
  textBody: (resetUrl: string) => string;
  htmlBody: (resetUrl: string) => string;
} {
  return {
    subject: "SERVSAM — Recuperação de senha",
    textBody: (resetUrl) =>
      [
        "Recebemos uma solicitação para redefinir a senha da sua conta SERVSAM.",
        "",
        "Para criar uma nova senha, acesse o link abaixo.",
        resetUrl,
        "",
        "Este link é temporário e pode ser utilizado apenas uma vez.",
        "",
        "Se você não solicitou essa alteração, ignore esta mensagem.",
      ].join("\n"),
    htmlBody: (resetUrl) =>
      `<p>Recebemos uma solicitação para redefinir a senha da sua conta SERVSAM.</p>
<p>Para criar uma nova senha, acesse o link abaixo.</p>
<p><a href="${resetUrl}">Redefinir minha senha</a></p>
<p>Este link é temporário e pode ser utilizado apenas uma vez.</p>
<p>Se você não solicitou essa alteração, ignore esta mensagem.</p>`,
  };
}

/** Caixa de teste em memória para vitest. */
const testOutbox: Array<{ to: string; subject: string }> = [];

export function getTestEmailOutbox(): ReadonlyArray<{ to: string; subject: string }> {
  return testOutbox;
}

export function clearTestEmailOutbox(): void {
  testOutbox.length = 0;
}

export async function sendPasswordResetEmail(
  input: SendPasswordResetInput,
  env: Record<string, string | undefined> = process.env,
): Promise<EmailSendResult> {
  const copy = getPasswordResetEmailCopy();

  if (env.VITEST === "true" && env.EMAIL_TEST_MODE === "true") {
    testOutbox.push({ to: input.to, subject: copy.subject });
    return { ok: true, provider: "test" };
  }

  const apiKey = env.RESEND_API_KEY?.trim();
  const from = env.RESEND_FROM_EMAIL?.trim();
  if (!apiKey || !from) {
    return { ok: false, reason: "not_configured" };
  }
  if (!from.includes("@")) {
    return { ok: false, reason: "invalid_from" };
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from,
      to: input.to,
      subject: copy.subject,
      text: copy.textBody(input.resetUrl),
      html: copy.htmlBody(input.resetUrl),
    });
    if (result.error) {
      console.error("[email] password reset send failed", {
        code: result.error.name ?? "unknown",
      });
      return { ok: false, reason: "send_failed" };
    }
    return { ok: true, provider: "resend" };
  } catch {
    console.error("[email] password reset provider error");
    return { ok: false, reason: "send_failed" };
  }
}
