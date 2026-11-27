import { headers } from "next/headers";
import { auth, GENERIC_LOGIN_ERROR } from "@/lib/platform/auth";
import { writeAudit } from "@/lib/platform/audit";
import { getPrisma } from "@/lib/db/prisma";

export type LoginResult = { ok: true } | { ok: false; message: string };

export async function authenticate(email: string, password: string): Promise<LoginResult> {
  const normalized = email.trim().toLowerCase();
  const requestHeaders = await headers();

  try {
    const signedIn = await auth.api.signInEmail({
      body: { email: normalized, password },
      headers: requestHeaders,
    });
    const userId = signedIn.user.id;
    // Better Auth já aplica databaseHooks.session.create (isActive).
    // Preferir campos retornados; só consultar o banco se faltar organizationId/isActive.
    const signedInUser = signedIn.user as {
      id: string;
      organizationId?: string | null;
      isActive?: boolean | null;
    };
    let organizationId = signedInUser.organizationId ?? null;
    let isActive = signedInUser.isActive;
    if (organizationId == null || typeof isActive !== "boolean") {
      const user = await getPrisma().user.findUnique({
        where: { id: userId },
        select: { id: true, organizationId: true, isActive: true },
      });
      organizationId = user?.organizationId ?? null;
      isActive = user?.isActive;
    }

    if (!isActive || !organizationId) {
      await auth.api.signOut({ headers: requestHeaders });
      if (organizationId) {
        await writeAudit({
          organizationId,
          actorUserId: null,
          action: "LOGIN_FAILURE",
          entityType: "User",
          entityId: userId,
          metadata: { reason: "inactive" },
        });
      }
      return { ok: false, message: GENERIC_LOGIN_ERROR };
    }

    await writeAudit({
      organizationId,
      actorUserId: userId,
      action: "LOGIN_SUCCESS",
      entityType: "User",
      entityId: userId,
      metadata: {},
    });
    return { ok: true };
  } catch {
    await recordFailure(normalized);
    return { ok: false, message: GENERIC_LOGIN_ERROR };
  }
}

async function recordFailure(email: string): Promise<void> {
  const user = await getPrisma().user.findUnique({
    where: { email },
    select: { id: true, organizationId: true, isActive: true },
  });
  const organizationId = user?.organizationId ?? (await fallbackOrganizationId());
  if (!organizationId) return;

  await writeAudit({
    organizationId,
    actorUserId: null,
    action: "LOGIN_FAILURE",
    entityType: "User",
    entityId: user?.id ?? null,
    metadata: { reason: user && !user.isActive ? "inactive" : "rejected" },
  });
}

async function fallbackOrganizationId(): Promise<string | null> {
  const organization = await getPrisma().organization.findUnique({
    where: { slug: "servsam" },
    select: { id: true },
  });
  return organization?.id ?? null;
}

export async function endSession(): Promise<void> {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  const userId = session?.user.id ?? null;
  if (userId) {
    const user = await getPrisma().user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });
    if (user) {
      await writeAudit({
        organizationId: user.organizationId,
        actorUserId: userId,
        action: "LOGOUT",
        entityType: "User",
        entityId: userId,
        metadata: {},
      });
    }
  }
  await auth.api.signOut({ headers: requestHeaders });
}
