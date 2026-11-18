import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { getPrisma } from "@/lib/db/prisma";
import { getAuthBaseURL, getTrustedOrigins } from "@/lib/platform/auth-url";

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
