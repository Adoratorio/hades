import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const temp = mkdtempSync(join(tmpdir(), 'adoratorio-consumer-'));
const env = { ...process.env, npm_config_cache: join(temp, 'cache') };
const run = (command, args, cwd = temp) => execFileSync(command, args, { cwd, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
try {
  const archives = [...process.argv.slice(2).map(path => resolve(path)), root].map(directory => {
    const [packed] = JSON.parse(run('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', temp], directory));
    return join(temp, packed.filename);
  });
  writeFileSync(join(temp, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
  run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', '--package-lock=false', ...archives]);
  const packageRoot = join(temp, 'node_modules', manifest.name);
  for (const file of readdirSync(join(packageRoot, 'dist'), { recursive: true }).filter(file => file.endsWith('.map'))) {
    const mapFile = join(packageRoot, 'dist', file);
    const map = JSON.parse(readFileSync(mapFile, 'utf8'));
    map.sources.forEach((source, index) => assert.ok(map.sourcesContent?.[index] || existsSync(resolve(dirname(mapFile), source)), `Missing map source ${source}`));
  }
  const modules = [manifest.name, `${manifest.name}/dist/index`];
  if (manifest.exports['./plugins']) modules.push(`${manifest.name}/plugins`);
  writeFileSync(join(temp, 'check.mjs'), modules.map((name, index) => `import * as m${index} from ${JSON.stringify(name)}; if (!m${index}.default) throw Error('Missing default export: ${name}');`).join('\n'));
  run(process.execPath, ['check.mjs']);
  const nested = manifest.name.endsWith('/apollo') ? '{ easing: { duration: 0 }, initialPosition: { x: 1 } }' : manifest.name.endsWith('/hades') ? '{ easing: { duration: 0 }, threshold: { y: 1 } }' : '{}';
  writeFileSync(join(temp, 'consumer.ts'), `import Library from '${manifest.name}';\nconst options: ConstructorParameters<typeof Library>[0] = ${nested};\nexport { options };\n` + modules.map((name, index) => `export * as module${index} from '${name}';`).join('\n'));
  run(join(root, 'node_modules', '.bin', 'tsc'), ['--noEmit', '--strict', '--skipLibCheck', '--target', 'ES2023', '--module', 'NodeNext', '--moduleResolution', 'NodeNext', 'consumer.ts']);
  console.log(`${manifest.name}: packed installation, SSR imports, subpaths, declarations and source maps OK`);
} catch (error) {
  if (error.stdout) process.stderr.write(error.stdout);
  if (error.stderr) process.stderr.write(error.stderr);
  throw error;
} finally {
  rmSync(temp, { recursive: true, force: true });
}
