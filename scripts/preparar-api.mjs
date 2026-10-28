import { mkdirSync, copyFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
// Exporta as opções da mesma fonte usada pelo frontend. Evita duplicar limites no PHP.
execFileSync(process.execPath, ['node_modules/typescript/bin/tsc', 'src/domain/steps.ts', '--target', 'es2022', '--module', 'es2022', '--outDir', '.api-build', '--skipLibCheck']);
const { SETORES, FATURAMENTOS, PERGUNTAS } = await import('../.api-build/steps.js');
mkdirSync('public/api', { recursive: true });
copyFileSync('server/diagnostico.php', 'public/api/diagnostico.php');
writeFileSync('public/api/schema.json', JSON.stringify({ setores: SETORES, faturamentos: FATURAMENTOS, opcoes: Object.fromEntries(PERGUNTAS.map(q => [q.id, q.opcoes.length])) }));
