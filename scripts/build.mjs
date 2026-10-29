// Production build for shared hosting (Hostinger), run by `yarn build`.
//
// The host caps how many threads one account may run. Next's Rust tooling
// (SWC, Tailwind, Lightning CSS) sizes its thread pools to the server's CPU
// count when it first loads, and panics with "OS can't spawn worker thread"
// when it hits that cap. The pools start before next.config.ts is read (SWC
// compiles that file), so the limits must be set before Next starts: here.

import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const env = { ...process.env };
env.TOKIO_WORKER_THREADS ??= "2";
env.RAYON_NUM_THREADS ??= "2";
env.UV_THREADPOOL_SIZE ??= "2";
env.NEXT_TELEMETRY_DISABLED ??= "1";

// Webpack instead of Turbopack: Turbopack runs a much larger thread pool.
const result = spawnSync(process.execPath, [require.resolve("next/dist/bin/next"), "build", "--webpack", ...process.argv.slice(2)], {
  stdio: "inherit",
  env,
});
process.exit(result.status ?? 1);
