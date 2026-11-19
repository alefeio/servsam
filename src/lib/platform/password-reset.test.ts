import { afterEach, describe, expect, it } from "vitest";
import {
  clearTestEmailOutbox,
  getPasswordResetEmailCopy,
  getTestEmailOutbox,
  isTransactionalEmailConfigured,
  sendPasswordResetEmail,
} from "@/lib/platform/email";
import {
  GENERIC_PASSWORD_RESET_ACK,
  PASSWORD_RESET_PATH,
  buildPasswordResetRedirectTo,
  isAllowedPasswordResetRedirect,
  validateNewPassword,
} from "@/lib/platform/password-reset";

describe("password reset helpers", () => {
  it("builds and validates same-origin redirect only", () => {
    const env = { BETTER_AUTH_URL: "https://servsam-preview.example" };
    const redirect = buildPasswordResetRedirectTo(env);
    expect(redirect).toBe(`https://servsam-preview.example${PASSWORD_RESET_PATH}`);
    expect(isAllowedPasswordResetRedirect(redirect, env)).toBe(true);
    expect(isAllowedPasswordResetRedirect(PASSWORD_RESET_PATH, env)).toBe(true);
    expect(
      isAllowedPasswordResetRedirect("https://evil.example/sistema/redefinir-senha", env),
    ).toBe(false);
    expect(
      isAllowedPasswordResetRedirect("https://servsam-preview.example/sistema/login", env),
    ).toBe(false);
  });

  it("accepts localhost and 127.0.0.1 as the same local family", () => {
    const env = { BETTER_AUTH_URL: "http://localhost:3000" };
    expect(
      isAllowedPasswordResetRedirect(`http://127.0.0.1:3000${PASSWORD_RESET_PATH}`, env),
    ).toBe(true);
  });

  it("validates new password confirmation", () => {
    expect(validateNewPassword("short", "short")).toMatch(/pelo menos/);
    expect(validateNewPassword("senha-valida-1", "outra")).toMatch(/coincidem/);
    expect(validateNewPassword("senha-valida-1", "senha-valida-1")).toBeNull();
  });

  it("keeps a generic public acknowledgement", () => {
    expect(GENERIC_PASSWORD_RESET_ACK.toLowerCase()).toContain("se este e-mail");
  });
});

describe("transactional email", () => {
  afterEach(() => {
    clearTestEmailOutbox();
  });

  it("detects configuration without leaking secrets", () => {
    expect(isTransactionalEmailConfigured({})).toBe(false);
    expect(
      isTransactionalEmailConfigured({
        RESEND_API_KEY: "re_test",
        RESEND_FROM_EMAIL: "noreply@example.com",
      }),
    ).toBe(true);
  });

  it("records test-mode sends without storing the reset url in the outbox metadata", async () => {
    const copy = getPasswordResetEmailCopy();
    const result = await sendPasswordResetEmail(
      { to: "user@example.com", resetUrl: "https://example.com/reset?token=secret" },
      { VITEST: "true", EMAIL_TEST_MODE: "true" },
    );
    expect(result).toEqual({ ok: true, provider: "test" });
    expect(getTestEmailOutbox()).toEqual([{ to: "user@example.com", subject: copy.subject }]);
    expect(JSON.stringify(getTestEmailOutbox())).not.toContain("token=secret");
  });
});
