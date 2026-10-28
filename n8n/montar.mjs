// Gera n8n/dist/vc-sabia-maestro.n8n.js: a versão do workflow que o validador do n8n aceita.
// O parser do SDK não executa JS (não aceita function nem template com ${}), então o código do
// Code node "Validar e limpar" entra como texto literal, montado a partir de sanitizar.mjs.
// Uso: node n8n/montar.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { COLS, sanitizar } from "./sanitizar.mjs";

const fonte = readFileSync(new URL("./vc-sabia-maestro.workflow.js", import.meta.url), "utf8");

const jsCode = `const COLS = ${JSON.stringify(COLS)};\n${sanitizar.toString()}\nreturn [{ json: sanitizar($input.first().json.body || {}) }];`;

const regra = (valor) =>
  `{ outputKey: '${valor}', conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: expr('{{ $json._acao }}'), operator: { type: 'string', operation: 'equals' }, rightValue: '${valor}' }], combinator: 'and' } }`;

let saida = fonte
  .replace(/^\s*\/\/.*\n/gm, "") // comentários de linha inteira (o jsCode literal não tem quebra de linha crua)
  .replace(/ \/\/ [^\n]*$/gm, "") // comentários no fim da linha
  .replace(/^import \{ sanitizar, COLS \} from '\.\/sanitizar\.mjs';\n/m, "")
  .replace(/jsCode: `const COLS = \$\{JSON\.stringify\(COLS\)\};\n\$\{sanitizar\.toString\(\)\}\nreturn \[\{ json: sanitizar\(\$input\.first\(\)\.json\.body \|\| \{\}\) \}\];`/, `jsCode: ${JSON.stringify(jsCode)}`)
  .replace(/const regra = \(valor\) => \(\{[\s\S]*?\n\}\);\n/, "")
  .replace(/values: \[regra\('gravar'\), regra\('atualizar'\), regra\('ignorar'\), regra\('rejeitar'\)\]/, `values: [${["gravar", "atualizar", "ignorar", "rejeitar"].map(regra).join(", ")}]`);

for (const proibido of ["sanitizar.mjs", "${", "regra(", "function "]) {
  const sem = saida.replace(JSON.stringify(jsCode), "");
  if (sem.includes(proibido)) throw new Error(`sobrou "${proibido}" fora do jsCode`);
}

mkdirSync(new URL("./dist/", import.meta.url), { recursive: true });
writeFileSync(new URL("./dist/vc-sabia-maestro.n8n.js", import.meta.url), saida);
console.log("n8n/dist/vc-sabia-maestro.n8n.js", saida.length, "chars");
