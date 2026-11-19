import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { getPrisma } from "@/lib/db/prisma";
import { writeAudit } from "@/lib/platform/audit";
import { getAuthBaseURL, getTrustedOrigins } from "@/lib/platform/auth-url";
import { sendPasswordResetEmail } from "@/lib/platform/email";
import { PASSWORD_RESET_TOKEN_TTL_SECONDS } from "@/lib/platform/password-reset";

export const GENERIC_LOGIN_ERROR = "E-mail ou senha inválidos.";

export { getAuthBaseURL, getTrustedOrigins } from "@/lib/platform/auth-url";

function getAuthSecret(
  env: Record<string, string | undefined> = process.env,
): string {
  const secret = env.BETTER_AUTH_SECRET?.trim();
  if (secret) return secret;
  if (env.NEXT_PHASE === "phase-production-build") {
    return "build-only-placeholder-not-for-runtime-use";
  }
  throw new Error("BETTER_AUTH_SECRET is not set");
}

export const auth = betterAuth({
  database: prismaAdapter(getPrisma(), { provider: "postgresql" }),
  secret: getAuthSecret(),
  baseURL: getAuthBaseURL(),
  trustedOrigins: getTrustedOrigins(),
  rateLimit: {
    enabled: process.env.VITEST !== "true",
    window: 60,
    max: 20,
  },
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: true,
    resetPasswordTokenExpiresIn: PASSWORD_RESET_TOKEN_TTL_SECONDS,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url, token }) => {
      const prisma = getPrisma();
      const record = await prisma.user.findUnique({
        where: { id: user.id },
        select: { isActive: true, organizationId: true },
      });

      if (!record?.isActive) {
        await prisma.verification.deleteMany({
          where: { identifier: `reset-password:${token}` },
        });
        if (record?.organizationId) {
          await writeAudit({
            organizationId: record.organizationId,
            actorUserId: null,
            action: "PASSWORD_RESET_DENIED_INACTIVE",
            entityType: "User",
            entityId: user.id,
            metadata: { reason: "inactive" },
          });
        }
        return;
      }

      const sent = await sendPasswordResetEmail({
        to: user.email,
        resetUrl: url,
      });

      if (!sent.ok) {
        await prisma.verification.deleteMany({
          where: { identifier: `reset-password:${token}` },
        });
        console.error("[auth] password reset email not sent", { reason: sent.reason });
        return;
      }

      await writeAudit({
        organizationId: record.organizationId,
        actorUserId: null,
        action: "PASSWORD_RESET_REQUESTED",
        entityType: "User",
        entityId: user.id,
        metadata: { provider: sent.provider },
      });
    },
    onPasswordReset: async ({ user }) => {
      const record = await getPrisma().user.findUnique({
        where: { id: user.id },
        select: { organizationId: true },
      });
      if (!record) return;
      await writeAudit({
        organizationId: record.organizationId,
        actorUserId: user.id,
        action: "PASSWORD_RESET_COMPLETED",
        entityType: "User",
        entityId: user.id,
        metadata: {},
      });
    },
  },
  user: {
    additionalFields: {
      organizationId: {
        type: "string",
        required: true,
        input: false,
      },
      isActive: {
        type: "boolean",
        required: false,
        defaultValue: true,
        input: false,
      },
    },
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const user = await getPrisma().user.findUnique({
            where: { id: session.userId },
            select: { isActive: true },
          });
          if (!user?.isActive) {
            return false;
          }
          return { data: session };
        },
      },
    },
  },
  plugins: [nextCookies()],
});
