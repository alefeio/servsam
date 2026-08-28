import { existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const nextDir = resolve(process.cwd(), ".next");
const devLock = resolve(nextDir, "dev", "lock");

if (existsSync(devLock)) {
  console.error(
    [
      "Servidor de desenvolvimento ativo (.next/dev/lock).",
      "Pare o `npm run dev` antes de limpar a pasta .next.",
    ].join("\n"),
  );
  process.exit(1);
}

try {
  rmSync(nextDir, {
    recursive: true,
    force: true,
    maxRetries: 5,
    retryDelay: 200,
  });
  console.log("Removed .next cache.");
} catch {
  console.error(
    "Não foi possível remover .next. Feche servidores Next.js locais e tente novamente.",
  );
  process.exit(1);
}
