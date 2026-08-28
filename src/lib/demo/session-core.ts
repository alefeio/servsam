import { DEMO_SESSION_STORAGE_KEY } from "@/data/demo/auth";
import type { DemoSession } from "@/types/demo";

export function parseDemoSession(raw: string | null): DemoSession | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as DemoSession;
    if (
      typeof parsed.email !== "string" ||
      typeof parsed.roleLabel !== "string" ||
      typeof parsed.signedInAt !== "string"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function getDemoSession(): DemoSession | null {
  if (typeof window === "undefined") {
    return null;
  }
  return parseDemoSession(window.localStorage.getItem(DEMO_SESSION_STORAGE_KEY));
}

export function saveDemoSession(session: DemoSession): void {
  window.localStorage.setItem(DEMO_SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearDemoSession(): void {
  window.localStorage.removeItem(DEMO_SESSION_STORAGE_KEY);
}

export { DEMO_SESSION_STORAGE_KEY } from "@/data/demo/auth";
