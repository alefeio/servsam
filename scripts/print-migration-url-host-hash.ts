/**
 * Imprime só o hostHash da URL que `getMigrationDatabaseUrl` resolveria.
 * Sem URL/segredo no stdout. Usado pelo executor HOMOL 11B.3.
 */
import { createHash } from "node:crypto";
import { getMigrationDatabaseUrl } from "../src/lib/db/urls";

function sha12(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 12);
}

function hostHashFromUrl(url: string): string {
  try {
    return sha12(new URL(url).host);
  } catch {
    return "invalid";
  }
}

const resolved = getMigrationDatabaseUrl(process.env);
process.stdout.write(hostHashFromUrl(resolved));
