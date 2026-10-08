import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const child = spawn(process.execPath, [root + 'node_modules/@opennextjs/cloudflare/dist/cli/index.js', ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: { ...process.env, XDG_CONFIG_HOME: process.env.XDG_CONFIG_HOME ?? root + '.sites-runtime/config', WRANGLER_LOG_PATH: root + '.wrangler/logs', WRANGLER_SEND_METRICS: 'false', CLOUDFLARE_CF_FETCH_ENABLED: 'false' },
});
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
