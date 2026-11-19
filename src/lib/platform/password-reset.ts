import { getAuthBaseURL } from "@/lib/platform/auth-url";

export const PASSWORD_RESET_PATH = "/sistema/redefinir-senha";
export const FORGOT_PASSWORD_PATH = "/sistema/esqueci-senha";
export const GENERIC_PASSWORD_RESET_ACK =
  "Se este e-mail estiver cadastrado, você receberá as instruções para redefinir sua senha.";

export const PASSWORD_RESET_TOKEN_TTL_SECONDS = 3600;

/** redirectTo permitido: mesma origem do auth + path fixo de redefinição. */
export function buildPasswordResetRedirectTo(
  env: Record<string, string | undefined> = process.env,
  originOverride?: string,
): string {
  const base = (originOverride?.trim() || getAuthBaseURL(env)).replace(/\/$/, "");
  return `${base}${PASSWORD_RESET_PATH}`;
}

export function isAllowedPasswordResetRedirect(
  redirectTo: string,
  env: Record<string, string | undefined> = process.env,
): boolean {
  if (redirectTo === PASSWORD_RESET_PATH) return true;
  try {
    const url = new URL(redirectTo);
    const base = new URL(getAuthBaseURL(env));
    const sameHostFamily =
      url.origin === base.origin ||
      (["localhost", "127.0.0.1"].includes(url.hostname) &&
        ["localhost", "127.0.0.1"].includes(base.hostname) &&
        url.protocol === base.protocol &&
        url.port === base.port);
    if (!sameHostFamily) return false;
    return url.pathname === PASSWORD_RESET_PATH;
  } catch {
    return false;
  }
}

export function validateNewPassword(
  password: string,
  confirm: string,
  options: { min: number; max: number } = { min: 8, max: 128 },
): string | null {
  if (password.length < options.min) {
    return `A senha deve ter pelo menos ${options.min} caracteres.`;
  }
  if (password.length > options.max) {
    return `A senha deve ter no máximo ${options.max} caracteres.`;
  }
  if (password !== confirm) {
    return "As senhas não coincidem.";
  }
  return null;
}
