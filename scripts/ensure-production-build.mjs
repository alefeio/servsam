import { existsSync } from "node:fs";
import { resolve } from "node:path";

const nextDir = resolve(process.cwd(), ".next");
const productionManifest = resolve(nextDir, "BUILD_ID");
const devLock = resolve(nextDir, "dev", "lock");

if (existsSync(devLock)) {
  console.error(
    [
      "Detectado servidor de desenvolvimento ativo (.next/dev/lock).",
      "Pare o `npm run dev` antes de executar `npm run build` ou `npm run start`.",
      "Servidores dev e produção compartilham .next e podem quebrar o carregamento do CSS.",
    ].join("\n"),
  );
  process.exit(1);
}

if (!existsSync(productionManifest)) {
  console.error(
    "Build de produção ausente. Execute `npm run build` antes de `npm run start`.",
  );
  process.exit(1);
}
