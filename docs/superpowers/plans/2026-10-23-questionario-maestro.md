# Questionário "Você Sabia?" · Maestro — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publicar em `https://questionario.aodigital.net.br` o diagnóstico "Custo da Fila" do Maestro em forma de jogo (12 telas, robô, trilha, vídeo final), gravando cada lead na planilha "RESPOSTAS VC SABIA MAESTRO".

**Architecture:** SPA estática em React 19 + Vite 7 + Tailwind 4 (mesmo stack do projeto Maestro Always On). A conta é uma função pura em TypeScript validada por um teste-oráculo que executa o script original do maestro.com.ai. O envio vai para um webhook n8n (pasta ALWAYS ON) que valida e grava no Google Sheets. Som gerado em tempo real com Web Audio API. Deploy por GitHub Actions → branch `deploy` → Plesk Git.

**Tech Stack:** React 19, Vite 7, TypeScript 5.8, Tailwind CSS 4, framer-motion 12, lucide-react, @splinetool/react-spline 4, Vitest, Playwright (Python, ambiente em `~/Claude/CLAUDE CODE/playwright`), ffmpeg, n8n Workflow SDK, Plesk.

**Spec:** `docs/superpowers/specs/2026-10-23-questionario-maestro-design.md`

---

## Mapa de arquivos

Raiz do projeto: `~/Claude/CLAUDE CODE/questionario-maestro/` (todos os caminhos abaixo são relativos a ela).

| Arquivo | Responsabilidade |
|---|---|
| `package.json`, `vite.config.ts`, `vitest.config.ts`, `tsconfig.json`, `index.html` | Build, testes, metatags e imagem de compartilhamento |
| `src/main.tsx`, `src/styles.css`, `src/vite-env.d.ts` | Entrada, tema (tokens do Maestro), tipos do Vite |
| `src/lib/utils.ts` | `cn()` |
| `src/domain/constants.ts` | `PRECO`, `RECURSO`, limiares, cena do robô |
| `src/domain/format.ts` | `brl`, `pct`, `num` (formatação idêntica ao original) |
| `src/domain/steps.ts` | Setores, faturamentos, as 11 perguntas (texto novo, valores originais) |
| `src/domain/calc.ts` | `calcular()` — porte exato do `calc()` original |
| `src/domain/entradas.ts` | Respostas + ajustes → `Entradas`; leitura dos campos de ajuste |
| `src/domain/readings.ts` | Veredicto e todos os textos do resultado |
| `src/domain/conteudo.ts` | Cards "Você sabia?" e reações do robô |
| `src/flow/quiz.ts` | Sequência de telas, reducer, progresso, nível da música |
| `src/data/colunas.ts` | Nomes das 36 colunas da planilha |
| `src/data/origem.ts` | `?o=`, UTMs, dispositivo |
| `src/data/contato.ts` | Validação do formulário |
| `src/data/lead.ts` | Montagem das linhas, envio com nova tentativa e fila local |
| `src/audio/musica.ts` | Notas e acordes (puro, testável) |
| `src/audio/som.ts` | Motor de som (Web Audio): trilha em camadas + efeitos |
| `src/components/ui/*.tsx` | Componentes do 21st.dev (botão, glow card, dot loader) e portes (fluxo, palavra girando) |
| `src/components/robo/*.tsx` | Robô Spline, palco com fallback, balão de reação |
| `src/components/BarraCircuito.tsx`, `BotaoSom.tsx`, `Moldura.tsx`, `Contagem.tsx` | Peças compartilhadas |
| `src/screens/*.tsx` | Uma tela por fase |
| `src/App.tsx` | Orquestra estado, som, envio e transições |
| `test/*.ts` | Oráculo do original + testes unitários |
| `n8n/vc-sabia-maestro.workflow.js`, `n8n/manutencao.workflow.js` | Código-fonte dos workflows (SDK) |
| `scripts/video.sh`, `scripts/og/*`, `scripts/conferir_referencia.py` | Vídeo, imagem OG, conferência com o site ao vivo |
| `e2e/fluxo_e2e.py` | Teste ponta a ponta (celular + desktop) |
| `.github/workflows/deploy.yml` | Build e publicação na branch `deploy` |

Referências já no repositório: `docs/referencia/custo-da-fila/calc.js` (script original), `docs/referencia/robo-original.png` (imagem do robô enviada pelo Marcelo).

---

## Fase 1 · Base do projeto

### Task 1: Scaffold Vite + React + Tailwind 4 + Vitest

**Files:**
- Create: `package.json`, `vite.config.ts`, `vitest.config.ts`, `tsconfig.json`, `index.html`, `.gitignore`, `src/main.tsx`, `src/App.tsx`, `src/styles.css`, `src/vite-env.d.ts`, `src/lib/utils.ts`

- [ ] **Step 1: Configurar o git local e criar o `package.json`**

```bash
cd "$HOME/Claude/CLAUDE CODE/questionario-maestro"
git config user.name "Marcelo i9"
git config user.email "marcelo@i9criacoes.com.br"
```

`package.json`:
```json
{
  "name": "questionario-maestro",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview --port 4173 --strictPort",
    "test": "vitest run"
  }
}
```

- [ ] **Step 2: Instalar dependências**

```bash
npm install react@^19.2.0 react-dom@^19.2.0 framer-motion@^12.38.0 lucide-react clsx tailwind-merge @splinetool/react-spline@^4.1.0 @splinetool/runtime
npm install -D vite@^7.3.1 @vitejs/plugin-react@^5.0.4 @tailwindcss/vite@^4.2.1 tailwindcss@^4.2.1 typescript@^5.8.3 @types/react@^19.2.0 @types/react-dom@^19.2.0 @types/node vite-tsconfig-paths@^6.0.2 vitest
```
Expected: `added N packages`, sem `ERR!`.

- [ ] **Step 3: Arquivos de configuração**

`vite.config.ts`:
```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

export default defineConfig({
  base: "/",
  plugins: [react(), tailwindcss(), tsconfigPaths()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  server: { host: "::", port: 8080, strictPort: true },
  build: { outDir: "dist", sourcemap: false },
});
```

`vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  test: { environment: "node", include: ["test/**/*.test.ts"] },
});
```

`tsconfig.json`:
```json
{
  "include": ["src/**/*.ts", "src/**/*.tsx", "test/**/*.ts", "vite.config.ts", "vitest.config.ts"],
  "compilerOptions": {
    "target": "ES2022",
    "jsx": "react-jsx",
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["vite/client", "node"],
    "moduleResolution": "Bundler",
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "skipLibCheck": true,
    "strict": true,
    "noFallthroughCasesInSwitch": true,
    "paths": { "@/*": ["./src/*"] }
  }
}
```

`.gitignore`:
```
node_modules/
dist/
.DS_Store
e2e/capturas/
lh.json
*.log
```

`src/vite-env.d.ts`:
```ts
/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_WEBHOOK_URL?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

`src/lib/utils.ts`:
```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 4: Tema (tokens do Maestro com acento ciano)**

`src/styles.css`:
```css
@import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap");
@import "tailwindcss";

@theme inline {
  --font-sans: "Plus Jakarta Sans", system-ui, sans-serif;
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border);
  --color-ring: var(--ring);
  --color-ink: var(--ink);
  --color-navy: var(--navy);
  --color-navy-light: var(--navy-light);
  --color-offwhite: var(--offwhite);
  --color-ciano: var(--ciano);
  --color-violeta: var(--violeta);
  --color-ok: var(--ok);
  --color-warn: var(--warn);
  --color-err: var(--err);
}

:root {
  --ink: oklch(0.09 0.03 265);
  --navy: oklch(0.16 0.05 265);
  --navy-light: oklch(0.22 0.06 265);
  --offwhite: oklch(0.93 0.02 280);
  --ciano: oklch(0.82 0.15 210);
  --violeta: oklch(0.55 0.25 295);
  --ok: oklch(0.78 0.17 155);
  --warn: oklch(0.83 0.16 85);
  --err: oklch(0.68 0.21 25);
  --background: var(--ink);
  --foreground: var(--offwhite);
  --card: var(--navy);
  --primary: var(--ciano);
  --primary-foreground: var(--ink);
  --muted: oklch(1 0 0 / 7%);
  --muted-foreground: oklch(0.75 0.03 270);
  --border: oklch(1 0 0 / 10%);
  --ring: var(--ciano);
}

html,
body,
#root {
  min-height: 100%;
}
body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
}

@keyframes flutuar {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
.flutuar {
  animation: flutuar 4s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 5: Entrada mínima**

`index.html` (versão provisória; a Task 27 troca pela versão final com metatags):
```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>Maestro · Você sabia?</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`src/main.tsx`:
```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

`src/App.tsx` (provisório):
```tsx
export default function App() {
  return <main className="grid min-h-dvh place-items-center text-ciano">Maestro · Você sabia?</main>;
}
```

- [ ] **Step 6: Verificar build**

Run: `npm run build`
Expected: `✓ built in` e pasta `dist/` com `index.html`.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + React 19 + Tailwind 4 + Vitest

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Fase 2 · A conta (TDD contra o original)

### Task 2: Oráculo — executar o script original nos testes

O oráculo carrega `docs/referencia/custo-da-fila/calc.js`, extrai as funções puras (`calc`, `verdict` etc.) e as executa num `vm`. É contra ele que a nossa conta é testada.

**Files:**
- Create: `test/referencia.ts`, `test/combinacoes.ts`, `test/referencia.test.ts`

- [ ] **Step 1: Escrever o teste do próprio oráculo**

`test/referencia.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { ref } from "./referencia";

describe("oráculo do Custo da Fila", () => {
  it("carrega constantes e as 11 perguntas", () => {
    expect(ref.PRECO).toBe(6000);
    expect(ref.RECURSO).toBe(25000);
    expect(ref.STEPS.map((s) => s.id)).toEqual(["quem", "pecas", "custo", "horas", "mont", "dias", "mult", "maos", "trava", "furo", "ia"]);
  });

  it("calcula o caso de conferência (todas as respostas no índice 2)", () => {
    const S: Record<string, number> = { preco: 6000, rec: 25000 };
    for (const st of ref.STEPS) {
      const i = Math.min(2, st.opts.length - 1);
      S[st.id] = st.opts[i][0];
      S[st.id + "Label"] = i;
    }
    const r = ref.calc(S);
    expect(r.teto).toBe(161200);
    expect(ref.brl(r.teto)).toBe("R$ 161.200");
    expect(ref.verdict(r).lamp).toBe("Caso fechado");
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run test/referencia.test.ts`
Expected: FAIL — `Cannot find module './referencia'`.

- [ ] **Step 3: Implementar o oráculo**

`test/referencia.ts`:
```ts
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const ARQUIVO = fileURLToPath(new URL("../docs/referencia/custo-da-fila/calc.js", import.meta.url));
const SRC = readFileSync(ARQUIVO, "utf8");

function bloco(inicio: number, abre: string, fecha: string): string {
  let i = SRC.indexOf(abre, inicio);
  let profundidade = 0;
  for (; i < SRC.length; i++) {
    if (SRC[i] === abre) profundidade++;
    else if (SRC[i] === fecha) {
      profundidade--;
      if (profundidade === 0) return SRC.slice(inicio, i + 1);
    }
  }
  throw new Error(`bloco iniciado em ${inicio} não fechou`);
}

function funcao(nome: string): string {
  const inicio = SRC.indexOf(`function ${nome}(`);
  if (inicio < 0) throw new Error(`função ${nome} não encontrada no original`);
  return bloco(inicio, "{", "}");
}

const FUNCOES = ["brl", "pct", "num", "calc", "verdict", "explainValor", "explainMarca", "spot", "flagText", "tempoText", "filaText", "eqText"];
const constantes = SRC.match(/var PRECO = \d+, RECURSO = \d+;/);
if (!constantes) throw new Error("constantes PRECO/RECURSO não encontradas");
const steps = bloco(SRC.indexOf("var STEPS = ["), "[", "]");

const contexto = vm.createContext({});
vm.runInContext(
  [constantes[0], steps + ";", ...FUNCOES.map(funcao), `this.ref = { PRECO, RECURSO, STEPS, ${FUNCOES.join(", ")} };`].join("\n"),
  contexto,
);

type R = Record<string, any>;
export const ref = (contexto as { ref: unknown }).ref as {
  PRECO: number;
  RECURSO: number;
  STEPS: Array<{ id: string; opts: Array<[number, string]> }>;
  brl(n: number): string;
  pct(n: number): string;
  num(n: number, d?: number): string;
  calc(s: R): R;
  verdict(r: R): { k: string; lamp: string; t: string; b: string };
  explainValor(r: R): string;
  explainMarca(r: R): string;
  spot(r: R): { h: string; b: string } | null;
  flagText(r: R): string;
  tempoText(r: R): string;
  filaText(r: R): string;
  eqText(r: R): string;
};
```

`test/combinacoes.ts`:
```ts
import { ref } from "./referencia";

export type Combo = Record<string, number>;

const IDS = ref.STEPS.map((s) => s.id);
const QTD: Record<string, number> = Object.fromEntries(ref.STEPS.map((s) => [s.id, s.opts.length]));

/** Cada opção de cada pergunta ao menos uma vez + 400 combinações pseudoaleatórias (semente fixa). */
export function combinacoes(): Combo[] {
  const base: Combo = Object.fromEntries(IDS.map((id) => [id, 0]));
  const lista: Combo[] = [];
  for (const id of IDS) for (let i = 0; i < QTD[id]; i++) lista.push({ ...base, [id]: i });
  let semente = 20261023;
  const aleatorio = () => {
    semente = (semente * 1103515245 + 12345) % 2147483648;
    return semente / 2147483648;
  };
  for (let k = 0; k < 400; k++) lista.push(Object.fromEntries(IDS.map((id) => [id, Math.floor(aleatorio() * QTD[id])])));
  return lista;
}

/** Monta o objeto `S` exatamente como o original faz ao terminar o questionário. */
export function estadoOriginal(c: Combo, ajustes: Partial<Record<string, number>> = {}): Record<string, number> {
  const S: Record<string, number> = {};
  for (const st of ref.STEPS) {
    S[st.id] = st.opts[c[st.id]][0];
    S[st.id + "Label"] = c[st.id];
  }
  S.preco = ref.PRECO;
  S.rec = ref.RECURSO;
  return { ...S, ...ajustes };
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run test/referencia.test.ts`
Expected: PASS (2 testes).

- [ ] **Step 5: Commit**

```bash
git add test/
git commit -m "test: oráculo que executa o calc() original do Custo da Fila

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 3: Formatação e constantes

**Files:**
- Create: `src/domain/format.ts`, `src/domain/constants.ts`, `test/format.test.ts`

- [ ] **Step 1: Teste**

`test/format.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { brl, num, pct } from "@/domain/format";
import { ref } from "./referencia";

const VALORES = [0, 0.5, 9.999, 10, 652.6315, 161200, 1234567.89, Infinity, NaN];
const PCTS = [0, 0.05, 0.2, 0.6, 0.875, 1];

describe("format", () => {
  it("brl igual ao original", () => VALORES.forEach((v) => expect(brl(v)).toBe(ref.brl(v))));
  it("pct igual ao original", () => PCTS.forEach((v) => expect(pct(v)).toBe(ref.pct(v))));
  it("num igual ao original", () => {
    for (const v of [0, 1.25, 6.448, 760, 2.5]) {
      expect(num(v)).toBe(ref.num(v));
      expect(num(v, 0)).toBe(ref.num(v, 0));
    }
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run test/format.test.ts`
Expected: FAIL — módulo `@/domain/format` não existe.

- [ ] **Step 3: Implementar**

`src/domain/format.ts`:
```ts
export function brl(n: number): string {
  if (!isFinite(n)) return "—";
  if (n < 10) return "R$ " + n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return "R$ " + Math.round(n).toLocaleString("pt-BR");
}

export function pct(n: number): string {
  return (n * 100).toLocaleString("pt-BR", { maximumFractionDigits: n < 0.1 ? 1 : 0 }) + "%";
}

export function num(n: number, d?: number): string {
  return n.toLocaleString("pt-BR", { maximumFractionDigits: d === undefined ? 1 : d });
}
```

`src/domain/constants.ts`:
```ts
/** Mensalidade de entrada do Maestro Composer (R$/mês). Fonte: maestro.com.ai/custo-da-fila. */
export const PRECO = 6000;
/** Custo de 1 recurso alocado (R$/mês). */
export const RECURSO = 25000;
export const LIMIAR_VERDE = 25000;
export const LIMIAR_AMARELO = 12000;
export const MARCA_ALTA = 60;
export const MARCA_MEDIA = 35;
/** Cena 3D do robô, a mesma da LP do Maestro. */
export const CENA_ROBO = "https://prod.spline.design/PyzDhpQ9E5f1E3MT/scene.splinecode";
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run test/format.test.ts`
Expected: PASS (3 testes).

- [ ] **Step 5: Commit**

```bash
git add src/domain test/format.test.ts
git commit -m "feat: formatação e constantes da conta

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 4: As perguntas (texto novo, valores originais)

**Files:**
- Create: `src/domain/steps.ts`, `test/steps.test.ts`

- [ ] **Step 1: Teste — valores idênticos ao original, textos novos**

`test/steps.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { FATURAMENTOS, PERGUNTAS, SETORES } from "@/domain/steps";
import { ref } from "./referencia";

describe("perguntas", () => {
  it("mesmos ids e mesma ordem do original", () => {
    expect(PERGUNTAS.map((p) => p.id)).toEqual(ref.STEPS.map((s) => s.id));
  });
  it("valores de cada opção idênticos ao original", () => {
    PERGUNTAS.forEach((p, i) => expect(p.opcoes.map((o) => o.valor)).toEqual(ref.STEPS[i].opts.map((o) => o[0])));
  });
  it("7 perguntas de operação e 4 de marca", () => {
    expect(PERGUNTAS.filter((p) => p.fase === "operacao")).toHaveLength(7);
    expect(PERGUNTAS.filter((p) => p.fase === "marca")).toHaveLength(4);
  });
  it("16 setores e 5 faixas de faturamento", () => {
    expect(SETORES).toHaveLength(16);
    expect(FATURAMENTOS).toHaveLength(5);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run test/steps.test.ts`
Expected: FAIL — módulo `@/domain/steps` não existe.

- [ ] **Step 3: Implementar**

`src/domain/steps.ts`:
```ts
export type StepId = "quem" | "pecas" | "custo" | "horas" | "mont" | "dias" | "mult" | "maos" | "trava" | "furo" | "ia";
export type Fase = "operacao" | "marca";
export interface Opcao {
  valor: number;
  rotulo: string;
}
export interface Pergunta {
  id: StepId;
  fase: Fase;
  eyebrow: string;
  pergunta: string;
  ajuda: string;
  opcoes: Opcao[];
}

export const FASE_NOME: Record<Fase, string> = { operacao: "Fase 1 · A operação", marca: "Fase 2 · A marca" };

export const SETORES = [
  "Varejo",
  "E-commerce / marketplace",
  "Moda e vestuário",
  "Serviços financeiros e seguros",
  "Saúde e bem-estar",
  "Educação",
  "Telecom",
  "Indústria e bens de consumo",
  "Energia e utilities",
  "Turismo e hospedagem",
  "Companhias aéreas",
  "Mobilidade e locação (carros, bikes, patinetes)",
  "Alimentos e bebidas",
  "Tecnologia e SaaS",
  "Agência de publicidade, marketing ou CRM",
  "Outro",
];

export const FATURAMENTOS = [
  "Até R$ 100 milhões",
  "De R$ 100 a 500 milhões",
  "De R$ 500 milhões a R$ 1 bilhão",
  "De R$ 1 a 5 bilhões",
  "Mais de R$ 5 bilhões",
];

const o = (valor: number, rotulo: string): Opcao => ({ valor, rotulo });

export const PERGUNTAS: Pergunta[] = [
  {
    id: "quem", fase: "operacao", eyebrow: "01 · Estrutura",
    pergunta: "Quem coloca as peças de pé hoje?",
    ajuda: "Peça é cada e-mail, push, SMS, WhatsApp ou post que vai ao ar. Três versões do mesmo e-mail para três segmentos contam como três peças.",
    opcoes: [o(1, "Time interno"), o(2, "Agência"), o(3, "Time interno e agência juntos")],
  },
  {
    id: "pecas", fase: "operacao", eyebrow: "02 · Volume",
    pergunta: "Quantas peças saem por mês?",
    ajuda: "Conte cada variação separada. Quase sempre o número é maior do que o time imagina.",
    opcoes: [o(12, "Até 20 peças"), o(35, "De 21 a 50"), o(95, "De 51 a 150"), o(260, "De 151 a 400"), o(600, "Mais de 400")],
  },
  {
    id: "custo", fase: "operacao", eyebrow: "03 · Custo",
    pergunta: "Quanto custa por mês a turma que produz essas peças?",
    ajuda: "Salários e encargos de quem põe a mão, mais o fee da agência. Só produção: sem mídia, sem time de dados, sem liderança.",
    opcoes: [
      o(10000, "Até R$ 15 mil"), o(26000, "De R$ 15 a 40 mil"), o(62000, "De R$ 40 a 90 mil"),
      o(130000, "De R$ 90 a 180 mil"), o(250000, "De R$ 180 a 350 mil"), o(450000, "Mais de R$ 350 mil"),
    ],
  },
  {
    id: "horas", fase: "operacao", eyebrow: "04 · Esforço",
    pergunta: "Uma única peça: quantas horas de gente ela consome, da ideia aprovada até o envio?",
    ajuda: "Some todo mundo que encosta nela: briefing, texto, arte, montagem, revisão, aprovação e configuração.",
    opcoes: [o(1.5, "1 a 2 horas"), o(4, "De 3 a 5 horas"), o(8, "De 6 a 10 horas"), o(15, "De 11 a 20 horas"), o(25, "Mais de 20 horas")],
  },
  {
    id: "mont", fase: "operacao", eyebrow: "05 · Natureza do trabalho",
    pergunta: "Desse tempo, quanto é montagem e quanto é criação de verdade?",
    ajuda: "Montar o HTML, trocar a imagem por segmento, adaptar o texto para a quinta variação, configurar o disparo. A parte que ninguém coloca no portfólio.",
    opcoes: [
      o(0.2, "Quase tudo é criação, montagem fica em uns 20%"),
      o(0.4, "Mais criação que montagem, uns 40% de montagem"),
      o(0.6, "Mais montagem que criação, uns 60%"),
      o(0.8, "Quase tudo é montagem, uns 80%"),
    ],
  },
  {
    id: "dias", fase: "operacao", eyebrow: "06 · Fila",
    pergunta: "Da ideia aprovada até a peça no ar, quantos dias úteis passam?",
    ajuda: "Tempo de calendário, não de trabalho. A espera entre uma etapa e outra também conta.",
    opcoes: [o(1.5, "1 a 2 dias"), o(4, "De 3 a 5 dias"), o(8, "De 6 a 10 dias"), o(15, "De 11 a 20 dias"), o(25, "Mais de 20 dias")],
  },
  {
    id: "mult", fase: "operacao", eyebrow: "07 · Teto",
    pergunta: "Se não existisse fila nem custo extra, quantas peças você soltaria por mês?",
    ajuda: "Pense no que o calendário comercial pediria, não no que a estrutura de hoje aguenta.",
    opcoes: [o(1, "O mesmo que hoje"), o(2, "Mais ou menos o dobro"), o(3, "Umas três vezes mais"), o(5, "Cinco vezes ou mais")],
  },
  {
    id: "maos", fase: "marca", eyebrow: "08 · Exposição",
    pergunta: "Quantas pessoas conseguem publicar algo com o nome da sua marca?",
    ajuda: "Todo mundo com permissão técnica de publicar, dentro e fora de casa: agência, estagiário, time regional, franqueado.",
    opcoes: [o(10, "De 1 a 3 pessoas"), o(25, "De 4 a 10"), o(35, "De 11 a 30"), o(40, "Mais de 30")],
  },
  {
    id: "trava", fase: "marca", eyebrow: "09 · Controle",
    pergunta: "O que de fato impede uma peça fora do padrão de ir ao ar?",
    ajuda: "Não o que está escrito no manual. O que realmente segura a peça antes do disparo.",
    opcoes: [
      o(0, "Software: o template não deixa sair do padrão"),
      o(15, "Checklist formal e revisão de uma pessoa"),
      o(25, "O olho de alguém que conhece a marca"),
      o(30, "Nada estruturado, a gente confia no time"),
    ],
  },
  {
    id: "furo", fase: "marca", eyebrow: "10 · Histórico",
    pergunta: "Alguma peça fora do padrão já escapou?",
    ajuda: "Logo errado, tom fora da marca, promessa que o jurídico não aprovaria, imagem de campanha antiga.",
    opcoes: [o(20, "Sim, nos últimos 12 meses"), o(12, "Sim, mas faz tempo"), o(0, "Não que eu saiba"), o(20, "Não saberíamos dizer")],
  },
  {
    id: "ia", fase: "marca", eyebrow: "11 · Posição sobre IA",
    pergunta: "E a IA generativa: qual é a regra real para ela criar peças com o nome da marca?",
    ajuda: "A regra que vale no dia a dia, não a do comunicado interno.",
    opcoes: [
      o(0, "Liberada, o time usa como achar melhor"),
      o(5, "Caso a caso, sem regra formal"),
      o(10, "Só com revisão humana, peça por peça"),
      o(10, "Não usamos IA generativa na comunicação da marca"),
    ],
  },
];

export const PERGUNTA_POR_ID = Object.fromEntries(PERGUNTAS.map((p) => [p.id, p])) as Record<StepId, Pergunta>;
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run test/steps.test.ts`
Expected: PASS (4 testes).

- [ ] **Step 5: Commit**

```bash
git add src/domain/steps.ts test/steps.test.ts
git commit -m "feat: as 11 perguntas com texto novo e valores do original

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 5: `calcular()` + entradas, validados contra o oráculo

**Files:**
- Create: `src/domain/calc.ts`, `src/domain/entradas.ts`, `test/calc.test.ts`

- [ ] **Step 1: Teste-oráculo**

`test/calc.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { calcular } from "@/domain/calc";
import { ajustesDeCampos, entradasDe, type Respostas } from "@/domain/entradas";
import { combinacoes, estadoOriginal } from "./combinacoes";
import { ref } from "./referencia";

// Objetos criados dentro do vm vêm de outro "realm"; structuredClone traz para o realm do teste.
const deLa = <T,>(x: T): T => structuredClone(x);

describe("calcular() == calc() original", () => {
  it.each(combinacoes().map((c, i) => [i, c] as const))("combinação %i", (_i, c) => {
    expect(calcular(entradasDe(c as Respostas))).toEqual(deLa(ref.calc(estadoOriginal(c))));
  });

  it("com números ajustados (sliders)", () => {
    const casos = [
      { pecas: "1", custo: "1000", horas: "0.25", mont: "0", dias: "0.5", mult: "1", rec: "1000", preco: "0" },
      { pecas: "40", custo: "85000", horas: "6.5", mont: "55", dias: "12", mult: "4.5", rec: "18000", preco: "6000" },
      { pecas: "", custo: "", horas: "", mont: "", dias: "", mult: "", rec: "", preco: "" },
    ];
    const base = combinacoes()[0];
    for (const campos of casos) {
      const aj = ajustesDeCampos(campos);
      const original = deLa(ref.calc({ ...estadoOriginal(base), ...aj }));
      expect(calcular(entradasDe(base as Respostas, aj))).toEqual(original);
    }
  });

  it("entradasDe recusa resposta faltando", () => {
    expect(() => entradasDe({})).toThrow(/sem resposta/);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run test/calc.test.ts`
Expected: FAIL — módulos `@/domain/calc` e `@/domain/entradas` não existem.

- [ ] **Step 3: Implementar `calc.ts`**

`src/domain/calc.ts`:
```ts
import { LIMIAR_AMARELO, LIMIAR_VERDE, MARCA_ALTA, MARCA_MEDIA, RECURSO } from "./constants";

export type Nivel = "ok" | "warn" | "err";

export interface Entradas {
  pecas: number;
  custo: number;
  horas: number;
  mont: number;
  mult: number;
  dias: number;
  maos: number;
  trava: number;
  furo: number;
  ia: number;
  iaProibida: boolean;
  rec: number;
  preco: number;
}

export interface Resultado {
  preco: number; rec: number; pecas: number; custo: number; horas: number; mont: number; mult: number; dias: number;
  custoPeca: number; horasMes: number; custoHora: number; horasMont: number; pessoas: number;
  piso: number; gap: number; custoGap: number; teto: number; recursos: number; frac: number; pecasEq: number; horasEq: number;
  f: { k: Nivel; t: string; b: number };
  marca: number;
  m: { k: Nivel; t: string; lvl: "alta" | "média" | "baixa" };
  iaProibida: boolean;
}

/** Porte exato de calc() de maestro.com.ai/custo-da-fila. Não mude a ordem dos campos: o teste compara com toEqual. */
export function calcular(s: Entradas): Resultado {
  const preco = s.preco > 0 ? s.preco : 0;
  const rec = s.rec > 0 ? s.rec : RECURSO;
  const pecas = Math.max(1, s.pecas);
  const custo = Math.max(1, s.custo);
  const horas = Math.max(0.25, s.horas);
  const mont = Math.min(1, Math.max(0, s.mont));
  const mult = Math.max(1, s.mult);

  const custoPeca = custo / pecas;
  const horasMes = pecas * horas;
  const custoHora = custo / horasMes;
  const horasMont = horasMes * mont;
  const piso = custo * mont;
  const gap = pecas * (mult - 1);
  const custoGap = gap * custoPeca;
  const teto = piso + custoGap;
  const recursos = teto / rec;
  const pessoas = horasMont / 168;
  const frac = preco / custo;
  const pecasEq = preco / custoPeca;
  const horasEq = preco / custoHora;

  let f: Resultado["f"];
  if (teto >= LIMIAR_VERDE) f = { k: "ok", t: "Verde — um recurso alocado ou mais", b: 2 };
  else if (teto >= LIMIAR_AMARELO) f = { k: "warn", t: "Amarelo — perto de um recurso alocado", b: 1 };
  else f = { k: "err", t: "Vermelho — abaixo do limiar de mudança", b: 0 };

  const marca = (s.maos || 0) + (s.trava || 0) + (s.furo || 0) + (s.ia || 0);
  let m: Resultado["m"];
  if (marca >= MARCA_ALTA) m = { k: "err", t: "Exposição alta", lvl: "alta" };
  else if (marca >= MARCA_MEDIA) m = { k: "warn", t: "Exposição média", lvl: "média" };
  else m = { k: "ok", t: "Exposição baixa", lvl: "baixa" };

  return {
    preco, rec, pecas, custo, horas, mont, mult, dias: s.dias,
    custoPeca, horasMes, custoHora, horasMont, pessoas,
    piso, gap, custoGap, teto, recursos, frac, pecasEq, horasEq,
    f, marca, m, iaProibida: s.iaProibida,
  };
}
```

- [ ] **Step 4: Implementar `entradas.ts`**

`src/domain/entradas.ts`:
```ts
import type { Entradas } from "./calc";
import { PRECO, RECURSO } from "./constants";
import { PERGUNTA_POR_ID, type StepId } from "./steps";

/** Índice da opção escolhida em cada pergunta. */
export type Respostas = Partial<Record<StepId, number>>;

export interface Ajustes {
  pecas?: number; custo?: number; horas?: number; mont?: number; dias?: number; mult?: number; rec?: number; preco?: number;
}

export type CamposAjuste = Record<"pecas" | "custo" | "horas" | "mont" | "dias" | "mult" | "rec" | "preco", string>;

export function entradasDe(r: Respostas, aj: Ajustes = {}): Entradas {
  const v = (id: StepId) => {
    const i = r[id];
    if (i === undefined) throw new Error(`Pergunta ${id} sem resposta`);
    return PERGUNTA_POR_ID[id].opcoes[i].valor;
  };
  return {
    pecas: aj.pecas ?? v("pecas"),
    custo: aj.custo ?? v("custo"),
    horas: aj.horas ?? v("horas"),
    mont: aj.mont ?? v("mont"),
    mult: aj.mult ?? v("mult"),
    dias: aj.dias ?? v("dias"),
    maos: v("maos"),
    trava: v("trava"),
    furo: v("furo"),
    ia: v("ia"),
    iaProibida: r.ia === 3,
    rec: aj.rec ?? RECURSO,
    preco: aj.preco ?? PRECO,
  };
}

/** Mesmas regras de readTune() do original: campo vazio ou zero cai no valor padrão. */
export function ajustesDeCampos(c: CamposAjuste): Required<Ajustes> {
  return {
    pecas: parseFloat(c.pecas) || 1,
    custo: parseFloat(c.custo) || 1,
    horas: parseFloat(c.horas) || 0.25,
    mont: (parseFloat(c.mont) || 0) / 100,
    dias: parseFloat(c.dias) || 0.5,
    mult: parseFloat(c.mult) || 1,
    rec: parseFloat(c.rec) || RECURSO,
    preco: parseFloat(c.preco) || 0,
  };
}

/** Valores iniciais dos campos de ajuste, como o finish() do original preenche. */
export function camposIniciais(e: Entradas): CamposAjuste {
  return {
    pecas: String(e.pecas), custo: String(e.custo), horas: String(e.horas), mont: String(Math.round(e.mont * 100)),
    dias: String(e.dias), mult: String(e.mult), rec: String(e.rec), preco: String(e.preco),
  };
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npx vitest run test/calc.test.ts`
Expected: PASS (todas as ~450 combinações + 2 testes). Se alguma combinação falhar, o diff do `toEqual` mostra o campo divergente: corrija a fórmula, nunca o teste.

- [ ] **Step 6: Commit**

```bash
git add src/domain test/calc.test.ts
git commit -m "feat: calcular() idêntico ao original em 450+ combinações

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 6: Textos do resultado (veredicto, faróis, fila, tempo, equilíbrio)

**Files:**
- Create: `src/domain/readings.ts`, `test/readings.test.ts`

- [ ] **Step 1: Teste-oráculo + casos dos textos que no original ficam dentro de `show()`**

`test/readings.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { calcular } from "@/domain/calc";
import { entradasDe, type Respostas } from "@/domain/entradas";
import * as L from "@/domain/readings";
import { combinacoes } from "./combinacoes";
import { ref } from "./referencia";

describe("textos == original", () => {
  it.each(combinacoes().map((c, i) => [i, c] as const))("combinação %i", (_i, c) => {
    const r = calcular(entradasDe(c as Respostas));
    expect(L.verdict(r)).toEqual(structuredClone(ref.verdict(r)));
    expect(L.explainValor(r)).toBe(ref.explainValor(r));
    expect(L.explainMarca(r)).toBe(ref.explainMarca(r));
    expect(L.spot(r)).toEqual(structuredClone(ref.spot(r)));
    expect(L.flagText(r)).toBe(ref.flagText(r));
    expect(L.tempoText(r)).toBe(ref.tempoText(r));
    expect(L.filaText(r)).toBe(ref.filaText(r));
    expect(L.eqText(r)).toBe(ref.eqText(r));
  });
});

describe("textos que no original estão dentro de show()", () => {
  const conferencia = { quem: 2, pecas: 2, custo: 2, horas: 2, mont: 2, dias: 2, mult: 2, maos: 2, trava: 2, furo: 2, ia: 2 } as Respostas;
  const r = calcular(entradasDe(conferencia));

  it("piso e teto", () => {
    expect(L.pisoExp(r)).toBe("60% da sua estrutura está em montagem e versionamento. Esse número não depende de você crescer.");
    expect(L.tetoExp(r)).toBe("Inclui o custo de produzir as 190 peças a mais que você disse que faria. Se a ambição não se concretizar, vale o piso.");
  });
  it("relação com o Composer", () => {
    const rel = L.relacao(r);
    expect(rel.destaque).toBe("26,9×");
    expect(rel.html).toContain("<strong>R$ 6.000 por mês</strong>");
  });
  it("contas por extenso", () => {
    const c = L.contas(r);
    expect(c.peca).toBe("R$ 62.000 ÷ 95 peças = R$ 653 por peça");
    expect(c.piso).toBe("R$ 62.000 × 60% = R$ 37.200 por mês");
    expect(c.teto).toBe("R$ 37.200 + (190 × R$ 653) = R$ 161.200 por mês");
    expect(c.rec).toBe("R$ 161.200 ÷ R$ 25.000 = 6,4 pessoas");
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run test/readings.test.ts`
Expected: FAIL — módulo `@/domain/readings` não existe.

- [ ] **Step 3: Implementar**

`src/domain/readings.ts` (textos copiados do original; o oráculo garante que são idênticos):
```ts
import type { Nivel, Resultado } from "./calc";
import { brl, num, pct } from "./format";

export interface Veredicto { k: Nivel; lamp: string; t: string; b: string }

export function verdict(r: Resultado): Veredicto {
  const fk = r.f.k, alta = r.m.lvl === "alta";
  if (fk === "ok")
    return { k: "ok", lamp: "Caso fechado",
      t: "Os números fecham sozinhos. A conversa não é se vale, é quando começa.",
      b: "Há " + brl(r.teto) + " por mês em jogo na sua operação de conteúdo, o equivalente a " + num(r.recursos, 1) +
        " recurso" + (r.recursos > 1 ? "s" : "") + " alocado" + (r.recursos > 1 ? "s" : "") + ". O Composer custa " + brl(r.preco) +
        ". Nessa proporção, a decisão deixa de ser de orçamento e passa a ser de prioridade: quanto tempo você ainda vai levar para destravar as peças que não saem." };
  if (fk === "warn" && alta)
    return { k: "ok", lamp: "Vale a conversa",
      t: "O seu caso não se decide pelo custo. Se decide pelo risco.",
      b: "O valor em jogo — " + brl(r.teto) + " por mês contra " + brl(r.preco) +
        " de mensalidade — fica na faixa em que a conta precisa ser feita com o time. Mas a sua exposição de marca é alta: " +
        "hoje o que impede uma peça fora do padrão de ir ao ar é gente, não software. Empresa que trata marca com esse zelo normalmente não compra ferramenta de produção por preço. Compra por controle." };
  if (fk === "warn")
    return { k: "warn", lamp: "Meça antes de decidir",
      t: "Está na zona em que a resposta depende de um número que você ainda não tem.",
      b: "Com " + brl(r.teto) + " por mês em jogo contra " + brl(r.preco) + " de mensalidade, a relação é defensável mas não é óbvia. " +
        "Antes de decidir, meça onde vão de fato as " + num(r.horasMes, 0) + " horas que a sua estrutura gasta por mês. Se a montagem for maior do que você estimou, o caso muda de faixa. Se for menor, não muda." };
  if (alta)
    return { k: "warn", lamp: "Vale a conversa — por outro motivo",
      t: "Pelo dinheiro, não. Pela governança da sua marca, sim.",
      b: "A sua operação é enxuta demais para o Composer se pagar por economia: há " + brl(r.teto) +
        " por mês em jogo contra " + brl(r.preco) + " de mensalidade, abaixo do limiar em que vale mudar de processo. Mas a sua marca hoje é governada por pessoas, e isso não escala nem com mais revisão nem com mais política. " +
        "Se o seu problema é quem pode publicar em nome da marca, a conversa é essa — e não é sobre custo de peça." };
  return { k: "err", lamp: "Não é para você hoje",
    t: "Nem o custo nem o risco justificam essa conversa agora.",
    b: "Há " + brl(r.teto) + " por mês em jogo contra " + brl(r.preco) +
      " de mensalidade de entrada do Composer — abaixo do limiar em que vale mudar de processo — e a sua exposição de marca é " + r.m.lvl +
      ". Isso é uma boa notícia sobre a sua operação, não um problema. Em vez de produção, o ganho mais provável na sua escala está em custo de mídia e receita por disparo — que é outra conversa, e a gente também tem ela. Não marque uma sessão sobre Composer só para confirmar isto." };
}

export function explainValor(r: Resultado): string {
  return "São " + brl(r.piso) + " por mês que a sua estrutura já gasta hoje em montagem e versionamento — trabalho que existe quer você cresça ou não — mais " +
    brl(r.custoGap) + " que custaria produzir, com a estrutura atual, as " + num(r.gap, 0) +
    " peças a mais que você disse que faria. Isso não é economia prometida: é o tamanho do que está em disputa, ao seu próprio custo.";
}

export function explainMarca(r: Resultado): string {
  const p = r.marca >= 60 ? "A sua marca hoje é governada por gente. "
    : r.marca >= 35 ? "A sua marca hoje é governada por processo e por gente, em partes iguais. "
    : "A sua marca hoje está relativamente protegida por estrutura, não por vigilância. ";
  return p + "Revisão humana funciona até o volume dobrar — e aí ou o revisor vira gargalo, ou alguma coisa passa. " +
    "A pergunta que decide não é se o seu time é cuidadoso. É quantas peças por mês ele consegue olhar uma a uma sem virar fila.";
}

/** Bloco de destaque. `b` é HTML fixo (sem dado do usuário), seguro para dangerouslySetInnerHTML. */
export function spot(r: Resultado): { h: string; b: string } | null {
  if (r.iaProibida) return { h: "Você não usa IA generativa com o nome da marca.",
    b: "<p>É a decisão mais defensável do mercado em 2026, e quem a tomou normalmente tomou por um motivo concreto: nenhuma ferramenta generativa consegue garantir que a peça número mil saia dentro da marca. Pedir para confiar na IA não é resposta para isso.</p>" +
      "<p>A proposta do Composer é a oposta. O template é travado <strong>antes</strong> de a IA entrar, e a trava é de software, não de política: a imagem que não muda, o texto fixo, o link, o botão. A IA só preenche o que foi explicitamente liberado. Em e-mail a trava desce a esse nível de detalhe; em SMS, push, WhatsApp e redes, a trava de DNA de marca vale igual.</p>" +
      "<p>Não é \"confie na IA\". É \"a IA não alcança\".</p>" };
  if (r.marca >= 60) return { h: "O volume é o que vai quebrar a sua governança — não a má-fé.",
    b: "<p>O erro que custa caro quase nunca é o óbvio. É a peça que passou: a mão com seis dedos no banner, o logo esticado, o tom que não é o da marca na milésima variação. Revisão humana pega as primeiras. É o volume que decide quantas passam.</p>" +
      "<p>Com o controle apoiado em revisão humana, cada peça a mais é uma peça a mais para alguém olhar. É por isso que operações com marca forte acabam limitando o próprio volume sem nunca decidir isso formalmente: a governança vira o teto de produção.</p>" +
      "<p>Travar o template por software inverte a relação. O padrão deixa de depender de quem revisou e passa a depender do que o sistema permite gerar.</p>" };
  return null;
}

export function flagText(r: Resultado): string {
  if (r.custoHora < 40) return "Uma checagem nos seus próprios números: " + brl(r.custo) + " por mês divididos por " + num(r.horasMes, 0) +
    " horas de produção dão " + brl(r.custoHora) + " por hora. É baixo demais para uma estrutura de marketing no Brasil. Provavelmente há mais peças contadas do que a estrutura entrega, ou menos horas por peça do que elas levam. Vale refazer as perguntas 2 e 4.";
  if (r.custoHora > 600) return "Uma checagem nos seus próprios números: " + brl(r.custo) + " por mês divididos por " + num(r.horasMes, 0) +
    " horas de produção dão " + brl(r.custoHora) + " por hora. É alto para trabalho de produção. O mais provável é que essa estrutura faça muito além de produzir peças. Isolando só a produção, a leitura fica mais justa.";
  return "";
}

export function tempoText(r: Resultado): string {
  return "A sua operação consome " + num(r.horasMes, 0) + " horas de gente por mês para produzir " + num(r.pecas, 0) +
    " peças. Pela sua própria estimativa, " + num(r.horasMont, 0) + " dessas horas são montagem, versionamento e configuração — " +
    pct(r.mont) + " do total, o equivalente a " + num(r.pessoas, 1) + " pessoa" + (r.pessoas > 1 ? "s" : "") +
    " em tempo integral dedicada" + (r.pessoas > 1 ? "s" : "") + " a trabalho que não aparece em portfólio nenhum.";
}

export function filaText(r: Resultado): string {
  const d = r.dias;
  const t = "Da ideia aprovada ao ar passam " + num(d, 1) + " dias úteis. Essa é a sua janela mínima de reação: nenhuma oportunidade que apareça e morra em menos tempo do que isso é aproveitável pela sua operação. ";
  if (d >= 11) return t + "Com mais de duas semanas de fila, o calendário comercial decide por você — só entra no ar o que foi planejado com um mês de antecedência. Campanha de oportunidade, resposta a concorrente e teste em campanha viva ficam fora, por construção.";
  if (d >= 6) return t + "Com mais de uma semana, testar fica caro: cada variação custa uma passagem inteira pela fila, e é por isso que o teste sempre perde para a entrega.";
  return t + "A sua fila é curta para o padrão de mercado. Se o volume também não incomoda, o gargalo da sua operação está em outro lugar.";
}

export function eqText(r: Resultado): string {
  return "Visto por outro ângulo, sem nenhuma premissa: o Composer custa " + brl(r.preco) + " por mês e a sua estrutura de produção custa " +
    brl(r.custo) + ". Para empatar, ele precisa devolver " + pct(r.frac) + " da capacidade dessa estrutura — o equivalente a " +
    num(r.pecasEq, 1) + " peça" + (r.pecasEq > 1 ? "s" : "") + " ou " + num(r.horasEq, 0) + " horas por mês, sobre as " + num(r.horasMes, 0) +
    " que você já gasta. Compare esse número com as " + num(r.horasMont, 0) + " horas que hoje vão para montagem.";
}

// ---- Textos que no original ficam dentro de show() ----

export function pisoExp(r: Resultado): string {
  return pct(r.mont) + " da sua estrutura está em montagem e versionamento. Esse número não depende de você crescer.";
}

export function tetoExp(r: Resultado): string {
  return r.mult > 1
    ? "Inclui o custo de produzir as " + num(r.gap, 0) + " peças a mais que você disse que faria. Se a ambição não se concretizar, vale o piso."
    : "Você disse que manteria o volume de hoje. Sem gap de capacidade, teto e piso são o mesmo número.";
}

/** `html` é texto fixo + valores formatados (sem dado digitado pelo usuário). */
export function relacao(r: Resultado): { destaque: string; html: string } {
  const ratio = r.preco > 0 ? r.teto / r.preco : 0;
  if (ratio >= 1)
    return { destaque: num(ratio, 1) + "×",
      html: "é quanto o valor em jogo na sua operação é maior que a mensalidade do Maestro Composer, que começa em <strong>" +
        brl(r.preco) + " por mês</strong>. A conta não diz que você economiza isso: diz o tamanho do que está em disputa ao lado do que custa disputar." };
  return { destaque: brl(r.preco),
    html: "é a mensalidade de entrada do Maestro Composer. Na sua operação, o valor em jogo hoje é <strong>menor do que isso</strong> — é por esse motivo, e só por ele, que o primeiro farol está vermelho." };
}

export function contas(r: Resultado) {
  return {
    peca: brl(r.custo) + " ÷ " + num(r.pecas, 0) + " peças = " + brl(r.custoPeca) + " por peça",
    hora: brl(r.custo) + " ÷ (" + num(r.pecas, 0) + " × " + num(r.horas, 1) + " h) = " + brl(r.custoHora) + " por hora",
    piso: brl(r.custo) + " × " + pct(r.mont) + " = " + brl(r.piso) + " por mês",
    teto: brl(r.piso) + " + (" + num(r.gap, 0) + " × " + brl(r.custoPeca) + ") = " + brl(r.teto) + " por mês",
    rec: brl(r.teto) + " ÷ " + brl(r.rec) + " = " + num(r.recursos, 1) + " pessoa" + (r.recursos > 1 ? "s" : ""),
  };
}

export function recursoTexto(r: Resultado): string {
  return "Na régua de " + brl(r.rec) + " por recurso alocado, isso equivale a " + num(r.recursos, 1) +
    " pessoa" + (r.recursos > 1 ? "s" : "") + " dedicada" + (r.recursos > 1 ? "s" : "") + " em tempo integral. Ajuste esse valor abaixo se na sua empresa ele for outro.";
}

export function montagemRotulo(r: Resultado): string {
  return "horas por mês em montagem e versionamento — " + num(r.pessoas, 1) + " pessoa" + (r.pessoas > 1 ? "s" : "") + " em tempo integral";
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run test/readings.test.ts`
Expected: PASS. Qualquer divergência de texto aparece no diff: corrija a string em `readings.ts` até bater com o original.

- [ ] **Step 5: Commit**

```bash
git add src/domain/readings.ts test/readings.test.ts
git commit -m "feat: veredicto e textos do resultado idênticos ao original

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 7: Conteúdo do jogo (cards "Você sabia?" e reações do robô)

**Files:**
- Create: `src/domain/conteudo.ts`, `test/conteudo.test.ts`

- [ ] **Step 1: Teste**

`test/conteudo.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { REACAO_PERFIL, REACOES, VOCE_SABIA } from "@/domain/conteudo";
import { PERGUNTAS } from "@/domain/steps";

describe("conteúdo", () => {
  it("4 cards com fonte", () => {
    expect(VOCE_SABIA).toHaveLength(4);
    VOCE_SABIA.forEach((c) => expect(c.fonte.length).toBeGreaterThan(5));
  });
  it("uma reação por opção, até 60 caracteres, sem número que não veio da resposta", () => {
    for (const p of PERGUNTAS) {
      expect(REACOES[p.id]).toHaveLength(p.opcoes.length);
      REACOES[p.id].forEach((txt) => {
        expect(txt.length).toBeLessThanOrEqual(60);
        expect(txt).not.toMatch(/R\$/);
      });
    }
    expect(REACAO_PERFIL.length).toBeLessThanOrEqual(60);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run test/conteudo.test.ts`
Expected: FAIL — módulo não existe.

- [ ] **Step 3: Implementar**

`src/domain/conteudo.ts`:
```ts
import type { StepId } from "./steps";

export interface CardVoceSabia { numero: string; texto: string; fonte: string }

export const VOCE_SABIA: CardVoceSabia[] = [
  { numero: "3,6%", texto: "89% dizem que o criativo decide a performance. Só 3,6% otimizam o criativo de fato. A distância entre os dois números é a fila.", fonte: "EMARKETER com Perion · abril de 2026" },
  { numero: "78%", texto: "dos profissionais de marketing precisam de mais conteúdo personalizado do que conseguem produzir. Capacidade de produção é hoje o primeiro obstáculo da personalização.", fonte: "Salesforce, State of Marketing 2026 · 4.450 respondentes" },
  { numero: "72,1%", texto: "esperam a performance cair para mexer no criativo. Não por escolha: trocar o criativo custa uma nova passagem pela fila.", fonte: "EMARKETER com Perion · abril de 2026" },
  { numero: "<10%", texto: "dos ativos criativos são testados antes de ir ao ar. Criativo validado antes do lançamento está associado a +46% de receita.", fonte: "EMARKETER com Toluna · maio de 2026" },
];

export const REACAO_PERFIL = "Perfil montado. Agora vamos à operação.";

export const REACOES: Record<StepId, string[]> = {
  quem: ["Time da casa. Conhece a marca de cor.", "Agência no comando. Anotado.", "Casa e agência juntas. Mais mãos no jogo."],
  pecas: ["Operação enxuta. Vamos ver o custo.", "Volume em ritmo de cruzeiro.", "Volume de gente grande.", "Isso já é uma fábrica de peças.", "Mais de 400. A fila vira assunto sério."],
  custo: ["Estrutura leve. Anotado.", "Estrutura média. Anotado.", "Investimento considerável.", "Estrutura robusta.", "Estrutura de alto calibre.", "Operação de peso. Vamos à conta."],
  horas: ["Rápido. A peça sai em poucas horas.", "Ritmo comum de mercado.", "Quase um dia útil por peça.", "Mais de um dia de gente por peça.", "Cada peça vira um pequeno projeto."],
  mont: ["Time focado em criar. Bom sinal.", "Equilíbrio entre criar e montar.", "A montagem já come a maior parte.", "Quase tudo é montagem. Anotei."],
  dias: ["Fila curtíssima. Raro de ver.", "Quase uma semana de espera.", "Mais de uma semana na fila.", "Duas semanas ou mais esperando.", "Um mês de fila. Anotado."],
  mult: ["O volume de hoje dá conta. Anotado.", "O dobro. A ambição entrou na conta.", "Três vezes mais. Bastante peça parada.", "Cinco vezes ou mais. Muita peça na fila."],
  maos: ["Poucas mãos. Controle mais fácil.", "Um grupo pequeno publica.", "Já é bastante gente com acesso.", "Mais de 30 mãos na sua marca."],
  trava: ["Trava de software. Bem protegido.", "Processo formal, apoiado numa pessoa.", "O olho humano segura a marca.", "Confiança no time. Anotado."],
  furo: ["Aconteceu há pouco. Registrado.", "Já passou, mas aconteceu.", "Nenhum que você saiba.", "Sem visibilidade. Isso também conta."],
  ia: ["IA liberada. Anotado.", "Caso a caso, sem regra fixa.", "Revisão humana em cada peça.", "Sem IA na marca. Decisão firme."],
};
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run test/conteudo.test.ts`
Expected: PASS (2 testes).

- [ ] **Step 5: Commit**

```bash
git add src/domain/conteudo.ts test/conteudo.test.ts
git commit -m "feat: cards Você sabia? e reações do robô

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Fase 3 · Fluxo do jogo

### Task 8: Sequência de telas, reducer, progresso e nível da música

**Files:**
- Create: `src/flow/quiz.ts`, `test/quiz.test.ts`

- [ ] **Step 1: Teste**

`test/quiz.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { ESTADO_INICIAL, SEQUENCIA, mostraBarra, nivelMusica, podeAvancar, progresso, quizReducer, telaAtual, type Estado } from "@/flow/quiz";

const avancar = (e: Estado) => quizReducer(e, { type: "avancar" });

describe("fluxo", () => {
  it("sequência com 21 telas na ordem da spec", () => {
    expect(SEQUENCIA).toHaveLength(21);
    expect(SEQUENCIA.map((t) => t.tipo).slice(0, 3)).toEqual(["intro", "perfil", "vocesabia"]);
    expect(SEQUENCIA.slice(-4).map((t) => t.tipo)).toEqual(["contato", "calculando", "resultado", "final"]);
  });

  it("perfil só avança com setor e faturamento", () => {
    let e = avancar(ESTADO_INICIAL);
    expect(telaAtual(e).tipo).toBe("perfil");
    expect(podeAvancar(e)).toBe(false);
    e = quizReducer(e, { type: "perfil", campo: "setor", valor: "Varejo" });
    expect(avancar(e).indice).toBe(e.indice);
    e = quizReducer(e, { type: "perfil", campo: "fat", valor: "Até R$ 100 milhões" });
    expect(telaAtual(avancar(e)).tipo).toBe("vocesabia");
  });

  it("pergunta só avança respondida; voltar preserva resposta", () => {
    let e: Estado = { ...ESTADO_INICIAL, indice: 3, setor: "x", fat: "y" };
    expect(telaAtual(e)).toEqual({ tipo: "pergunta", id: "quem" });
    expect(podeAvancar(e)).toBe(false);
    e = quizReducer(e, { type: "responder", id: "quem", opcao: 1 });
    e = avancar(e);
    e = quizReducer(e, { type: "voltar" });
    expect(e.respostas.quem).toBe(1);
    expect(telaAtual(e)).toEqual({ tipo: "pergunta", id: "quem" });
  });

  it("não volta da intro nem depois do contato", () => {
    expect(quizReducer(ESTADO_INICIAL, { type: "voltar" }).indice).toBe(0);
    const resultado = SEQUENCIA.findIndex((t) => t.tipo === "resultado");
    expect(quizReducer({ ...ESTADO_INICIAL, indice: resultado }, { type: "voltar" }).indice).toBe(resultado);
  });

  it("contato só avança depois de preenchido", () => {
    const i = SEQUENCIA.findIndex((t) => t.tipo === "contato");
    const e: Estado = { ...ESTADO_INICIAL, indice: i };
    expect(podeAvancar(e)).toBe(false);
    const c = quizReducer(e, { type: "contato", contato: { nome: "A", email: "a@b.co", empresa: "E", cargo: "C", whatsapp: "" } });
    expect(podeAvancar(c)).toBe(true);
  });

  it("progresso conta perfil + respostas sobre 12", () => {
    const e: Estado = { ...ESTADO_INICIAL, indice: 4, setor: "x", fat: "y", respostas: { quem: 0, pecas: 1 } };
    expect(progresso(e)).toEqual({ feitos: 3, total: 12, percentual: 25, atual: 2 });
  });

  it("nível da música sobe por fase e zera no vídeo", () => {
    const nivelEm = (tipo: string) => nivelMusica({ ...ESTADO_INICIAL, indice: SEQUENCIA.findIndex((t) => t.tipo === tipo) });
    expect(nivelEm("intro")).toBe(0);
    expect(nivelEm("perfil")).toBe(1);
    expect(nivelMusica({ ...ESTADO_INICIAL, indice: 3 })).toBe(2);
    expect(nivelMusica({ ...ESTADO_INICIAL, indice: SEQUENCIA.findIndex((t) => t.tipo === "pergunta" && t.id === "maos") })).toBe(3);
    expect(nivelEm("resultado")).toBe(4);
    expect(nivelEm("final")).toBe(0);
  });

  it("barra aparece só do perfil ao contato", () => {
    expect(mostraBarra({ tipo: "intro" })).toBe(false);
    expect(mostraBarra({ tipo: "perfil" })).toBe(true);
    expect(mostraBarra({ tipo: "contato" })).toBe(true);
    expect(mostraBarra({ tipo: "resultado" })).toBe(false);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run test/quiz.test.ts`
Expected: FAIL — módulo não existe.

- [ ] **Step 3: Implementar**

`src/flow/quiz.ts`:
```ts
import { PERGUNTAS, PERGUNTA_POR_ID, type StepId } from "@/domain/steps";

export type Tela =
  | { tipo: "intro" }
  | { tipo: "perfil" }
  | { tipo: "pergunta"; id: StepId }
  | { tipo: "vocesabia"; card: number }
  | { tipo: "contato" }
  | { tipo: "calculando" }
  | { tipo: "resultado" }
  | { tipo: "final" };

const p = (id: StepId): Tela => ({ tipo: "pergunta", id });

export const SEQUENCIA: Tela[] = [
  { tipo: "intro" },
  { tipo: "perfil" },
  { tipo: "vocesabia", card: 0 },
  p("quem"), p("pecas"), p("custo"), p("horas"),
  { tipo: "vocesabia", card: 1 },
  p("mont"), p("dias"), p("mult"),
  { tipo: "vocesabia", card: 2 },
  p("maos"), p("trava"), p("furo"), p("ia"),
  { tipo: "vocesabia", card: 3 },
  { tipo: "contato" },
  { tipo: "calculando" },
  { tipo: "resultado" },
  { tipo: "final" },
];

export interface Contato { nome: string; email: string; empresa: string; cargo: string; whatsapp: string }

export interface Estado {
  indice: number;
  respostas: Partial<Record<StepId, number>>;
  setor: string;
  fat: string;
  contato: Contato | null;
}

export type Acao =
  | { type: "avancar" }
  | { type: "voltar" }
  | { type: "responder"; id: StepId; opcao: number }
  | { type: "perfil"; campo: "setor" | "fat"; valor: string }
  | { type: "contato"; contato: Contato };

export const ESTADO_INICIAL: Estado = { indice: 0, respostas: {}, setor: "", fat: "", contato: null };

export function telaAtual(e: Estado): Tela {
  return SEQUENCIA[e.indice];
}

export function podeAvancar(e: Estado): boolean {
  const t = telaAtual(e);
  switch (t.tipo) {
    case "perfil": return !!e.setor && !!e.fat;
    case "pergunta": return e.respostas[t.id] !== undefined;
    case "contato": return e.contato !== null;
    case "final": return false;
    default: return true;
  }
}

const VOLTAVEL: Tela["tipo"][] = ["perfil", "vocesabia", "pergunta", "contato"];

export function quizReducer(e: Estado, a: Acao): Estado {
  switch (a.type) {
    case "avancar":
      return podeAvancar(e) ? { ...e, indice: Math.min(e.indice + 1, SEQUENCIA.length - 1) } : e;
    case "voltar":
      return VOLTAVEL.includes(telaAtual(e).tipo) && e.indice > 1 ? { ...e, indice: e.indice - 1 } : e;
    case "responder":
      return { ...e, respostas: { ...e.respostas, [a.id]: a.opcao } };
    case "perfil":
      return { ...e, [a.campo]: a.valor };
    case "contato":
      return { ...e, contato: a.contato };
  }
}

export function progresso(e: Estado) {
  const feitos = (e.setor && e.fat ? 1 : 0) + PERGUNTAS.filter((q) => e.respostas[q.id] !== undefined).length;
  const t = telaAtual(e);
  const atual = t.tipo === "perfil" ? 0 : t.tipo === "pergunta" ? 1 + PERGUNTAS.findIndex((q) => q.id === t.id) : -1;
  return { feitos, total: 12, percentual: Math.round((feitos / 12) * 100), atual };
}

export function nivelMusica(e: Estado): number {
  const t = telaAtual(e);
  if (t.tipo === "intro" || t.tipo === "final") return 0;
  if (t.tipo === "contato" || t.tipo === "calculando" || t.tipo === "resultado") return 4;
  if (t.tipo === "pergunta") return PERGUNTA_POR_ID[t.id].fase === "operacao" ? 2 : 3;
  if (t.tipo === "vocesabia") return [1, 2, 3, 3][t.card];
  return 1;
}

export function mostraBarra(t: Tela): boolean {
  return t.tipo === "perfil" || t.tipo === "vocesabia" || t.tipo === "pergunta" || t.tipo === "contato";
}

export function respostasCompletas(e: Estado): boolean {
  return PERGUNTAS.every((q) => e.respostas[q.id] !== undefined);
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run test/quiz.test.ts`
Expected: PASS (8 testes).

- [ ] **Step 5: Commit**

```bash
git add src/flow test/quiz.test.ts
git commit -m "feat: fluxo de telas, progresso e nível da música

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Fase 4 · Dados e n8n

### Task 9: Colunas, origem e validação do contato

**Files:**
- Create: `src/data/colunas.ts`, `src/data/origem.ts`, `src/data/contato.ts`, `test/dados.test.ts`

- [ ] **Step 1: Teste**

`test/dados.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { COLUNAS } from "@/data/colunas";
import { validarContato } from "@/data/contato";
import { lerOrigem } from "@/data/origem";

describe("colunas", () => {
  it("36 colunas, ID e Nome presentes, sem repetição", () => {
    expect(COLUNAS).toHaveLength(36);
    expect(new Set(COLUNAS).size).toBe(36);
    expect(COLUNAS[1]).toBe("ID");
  });
});

describe("origem", () => {
  it("lê ?o= e UTMs", () => {
    const o = lerOrigem("?o=cmp-nc&utm_source=linkedin&utm_campaign=lancamento", false);
    expect(o).toEqual({ origem: "cmp-nc", utms: "utm_source=linkedin; utm_campaign=lancamento", dispositivo: "desktop" });
  });
  it("sem parâmetros", () => {
    expect(lerOrigem("", true)).toEqual({ origem: "", utms: "", dispositivo: "celular" });
  });
});

describe("contato", () => {
  const ok = { nome: " Ana ", email: "ANA@Empresa.com.br", empresa: "Empresa", cargo: "Diretora", whatsapp: "+55 (11) 98765-4321" };
  it("aceita e normaliza", () => {
    expect(validarContato(ok)).toEqual({ ok: true, contato: { nome: "Ana", email: "ana@empresa.com.br", empresa: "Empresa", cargo: "Diretora", whatsapp: "5511987654321" } });
  });
  it("WhatsApp é opcional", () => {
    const r = validarContato({ ...ok, whatsapp: "" });
    expect(r.ok && r.contato.whatsapp).toBe("");
  });
  it.each([
    [{ ...ok, nome: "" }, "nome", "Informe seu nome."],
    [{ ...ok, email: "ana@" }, "email", "Informe um e-mail corporativo válido."],
    [{ ...ok, empresa: " " }, "empresa", "Informe a empresa."],
    [{ ...ok, cargo: "" }, "cargo", "Informe seu cargo."],
    [{ ...ok, whatsapp: "123" }, "whatsapp", "Confira o WhatsApp (DDD + número)."],
  ])("recusa %#", (entrada, campo, mensagem) => {
    expect(validarContato(entrada)).toEqual({ ok: false, campo, mensagem });
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run test/dados.test.ts`
Expected: FAIL — módulos não existem.

- [ ] **Step 3: Implementar**

`src/data/colunas.ts`:
```ts
/** Cabeçalho da planilha "RESPOSTAS VC SABIA MAESTRO". A mesma lista está no Code node do n8n (teste na Task 11). */
export const COLUNAS = [
  "Data/hora", "ID", "Nome", "E-mail", "Empresa", "Cargo", "WhatsApp", "Setor", "Faturamento",
  "Quem produz", "Peças/mês", "Custo da estrutura", "Horas/peça", "% montagem", "Dias de fila", "Peças sem fila",
  "Mãos que publicam", "O que trava", "Já escapou", "Posição sobre IA",
  "Custo/peça", "Custo/hora", "Horas de montagem/mês", "Piso", "Teto", "Recursos equivalentes",
  "Farol dinheiro", "Score marca", "Farol marca", "Veredicto",
  "Pediu sessão", "Vídeo assistido (%)", "Números ajustados", "Origem (?o=)", "UTMs", "Dispositivo",
] as const;

export type Coluna = (typeof COLUNAS)[number];
```

`src/data/origem.ts`:
```ts
export interface Origem { origem: string; utms: string; dispositivo: "celular" | "desktop" }

const UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];

export function lerOrigem(search: string, ehCelular: boolean): Origem {
  const q = new URLSearchParams(search);
  const utms = UTM.filter((k) => q.get(k)).map((k) => `${k}=${q.get(k)!.slice(0, 80)}`).join("; ");
  return { origem: (q.get("o") ?? "").slice(0, 40), utms, dispositivo: ehCelular ? "celular" : "desktop" };
}

export function origemDoNavegador(): Origem {
  const celular = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768;
  return lerOrigem(window.location.search, celular);
}
```

`src/data/contato.ts`:
```ts
import type { Contato } from "@/flow/quiz";

type Campo = keyof Contato;
export type Validacao = { ok: true; contato: Contato } | { ok: false; campo: Campo; mensagem: string };

const corta = (v: string, max: number) => String(v || "").trim().slice(0, max);

export function validarContato(c: Contato): Validacao {
  const nome = corta(c.nome, 120);
  const email = corta(c.email, 254).toLowerCase();
  const empresa = corta(c.empresa, 120);
  const cargo = corta(c.cargo, 120);
  const whatsapp = String(c.whatsapp || "").replace(/\D/g, "").slice(0, 15);

  if (!nome) return { ok: false, campo: "nome", mensagem: "Informe seu nome." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, campo: "email", mensagem: "Informe um e-mail corporativo válido." };
  if (!empresa) return { ok: false, campo: "empresa", mensagem: "Informe a empresa." };
  if (!cargo) return { ok: false, campo: "cargo", mensagem: "Informe seu cargo." };
  if (whatsapp && (whatsapp.length < 10 || whatsapp.length > 13)) return { ok: false, campo: "whatsapp", mensagem: "Confira o WhatsApp (DDD + número)." };
  return { ok: true, contato: { nome, email, empresa, cargo, whatsapp } };
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run test/dados.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data test/dados.test.ts
git commit -m "feat: colunas da planilha, origem da campanha e validação do contato

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 10: Montagem das linhas e envio com nova tentativa

**Files:**
- Create: `src/data/lead.ts`, `test/lead.test.ts`

- [ ] **Step 1: Teste**

`test/lead.test.ts`:
```ts
import { describe, expect, it, vi } from "vitest";
import { calcular } from "@/domain/calc";
import { entradasDe, type Respostas } from "@/domain/entradas";
import { verdict } from "@/domain/readings";
import { COLUNAS } from "@/data/colunas";
import { enviar, lerPendentes, linhaAtualizacao, linhaDesbloqueio, reenviarPendentes, type Deps } from "@/data/lead";

function memoria() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
}
const resp = (status: number) => (async () => new Response("{}", { status })) as unknown as typeof fetch;

const respostas = { quem: 2, pecas: 2, custo: 2, horas: 2, mont: 2, dias: 2, mult: 2, maos: 2, trava: 2, furo: 2, ia: 2 } as Respostas;
const r = calcular(entradasDe(respostas));
const contato = { nome: "Ana", email: "ana@empresa.com.br", empresa: "Empresa", cargo: "Diretora", whatsapp: "5511987654321" };
const origem = { origem: "cmp", utms: "", dispositivo: "desktop" as const };

describe("linhas", () => {
  it("desbloqueio preenche só colunas conhecidas, com números calculados", () => {
    const l = linhaDesbloqueio({ id: "abc", agora: new Date("2026-10-23T12:00:00Z"), contato, setor: "Varejo", fat: "Até R$ 100 milhões", respostas, resultado: r, veredicto: verdict(r), origem });
    Object.keys(l).forEach((k) => expect(COLUNAS).toContain(k));
    expect(l["ID"]).toBe("abc");
    expect(l["Peças/mês"]).toBe("De 51 a 150");
    expect(l["Teto"]).toBe(161200);
    expect(l["Custo/peça"]).toBe(652.63);
    expect(l["Veredicto"]).toBe("Caso fechado");
    expect(l["Farol marca"]).toBe("Exposição alta");
    expect(l["Pediu sessão"]).toBe("Não");
  });
  it("atualização leva só ID e o que mudou", () => {
    expect(linhaAtualizacao("abc", { pediuSessao: true, videoPct: 50 })).toEqual({ ID: "abc", "Pediu sessão": "Sim", "Vídeo assistido (%)": 50 });
  });
});

describe("envio", () => {
  const base = (fetch: typeof fetch): Deps => ({ fetch, storage: memoria(), url: "https://exemplo/webhook", timeoutMs: 500 });

  it("sucesso na primeira", async () => {
    const f = vi.fn(resp(200));
    const d = base(f as unknown as typeof fetch);
    expect(await enviar({ evento: "desbloqueio", linha: { ID: "1" } }, d)).toBe(true);
    expect(f).toHaveBeenCalledTimes(1);
  });
  it("falha duas vezes → guarda na fila local", async () => {
    const f = vi.fn(resp(500));
    const d = base(f as unknown as typeof fetch);
    expect(await enviar({ evento: "desbloqueio", linha: { ID: "1" } }, d)).toBe(false);
    expect(f).toHaveBeenCalledTimes(2);
    expect(lerPendentes(d.storage)).toHaveLength(1);
  });
  it("reenvia pendentes e limpa a fila", async () => {
    const d = base(resp(500));
    await enviar({ evento: "desbloqueio", linha: { ID: "1" } }, d);
    await reenviarPendentes({ ...d, fetch: resp(200) });
    expect(lerPendentes(d.storage)).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run test/lead.test.ts`
Expected: FAIL — módulo não existe.

- [ ] **Step 3: Implementar**

`src/data/lead.ts`:
```ts
import type { Resultado } from "@/domain/calc";
import type { Ajustes, Respostas } from "@/domain/entradas";
import type { Veredicto } from "@/domain/readings";
import { PERGUNTA_POR_ID, type StepId } from "@/domain/steps";
import type { Contato } from "@/flow/quiz";
import type { Coluna } from "./colunas";
import type { Origem } from "./origem";

export const WEBHOOK_URL = import.meta.env.VITE_WEBHOOK_URL ?? "https://n8n.i9criacoes.com.br/webhook/vc-sabia-maestro";

export type Linha = Partial<Record<Coluna, string | number>>;
export interface Envio { evento: "desbloqueio" | "atualizacao"; linha: Linha }
export interface Deps { fetch: typeof fetch; storage: Pick<Storage, "getItem" | "setItem">; url: string; timeoutMs?: number }

const CHAVE = "vcsabia:pendentes";
const dois = (n: number) => Math.round(n * 100) / 100;

export function linhaDesbloqueio(a: {
  id: string; agora: Date; contato: Contato; setor: string; fat: string; respostas: Respostas;
  resultado: Resultado; veredicto: Veredicto; origem: Origem;
}): Linha {
  const rot = (id: StepId) => PERGUNTA_POR_ID[id].opcoes[a.respostas[id]!].rotulo;
  const r = a.resultado;
  return {
    "Data/hora": a.agora.toISOString(),
    ID: a.id,
    Nome: a.contato.nome,
    "E-mail": a.contato.email,
    Empresa: a.contato.empresa,
    Cargo: a.contato.cargo,
    WhatsApp: a.contato.whatsapp,
    Setor: a.setor,
    Faturamento: a.fat,
    "Quem produz": rot("quem"),
    "Peças/mês": rot("pecas"),
    "Custo da estrutura": rot("custo"),
    "Horas/peça": rot("horas"),
    "% montagem": rot("mont"),
    "Dias de fila": rot("dias"),
    "Peças sem fila": rot("mult"),
    "Mãos que publicam": rot("maos"),
    "O que trava": rot("trava"),
    "Já escapou": rot("furo"),
    "Posição sobre IA": rot("ia"),
    "Custo/peça": dois(r.custoPeca),
    "Custo/hora": dois(r.custoHora),
    "Horas de montagem/mês": dois(r.horasMont),
    Piso: dois(r.piso),
    Teto: dois(r.teto),
    "Recursos equivalentes": dois(r.recursos),
    "Farol dinheiro": r.f.t,
    "Score marca": r.marca,
    "Farol marca": r.m.t,
    Veredicto: a.veredicto.lamp,
    "Pediu sessão": "Não",
    "Vídeo assistido (%)": 0,
    "Números ajustados": "",
    "Origem (?o=)": a.origem.origem,
    UTMs: a.origem.utms,
    Dispositivo: a.origem.dispositivo,
  };
}

export function linhaAtualizacao(id: string, m: { pediuSessao?: boolean; videoPct?: number; ajustes?: Ajustes }): Linha {
  const l: Linha = { ID: id };
  if (m.pediuSessao) l["Pediu sessão"] = "Sim";
  if (m.videoPct !== undefined) l["Vídeo assistido (%)"] = m.videoPct;
  if (m.ajustes && Object.keys(m.ajustes).length) l["Números ajustados"] = JSON.stringify(m.ajustes);
  return l;
}

async function post(envio: Envio, d: Deps): Promise<boolean> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), d.timeoutMs ?? 10000);
  try {
    const res = await d.fetch(d.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(envio),
      signal: ctrl.signal,
    });
    return res.ok;
  } finally {
    clearTimeout(t);
  }
}

export function lerPendentes(s: Deps["storage"]): Envio[] {
  try {
    const v = JSON.parse(s.getItem(CHAVE) ?? "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function guardar(envio: Envio, s: Deps["storage"]) {
  s.setItem(CHAVE, JSON.stringify([...lerPendentes(s), envio].slice(-20)));
}

/** Tenta 2 vezes. Se não der, guarda para a próxima visita. Nunca lança erro. */
export async function enviar(envio: Envio, d: Deps): Promise<boolean> {
  for (let tentativa = 0; tentativa < 2; tentativa++) {
    try {
      if (await post(envio, d)) return true;
    } catch {
      /* tenta de novo */
    }
  }
  guardar(envio, d.storage);
  return false;
}

export async function reenviarPendentes(d: Deps): Promise<void> {
  const lista = lerPendentes(d.storage);
  d.storage.setItem(CHAVE, "[]");
  for (const e of lista) {
    const ok = await post(e, d).catch(() => false);
    if (!ok) guardar(e, d.storage);
  }
}

export function depsDoNavegador(): Deps {
  return { fetch: window.fetch.bind(window), storage: window.localStorage, url: WEBHOOK_URL };
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run test/lead.test.ts`
Expected: PASS (5 testes).

- [ ] **Step 5: Commit**

```bash
git add src/data/lead.ts test/lead.test.ts
git commit -m "feat: linhas da planilha e envio com nova tentativa e fila local

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 11: Workflows n8n (código versionado + teste de consistência)

**Files:**
- Create: `n8n/vc-sabia-maestro.workflow.js`, `n8n/manutencao.workflow.js`, `test/n8n.test.ts`

- [ ] **Step 1: Teste — a lista de colunas do n8n é a mesma do front**

`test/n8n.test.ts`:
```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { COLUNAS } from "@/data/colunas";

const ler = (arq: string) => readFileSync(new URL(`../n8n/${arq}`, import.meta.url), "utf8");

describe("n8n", () => {
  it.each(["vc-sabia-maestro.workflow.js", "manutencao.workflow.js"])("%s usa as mesmas 36 colunas", (arq) => {
    const m = ler(arq).match(/const COLS = (\[.*?\]);/s);
    expect(m).not.toBeNull();
    expect(JSON.parse(m![1])).toEqual([...COLUNAS]);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run test/n8n.test.ts`
Expected: FAIL — arquivos não existem.

- [ ] **Step 3: Workflow principal**

`n8n/vc-sabia-maestro.workflow.js`:
```js
import { workflow, node, trigger, switchCase, expr } from '@n8n/workflow-sdk';

const COLS = ["Data/hora","ID","Nome","E-mail","Empresa","Cargo","WhatsApp","Setor","Faturamento","Quem produz","Peças/mês","Custo da estrutura","Horas/peça","% montagem","Dias de fila","Peças sem fila","Mãos que publicam","O que trava","Já escapou","Posição sobre IA","Custo/peça","Custo/hora","Horas de montagem/mês","Piso","Teto","Recursos equivalentes","Farol dinheiro","Score marca","Farol marca","Veredicto","Pediu sessão","Vídeo assistido (%)","Números ajustados","Origem (?o=)","UTMs","Dispositivo"];

const PLANILHA = '1ecWjh-Sgsyu_QgSCv8Sx5bneQDZfav1HEwxgPAN-pZU';
const CREDENCIAL = { googleSheetsOAuth2Api: { id: '4u8zWBJAiq5wt7eA', name: 'Google Sheets account' } };

const entrada = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Entrada (POST)',
    parameters: {
      httpMethod: 'POST',
      path: 'vc-sabia-maestro',
      responseMode: 'responseNode',
      options: { allowedOrigins: 'https://questionario.aodigital.net.br,http://localhost:8080,http://localhost:4173' },
    },
  },
});

const validar = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Validar e limpar',
    parameters: {
      jsCode: `const COLS = ${JSON.stringify(COLS)};
const b = $input.first().json.body || {};
if (b.site) return [{ json: { _acao: 'ignorar' } }];
const linha = b.linha && typeof b.linha === 'object' ? b.linha : null;
if (!linha || !linha['ID'] || !['desbloqueio', 'atualizacao'].includes(b.evento)) return [{ json: { _acao: 'rejeitar' } }];
const out = {};
for (const [k, v] of Object.entries(linha)) {
  if (!COLS.includes(k)) continue;
  out[k] = typeof v === 'number' && isFinite(v) ? v : String(v ?? '').trim().slice(0, 500);
}
if (b.evento === 'desbloqueio') {
  if (!out['Nome'] || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(String(out['E-mail'] || ''))) return [{ json: { _acao: 'rejeitar' } }];
}
if (out['WhatsApp']) out['WhatsApp'] = String(out['WhatsApp']).replace(/\\D/g, '');
return [{ json: { _acao: 'gravar', ...out } }];`,
    },
  },
});

const regra = (valor) => ({
  outputKey: valor,
  conditions: {
    options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
    conditions: [{ leftValue: expr('{{ $json._acao }}'), operator: { type: 'string', operation: 'equals' }, rightValue: valor }],
    combinator: 'and',
  },
});

const rota = switchCase({
  version: 3.2,
  config: { name: 'Rota', parameters: { rules: { values: [regra('gravar'), regra('ignorar'), regra('rejeitar')] } } },
});

const linhaFinal = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Linha final',
    parameters: { jsCode: "return $input.all().map((i) => { const { _acao, ...resto } = i.json; return { json: resto }; });" },
  },
});

const gravar = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'Gravar na planilha',
    parameters: {
      operation: 'appendOrUpdate',
      documentId: { __rl: true, mode: 'id', value: PLANILHA },
      sheetName: { __rl: true, mode: 'name', value: 'Página1' },
      columns: { mappingMode: 'autoMapInputData', value: {}, matchingColumns: ['ID'], schema: [] },
      options: { cellFormat: 'RAW' },
    },
    credentials: CREDENCIAL,
  },
});

const responderOk = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: { name: 'Responder ok', parameters: { respondWith: 'json', responseBody: expr('{{ { "ok": true } }}') } },
});

const responderIgnorado = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: { name: 'Responder ok (ignorado)', parameters: { respondWith: 'json', responseBody: expr('{{ { "ok": true } }}') } },
});

const responderErro = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    name: 'Responder 400',
    parameters: { respondWith: 'json', responseBody: expr('{{ { "ok": false } }}'), options: { responseCode: 400 } },
  },
});

export default workflow('vc-sabia-maestro', 'VC SABIA MAESTRO · Questionário')
  .add(entrada)
  .to(validar)
  .to(rota
    .onCase(0, linhaFinal.to(gravar.to(responderOk)))
    .onCase(1, responderIgnorado)
    .onCase(2, responderErro));
```

- [ ] **Step 4: Workflow de manutenção (cabeçalho + limpeza de testes)**

`n8n/manutencao.workflow.js`:
```js
import { workflow, node, trigger, expr } from '@n8n/workflow-sdk';

const COLS = ["Data/hora","ID","Nome","E-mail","Empresa","Cargo","WhatsApp","Setor","Faturamento","Quem produz","Peças/mês","Custo da estrutura","Horas/peça","% montagem","Dias de fila","Peças sem fila","Mãos que publicam","O que trava","Já escapou","Posição sobre IA","Custo/peça","Custo/hora","Horas de montagem/mês","Piso","Teto","Recursos equivalentes","Farol dinheiro","Score marca","Farol marca","Veredicto","Pediu sessão","Vídeo assistido (%)","Números ajustados","Origem (?o=)","UTMs","Dispositivo"];

const PLANILHA = '1ecWjh-Sgsyu_QgSCv8Sx5bneQDZfav1HEwxgPAN-pZU';
const CREDENCIAL = { googleSheetsOAuth2Api: { id: '4u8zWBJAiq5wt7eA', name: 'Google Sheets account' } };

const inicio = trigger({ type: 'n8n-nodes-base.manualTrigger', version: 1, config: { name: 'Rodar manutenção' } });

const cabecalho = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Escrever cabeçalho',
    parameters: {
      method: 'PUT',
      url: `https://sheets.googleapis.com/v4/spreadsheets/${PLANILHA}/values/P%C3%A1gina1!A1:AJ1?valueInputOption=RAW`,
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'googleSheetsOAuth2Api',
      sendBody: true,
      specifyBody: 'json',
      jsonBody: JSON.stringify({ values: [COLS] }),
    },
    credentials: CREDENCIAL,
  },
});

const lerTestes = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'Achar linhas de teste',
    parameters: {
      operation: 'read',
      documentId: { __rl: true, mode: 'id', value: PLANILHA },
      sheetName: { __rl: true, mode: 'name', value: 'Página1' },
      filtersUI: { values: [{ lookupColumn: 'Nome', lookupValue: 'TESTE E2E' }] },
    },
    credentials: CREDENCIAL,
  },
});

const ordenar = node({
  type: 'n8n-nodes-base.sort',
  version: 1,
  config: { name: 'De baixo para cima', parameters: { sortFieldsUi: { sortField: [{ fieldName: 'row_number', order: 'descending' }] } } },
});

const apagar = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'Apagar linha de teste',
    parameters: {
      operation: 'delete',
      documentId: { __rl: true, mode: 'id', value: PLANILHA },
      sheetName: { __rl: true, mode: 'name', value: 'Página1' },
      toDelete: 'rows',
      startIndex: expr('{{ $json.row_number }}'),
      numberToDelete: 1,
    },
    credentials: CREDENCIAL,
  },
});

export default workflow('vc-sabia-manutencao', 'VC SABIA MAESTRO · Manutenção')
  .add(inicio)
  .to(cabecalho)
  .to(lerTestes)
  .to(ordenar)
  .to(apagar);
```

- [ ] **Step 5: Rodar o teste de consistência**

Run: `npx vitest run test/n8n.test.ts`
Expected: PASS (2 testes).

- [ ] **Step 6: Commit**

```bash
git add n8n test/n8n.test.ts
git commit -m "feat: workflows n8n versionados (questionário + manutenção)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 12: Publicar os workflows no n8n e criar o cabeçalho

Executada pelo agente com as ferramentas MCP do n8n (`mcp__b8e91c94-...`). Projeto `mNfXhvJ2a91abRMK`, pasta **ALWAYS ON** `QAVshEITcMmCk0VH`.

- [ ] **Step 1: Validar os dois códigos**

Chamar `validate_workflow` com o conteúdo de cada arquivo (sem a linha `const COLS` alterada).
Expected: sem erros. Se reclamar do formato de `credentials`, chamar `get_sdk_reference` com `section: "rules"`, ajustar o arquivo, rodar `npx vitest run test/n8n.test.ts` de novo e repetir.

- [ ] **Step 2: Criar os workflows na pasta ALWAYS ON**

`create_workflow_from_code` com:
- `code`: conteúdo de `n8n/vc-sabia-maestro.workflow.js`, `projectId: "mNfXhvJ2a91abRMK"`, `folderId: "QAVshEITcMmCk0VH"`, `description: "Recebe as respostas do questionário Você Sabia? Maestro (questionario.aodigital.net.br) e grava na planilha RESPOSTAS VC SABIA MAESTRO."`
- `code`: conteúdo de `n8n/manutencao.workflow.js`, mesmo projeto e pasta, `description: "Escreve o cabeçalho da planilha VC SABIA MAESTRO e apaga linhas com Nome = TESTE E2E."`

Anotar os dois IDs retornados no fim deste arquivo (seção "IDs").

- [ ] **Step 3: Rodar a manutenção uma vez (cria o cabeçalho)**

`execute_workflow` com o ID da manutenção.
Expected: execução `success`. Conferir com `get_file_metadata` (Drive) no ID da planilha: o `contentSnippet` começa com `Data/hora,ID,Nome,E-mail`.

- [ ] **Step 4: Publicar o workflow principal**

`publish_workflow` com o ID do principal. Expected: `active: true`.

- [ ] **Step 5: Teste de fumaça do webhook**

```bash
curl -s -X POST "https://n8n.i9criacoes.com.br/webhook/vc-sabia-maestro" -H "Content-Type: application/json" -H "Origin: http://localhost:4173" \
  -d '{"evento":"desbloqueio","linha":{"ID":"fumaca-1","Nome":"TESTE E2E","E-mail":"teste-e2e@aodigital.com.br","Empresa":"Teste","Cargo":"QA","WhatsApp":"+55 (11) 90000-0000"}}' -w "\nHTTP %{http_code}\n"
curl -s -X POST "https://n8n.i9criacoes.com.br/webhook/vc-sabia-maestro" -H "Content-Type: application/json" \
  -d '{"evento":"atualizacao","linha":{"ID":"fumaca-1","Pediu sessão":"Sim"}}' -w "\nHTTP %{http_code}\n"
curl -s -X POST "https://n8n.i9criacoes.com.br/webhook/vc-sabia-maestro" -H "Content-Type: application/json" \
  -d '{"evento":"desbloqueio","linha":{"ID":"x","Nome":"","E-mail":"ruim"}}' -w "\nHTTP %{http_code}\n"
```
Expected: `{"ok":true}` HTTP 200, `{"ok":true}` HTTP 200, `{"ok":false}` HTTP 400.

Conferir na planilha (`read_file_content`): uma linha `fumaca-1` com Nome `TESTE E2E`, WhatsApp `5511900000000` e Pediu sessão `Sim` (a atualização não pode ter apagado o Nome). Se o Nome sumiu, o `appendOrUpdate` está sobrescrevendo colunas ausentes: trocar o nó para `mappingMode: 'defineBelow'` só não resolve; a correção é o front mandar na atualização também as colunas que já tinha (adaptar `linhaAtualizacao` para receber a linha de desbloqueio e mesclar) — anotar e corrigir antes de seguir.

- [ ] **Step 6: Limpar a linha de fumaça**

`execute_workflow` da manutenção. Expected: a linha `TESTE E2E` some; o cabeçalho continua.

- [ ] **Step 7: Commit (só se algum arquivo do `n8n/` mudou)**

```bash
git add n8n docs/superpowers/plans
git commit -m "chore: workflows publicados no n8n (pasta ALWAYS ON)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Fase 5 · Som

### Task 13: Motor de som (trilha em camadas + efeitos)

**Files:**
- Create: `src/audio/musica.ts`, `src/audio/som.ts`, `test/musica.test.ts`

- [ ] **Step 1: Teste da parte pura**

`test/musica.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { ACORDES, VOLUME_CAMADA, acordeDoPasso, midiParaHz } from "@/audio/musica";

describe("música", () => {
  it("midi → Hz", () => {
    expect(midiParaHz(69)).toBe(440);
    expect(midiParaHz(81)).toBeCloseTo(880);
  });
  it("4 acordes, troca a cada 32 passos de semicolcheia", () => {
    expect(ACORDES).toHaveLength(4);
    expect(acordeDoPasso(0)).toBe(ACORDES[0]);
    expect(acordeDoPasso(31)).toBe(ACORDES[0]);
    expect(acordeDoPasso(32)).toBe(ACORDES[1]);
    expect(acordeDoPasso(128)).toBe(ACORDES[0]);
  });
  it("4 camadas com volume baixo", () => {
    expect(VOLUME_CAMADA).toHaveLength(4);
    VOLUME_CAMADA.forEach((v) => expect(v).toBeLessThanOrEqual(0.5));
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run test/musica.test.ts`
Expected: FAIL — módulo não existe.

- [ ] **Step 3: Implementar `musica.ts`**

`src/audio/musica.ts`:
```ts
export const BPM = 96;
export const SEMICOLCHEIA = 60 / BPM / 4; // segundos

/** Am9 → Fmaj7 → Cmaj7 → G6, em números MIDI (oitava do pad). */
export const ACORDES: number[][] = [
  [57, 60, 64, 67, 71],
  [53, 57, 60, 64],
  [48, 52, 55, 59],
  [55, 59, 62, 64],
];

/** Volume de cada camada: 0 pad · 1 baixo · 2 arpejo · 3 brilho. */
export const VOLUME_CAMADA = [0.35, 0.3, 0.16, 0.08];

export const ARPEJO = [0, 2, 1, 3, 2, 4, 3, 1];

export function midiParaHz(m: number): number {
  return 440 * 2 ** ((m - 69) / 12);
}

export function acordeDoPasso(passo: number): number[] {
  return ACORDES[Math.floor(passo / 32) % ACORDES.length];
}
```

- [ ] **Step 4: Implementar `som.ts`**

`src/audio/som.ts`:
```ts
import { ARPEJO, SEMICOLCHEIA, VOLUME_CAMADA, acordeDoPasso, midiParaHz } from "./musica";

export type Efeito = "clique" | "selecao" | "fase" | "vocesabia" | "revelar" | "erro";

const CHAVE_MUDO = "vcsabia:mudo";
const VOLUME_MESTRE = 0.5;

class MotorDeSom {
  private ctx: AudioContext | null = null;
  private mestre: GainNode | null = null;
  private efeitos: GainNode | null = null;
  private camadas: GainNode[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private proxima = 0;
  private passo = 0;
  private nivel = 0;
  private ouvintes = new Set<() => void>();
  mudo = typeof localStorage !== "undefined" && localStorage.getItem(CHAVE_MUDO) === "1";

  /** Chamar dentro de um clique (exigência dos navegadores para tocar som). */
  iniciar() {
    if (this.ctx) {
      void this.ctx.resume();
      return;
    }
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    this.ctx = ctx;
    this.mestre = ctx.createGain();
    this.mestre.gain.value = this.mudo ? 0 : VOLUME_MESTRE;
    this.mestre.connect(ctx.destination);
    this.efeitos = ctx.createGain();
    this.efeitos.gain.value = 0.6;
    this.efeitos.connect(this.mestre);

    const filtroPad = ctx.createBiquadFilter();
    filtroPad.type = "lowpass";
    filtroPad.frequency.value = 900;
    filtroPad.connect(this.mestre);
    const eco = ctx.createDelay();
    eco.delayTime.value = SEMICOLCHEIA * 3;
    const retorno = ctx.createGain();
    retorno.gain.value = 0.3;
    eco.connect(retorno).connect(eco);
    eco.connect(this.mestre);

    this.camadas = VOLUME_CAMADA.map((_, i) => {
      const g = ctx.createGain();
      g.gain.value = 0;
      if (i === 0) g.connect(filtroPad);
      else if (i === 2) {
        g.connect(this.mestre!);
        g.connect(eco);
      } else g.connect(this.mestre!);
      return g;
    });

    this.proxima = ctx.currentTime + 0.1;
    this.timer = setInterval(() => this.agendar(), 25);
    document.addEventListener("visibilitychange", () => {
      if (!this.ctx) return;
      if (document.hidden) void this.ctx.suspend();
      else void this.ctx.resume();
    });
    this.definirNivel(this.nivel);
  }

  private nota(destino: AudioNode, freq: number, inicio: number, dur: number, tipo: OscillatorType, pico: number, ataque = 0.01) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = tipo;
    osc.frequency.value = freq;
    env.gain.setValueAtTime(0.0001, inicio);
    env.gain.exponentialRampToValueAtTime(pico, inicio + ataque);
    env.gain.exponentialRampToValueAtTime(0.0001, inicio + dur);
    osc.connect(env).connect(destino);
    osc.start(inicio);
    osc.stop(inicio + dur + 0.05);
  }

  private agendar() {
    const ctx = this.ctx!;
    while (this.proxima < ctx.currentTime + 0.12) {
      const t = this.proxima;
      const acorde = acordeDoPasso(this.passo);
      if (this.passo % 32 === 0) acorde.forEach((m) => this.nota(this.camadas[0], midiParaHz(m), t, SEMICOLCHEIA * 32, "triangle", 0.12, 1.5));
      if (this.passo % 4 === 0) this.nota(this.camadas[1], midiParaHz(acorde[0] - 12), t, SEMICOLCHEIA * 3, "sine", 0.5);
      const m = acorde[ARPEJO[this.passo % ARPEJO.length] % acorde.length] + 12;
      this.nota(this.camadas[2], midiParaHz(m), t, SEMICOLCHEIA * 1.6, "sine", 0.35);
      if (this.passo % 8 === 4) this.nota(this.camadas[3], midiParaHz(acorde[(this.passo / 8) % acorde.length | 0] + 24), t, SEMICOLCHEIA * 6, "sine", 0.3, 0.05);
      this.proxima += SEMICOLCHEIA;
      this.passo++;
    }
  }

  /** 0 = silêncio, 1..4 = quantas camadas tocam. */
  definirNivel(n: number) {
    this.nivel = n;
    if (!this.ctx) return;
    const agora = this.ctx.currentTime;
    this.camadas.forEach((g, i) => g.gain.setTargetAtTime(i < n ? VOLUME_CAMADA[i] : 0, agora, 0.8));
  }

  tocar(e: Efeito) {
    if (!this.ctx || !this.efeitos || this.mudo) return;
    const t = this.ctx.currentTime;
    const d = this.efeitos;
    switch (e) {
      case "clique": this.nota(d, 1400, t, 0.04, "square", 0.08); break;
      case "selecao": this.nota(d, 660, t, 0.08, "triangle", 0.3); this.nota(d, 990, t + 0.07, 0.12, "triangle", 0.3); break;
      case "fase": {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = "sine";
        o.frequency.setValueAtTime(300, t);
        o.frequency.exponentialRampToValueAtTime(900, t + 0.35);
        g.gain.setValueAtTime(0.25, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
        o.connect(g).connect(d);
        o.start(t);
        o.stop(t + 0.45);
        this.nota(d, 1320, t + 0.3, 0.5, "sine", 0.2);
        break;
      }
      case "vocesabia": this.nota(d, 1046.5, t, 1.2, "sine", 0.3); this.nota(d, 1568, t, 0.9, "sine", 0.12); break;
      case "revelar": {
        const o = this.ctx.createOscillator();
        const f = this.ctx.createBiquadFilter();
        const g = this.ctx.createGain();
        o.type = "sawtooth";
        o.frequency.setValueAtTime(120, t);
        o.frequency.exponentialRampToValueAtTime(1200, t + 0.8);
        f.type = "lowpass";
        f.frequency.setValueAtTime(400, t);
        f.frequency.exponentialRampToValueAtTime(4000, t + 0.8);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.15, t + 0.6);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
        o.connect(f).connect(g).connect(d);
        o.start(t);
        o.stop(t + 0.95);
        this.nota(d, 80, t + 0.8, 0.45, "sine", 0.6);
        break;
      }
      case "erro": this.nota(d, 180, t, 0.14, "square", 0.12); break;
    }
  }

  alternarMudo() {
    this.mudo = !this.mudo;
    localStorage.setItem(CHAVE_MUDO, this.mudo ? "1" : "0");
    if (this.mestre && this.ctx) this.mestre.gain.setTargetAtTime(this.mudo ? 0 : VOLUME_MESTRE, this.ctx.currentTime, 0.1);
    this.ouvintes.forEach((f) => f());
  }

  assinar(f: () => void) {
    this.ouvintes.add(f);
    return () => this.ouvintes.delete(f);
  }
}

export const som = new MotorDeSom();
```

- [ ] **Step 5: Rodar o teste e o build**

Run: `npx vitest run test/musica.test.ts && npx tsc --noEmit`
Expected: PASS e nenhum erro de tipo.

- [ ] **Step 6: Commit**

```bash
git add src/audio test/musica.test.ts
git commit -m "feat: trilha em camadas e efeitos sonoros por Web Audio

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Fase 6 · Componentes visuais

### Task 14: Componentes do 21st.dev e portes

**Files:**
- Create: `src/components/ui/interactive-hover-button.tsx`, `src/components/ui/spotlight-card.tsx`, `src/components/ui/dot-loader.tsx`, `src/components/ui/fluxo-convergente.tsx`, `src/components/ui/palavra-girando.tsx`

- [ ] **Step 1: Botão (21st, sem alteração)**

`src/components/ui/interactive-hover-button.tsx`:
```tsx
import React from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface InteractiveHoverButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string;
}

const InteractiveHoverButton = React.forwardRef<HTMLButtonElement, InteractiveHoverButtonProps>(
  ({ text = "Button", className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "group relative w-32 cursor-pointer overflow-hidden rounded-full border bg-background p-2 text-center font-semibold",
          className,
        )}
        {...props}
      >
        <span className="inline-block translate-x-1 transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-0">
          {text}
        </span>
        <div className="absolute top-0 z-10 flex h-full w-full translate-x-12 items-center justify-center gap-2 text-primary-foreground opacity-0 transition-all duration-300 group-hover:-translate-x-1 group-hover:opacity-100">
          <span>{text}</span>
          <ArrowRight />
        </div>
        <div className="absolute left-[20%] top-[40%] h-2 w-2 scale-[1] rounded-lg bg-primary transition-all duration-300 group-hover:left-[0%] group-hover:top-[0%] group-hover:h-full group-hover:w-full group-hover:scale-[1.8] group-hover:bg-primary"></div>
      </button>
    );
  },
);

InteractiveHoverButton.displayName = "InteractiveHoverButton";

export { InteractiveHoverButton };
```

- [ ] **Step 2: Glow card (21st, com 2 ajustes: tipagem do estilo e `cn()` para permitir sobrescrever classes)**

`src/components/ui/spotlight-card.tsx`:
```tsx
import React, { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: "blue" | "purple" | "green" | "red" | "orange";
  size?: "sm" | "md" | "lg";
  width?: string | number;
  height?: string | number;
  customSize?: boolean;
}

const glowColorMap = {
  blue: { base: 220, spread: 200 },
  purple: { base: 280, spread: 300 },
  green: { base: 120, spread: 200 },
  red: { base: 0, spread: 200 },
  orange: { base: 30, spread: 200 },
};

const sizeMap = { sm: "w-48 h-64", md: "w-64 h-80", lg: "w-80 h-96" };

const GlowCard: React.FC<GlowCardProps> = ({ children, className = "", glowColor = "blue", size = "md", width, height, customSize = false }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const syncPointer = (e: PointerEvent) => {
      const { clientX: x, clientY: y } = e;
      if (cardRef.current) {
        cardRef.current.style.setProperty("--x", x.toFixed(2));
        cardRef.current.style.setProperty("--xp", (x / window.innerWidth).toFixed(2));
        cardRef.current.style.setProperty("--y", y.toFixed(2));
        cardRef.current.style.setProperty("--yp", (y / window.innerHeight).toFixed(2));
      }
    };
    document.addEventListener("pointermove", syncPointer);
    return () => document.removeEventListener("pointermove", syncPointer);
  }, []);

  const { base, spread } = glowColorMap[glowColor];

  const getInlineStyles = (): React.CSSProperties => {
    const baseStyles: Record<string, string | number> = {
      "--base": base,
      "--spread": spread,
      "--radius": "14",
      "--border": "3",
      "--backdrop": "hsl(0 0% 60% / 0.12)",
      "--backup-border": "var(--backdrop)",
      "--size": "200",
      "--outer": "1",
      "--border-size": "calc(var(--border, 2) * 1px)",
      "--spotlight-size": "calc(var(--size, 150) * 1px)",
      "--hue": "calc(var(--base) + (var(--xp, 0) * var(--spread, 0)))",
      backgroundImage: `radial-gradient(
        var(--spotlight-size) var(--spotlight-size) at
        calc(var(--x, 0) * 1px)
        calc(var(--y, 0) * 1px),
        hsl(var(--hue, 210) calc(var(--saturation, 100) * 1%) calc(var(--lightness, 70) * 1%) / var(--bg-spot-opacity, 0.1)), transparent
      )`,
      backgroundColor: "var(--backdrop, transparent)",
      backgroundSize: "calc(100% + (2 * var(--border-size))) calc(100% + (2 * var(--border-size)))",
      backgroundPosition: "50% 50%",
      backgroundAttachment: "fixed",
      border: "var(--border-size) solid var(--backup-border)",
      position: "relative",
      touchAction: "none",
    };
    if (width !== undefined) baseStyles.width = typeof width === "number" ? `${width}px` : width;
    if (height !== undefined) baseStyles.height = typeof height === "number" ? `${height}px` : height;
    return baseStyles as React.CSSProperties;
  };

  const beforeAfterStyles = `
    [data-glow]::before,
    [data-glow]::after {
      pointer-events: none;
      content: "";
      position: absolute;
      inset: calc(var(--border-size) * -1);
      border: var(--border-size) solid transparent;
      border-radius: calc(var(--radius) * 1px);
      background-attachment: fixed;
      background-size: calc(100% + (2 * var(--border-size))) calc(100% + (2 * var(--border-size)));
      background-repeat: no-repeat;
      background-position: 50% 50%;
      mask: linear-gradient(transparent, transparent), linear-gradient(white, white);
      mask-clip: padding-box, border-box;
      mask-composite: intersect;
    }
    [data-glow]::before {
      background-image: radial-gradient(
        calc(var(--spotlight-size) * 0.75) calc(var(--spotlight-size) * 0.75) at
        calc(var(--x, 0) * 1px)
        calc(var(--y, 0) * 1px),
        hsl(var(--hue, 210) calc(var(--saturation, 100) * 1%) calc(var(--lightness, 50) * 1%) / var(--border-spot-opacity, 1)), transparent 100%
      );
      filter: brightness(2);
    }
    [data-glow]::after {
      background-image: radial-gradient(
        calc(var(--spotlight-size) * 0.5) calc(var(--spotlight-size) * 0.5) at
        calc(var(--x, 0) * 1px)
        calc(var(--y, 0) * 1px),
        hsl(0 100% 100% / var(--border-light-opacity, 1)), transparent 100%
      );
    }
    [data-glow] [data-glow] {
      position: absolute;
      inset: 0;
      will-change: filter;
      opacity: var(--outer, 1);
      border-radius: calc(var(--radius) * 1px);
      border-width: calc(var(--border-size) * 20);
      filter: blur(calc(var(--border-size) * 10));
      background: none;
      pointer-events: none;
      border: none;
    }
    [data-glow] > [data-glow]::before {
      inset: -10px;
      border-width: 10px;
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: beforeAfterStyles }} />
      <div
        ref={cardRef}
        data-glow
        style={getInlineStyles()}
        className={cn(
          "relative grid grid-rows-[1fr_auto] gap-4 rounded-2xl p-4 shadow-[0_1rem_2rem_-1rem_black] backdrop-blur-[5px]",
          !customSize && sizeMap[size],
          !customSize && "aspect-[3/4]",
          className,
        )}
      >
        <div ref={innerRef} data-glow></div>
        {children}
      </div>
    </>
  );
};

export { GlowCard };
```

- [ ] **Step 3: Dot loader (21st, com o tipo do intervalo trocado para funcionar sem `@types/node` no navegador)**

`src/components/ui/dot-loader.tsx`:
```tsx
import { type ComponentProps, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type DotLoaderProps = {
  frames: number[][];
  dotClassName?: string;
  isPlaying?: boolean;
  duration?: number;
  repeatCount?: number;
  onComplete?: () => void;
} & ComponentProps<"div">;

export const DotLoader = ({ frames, isPlaying = true, duration = 100, dotClassName, className, repeatCount = -1, onComplete, ...props }: DotLoaderProps) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const currentIndex = useRef(0);
  const repeats = useRef(0);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);

  const applyFrameToDots = useCallback(
    (dots: HTMLDivElement[], frameIndex: number) => {
      const frame = frames[frameIndex];
      if (!frame) return;
      dots.forEach((dot, index) => dot.classList.toggle("active", frame.includes(index)));
    },
    [frames],
  );

  useEffect(() => {
    currentIndex.current = 0;
    repeats.current = 0;
  }, [frames]);

  useEffect(() => {
    if (isPlaying) {
      if (currentIndex.current >= frames.length) currentIndex.current = 0;
      const dotElements = gridRef.current?.children;
      if (!dotElements) return;
      const dots = Array.from(dotElements) as HTMLDivElement[];
      interval.current = setInterval(() => {
        applyFrameToDots(dots, currentIndex.current);
        if (currentIndex.current + 1 >= frames.length) {
          if (repeatCount != -1 && repeats.current + 1 >= repeatCount) {
            clearInterval(interval.current!);
            onComplete?.();
          }
          repeats.current++;
        }
        currentIndex.current = (currentIndex.current + 1) % frames.length;
      }, duration);
    } else if (interval.current) clearInterval(interval.current);
    return () => {
      if (interval.current) clearInterval(interval.current);
    };
  }, [frames, isPlaying, applyFrameToDots, duration, repeatCount, onComplete]);

  return (
    <div {...props} ref={gridRef} className={cn("grid w-fit grid-cols-7 gap-0.5", className)}>
      {Array.from({ length: 49 }).map((_, i) => (
        <div key={i} className={cn("h-1.5 w-1.5 rounded-sm", dotClassName)} />
      ))}
    </div>
  );
};

/** Quadros da demo do 21st ("game"). */
export const QUADROS_JOGO = [
  [14, 7, 0, 8, 6, 13, 20], [14, 7, 13, 20, 16, 27, 21], [14, 20, 27, 21, 34, 24, 28], [27, 21, 34, 28, 41, 32, 35],
  [34, 28, 41, 35, 48, 40, 42], [34, 28, 41, 35, 48, 42, 46], [34, 28, 41, 35, 48, 42, 38], [34, 28, 41, 35, 48, 30, 21],
  [34, 28, 41, 48, 21, 22, 14], [34, 28, 41, 21, 14, 16, 27], [34, 28, 21, 14, 10, 20, 27], [28, 21, 14, 4, 13, 20, 27],
  [28, 21, 14, 12, 6, 13, 20], [28, 21, 14, 6, 13, 20, 11], [28, 21, 14, 6, 13, 20, 10], [14, 6, 13, 20, 9, 7, 21],
];
```

- [ ] **Step 4: Fluxo convergente (porte nativo do canvas do Gateway Flow)**

O componente original do 21st monta um iframe que baixa Tailwind CDN, GSAP e Iconify só para desenhar o canvas. Aqui fica só o canvas, com a mesma geometria (curvas de Bézier das bordas até o centro, partículas e onda de choque no clique), em ciano, com menos linhas no celular e pausa quando a aba sai de foco.

`src/components/ui/fluxo-convergente.tsx`:
```tsx
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type Ponto = { x: number; y: number };
type Caminho = { esquerda: boolean; y0: number; t: number; vel: number };
type Onda = { x: number; y: number; raio: number; vida: number };

function bezier(t: number, p0: Ponto, p1: Ponto, p2: Ponto, p3: Ponto): Ponto {
  const u = 1 - t;
  return {
    x: u ** 3 * p0.x + 3 * u ** 2 * t * p1.x + 3 * u * t ** 2 * p2.x + t ** 3 * p3.x,
    y: u ** 3 * p0.y + 3 * u ** 2 * t * p1.y + 3 * u * t ** 2 * p2.y + t ** 3 * p3.y,
  };
}

export function FluxoConvergente({ className, cor = "0, 212, 255" }: { className?: string; cor?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const total = window.innerWidth < 768 ? 30 : 80;
    let w = 0, h = 0, raf = 0, ativo = true;
    let caminhos: Caminho[] = [];
    const ondas: Onda[] = [];

    const dimensionar = () => {
      const r = canvas.getBoundingClientRect();
      w = r.width;
      h = r.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      caminhos = Array.from({ length: total }, (_, i) => ({
        esquerda: i % 2 === 0, y0: (i / total) * h * 1.4 - h * 0.2, t: Math.random(), vel: 0.0015 + Math.random() * 0.002,
      }));
    };

    const quadro = () => {
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2;
      for (const o of ondas) { o.raio += 15; o.vida -= 0.015; }
      for (let i = ondas.length - 1; i >= 0; i--) if (ondas[i].vida <= 0) ondas.splice(i, 1);
      for (const c of caminhos) {
        const p0 = { x: c.esquerda ? 0 : w, y: c.y0 };
        const p1 = { x: c.esquerda ? cx * 0.5 : w - cx * 0.5, y: c.y0 };
        const p2 = { x: c.esquerda ? cx * 0.8 : w - cx * 0.8, y: cy };
        const p3 = { x: cx, y: cy };
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
        ctx.strokeStyle = `rgba(${cor}, 0.22)`;
        ctx.lineWidth = 1.2;
        ctx.setLineDash([1, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
        if (!reduzir) {
          c.t += c.vel;
          if (c.t > 1) { c.t = 0; c.y0 += (Math.random() - 0.5) * 10; }
        }
        const pos = bezier(c.t, p0, p1, p2, p3);
        let dx = 0, dy = 0;
        for (const o of ondas) {
          const ex = pos.x - o.x, ey = pos.y - o.y, d = Math.hypot(ex, ey) || 1;
          if (d < o.raio + 120 && d > o.raio - 120) {
            const f = (1 - Math.abs(d - o.raio) / 120) * o.vida;
            dx += (ex / d) * f * 80;
            dy += (ey / d) * f * 80;
          }
        }
        ctx.fillStyle = `rgba(${cor}, 0.75)`;
        ctx.fillRect(pos.x + dx - 1.5, pos.y + dy - 1.5, 3, 3);
      }
      if (ativo && !reduzir) raf = requestAnimationFrame(quadro);
    };

    const clique = (ev: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      ondas.push({ x: ev.clientX - r.left, y: ev.clientY - r.top, raio: 0, vida: 1 });
    };
    const visibilidade = () => {
      ativo = !document.hidden;
      cancelAnimationFrame(raf);
      if (ativo) raf = requestAnimationFrame(quadro);
    };

    dimensionar();
    quadro();
    window.addEventListener("resize", dimensionar);
    window.addEventListener("pointerdown", clique);
    document.addEventListener("visibilitychange", visibilidade);
    return () => {
      ativo = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", dimensionar);
      window.removeEventListener("pointerdown", clique);
      document.removeEventListener("visibilitychange", visibilidade);
    };
  }, [cor]);

  return <canvas ref={ref} aria-hidden className={cn("pointer-events-none absolute inset-0 h-full w-full", className)} />;
}
```

- [ ] **Step 5: Palavra girando (mecânica do Animated Hero do 21st)**

`src/components/ui/palavra-girando.tsx`:
```tsx
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export function PalavraGirando({ palavras, intervalo = 2000 }: { palavras: string[]; intervalo?: number }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => setI((atual) => (atual + 1) % palavras.length), intervalo);
    return () => clearTimeout(id);
  }, [i, palavras.length, intervalo]);

  return (
    <span className="relative block h-[1.15em] overflow-hidden">
      &nbsp;
      {palavras.map((p, idx) => (
        <motion.span
          key={p}
          className="absolute left-0 top-0 font-extrabold text-ciano"
          initial={{ opacity: 0, y: "-100%" }}
          transition={{ type: "spring", stiffness: 50 }}
          animate={i === idx ? { y: 0, opacity: 1 } : { y: i > idx ? "-150%" : "150%", opacity: 0 }}
        >
          {p}
        </motion.span>
      ))}
    </span>
  );
}
```

- [ ] **Step 6: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: nenhum erro.

- [ ] **Step 7: Commit**

```bash
git add src/components/ui
git commit -m "feat: componentes do 21st (botão, glow card, dot loader) e portes (fluxo, palavra girando)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 15: Robô (Spline com fallback) e balão de reação

**Files:**
- Create: `src/components/robo/regra3d.ts`, `src/components/robo/interactive-3d-robot.tsx`, `src/components/robo/palco.tsx`, `src/components/robo/balao.tsx`, `src/lib/useEhDesktop.ts`, `public/robo.png`, `test/palco.test.ts`

- [ ] **Step 1: Copiar a imagem do robô e testar a regra de "aparelho aguenta 3D?"**

```bash
cp docs/referencia/robo-original.png public/robo.png
```

`test/palco.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { podeCarregar3D } from "@/components/robo/regra3d";

const bom = { reduzirMovimento: false, economia: false, conexao: "4g", memoria: 8, largura: 1440 };

describe("podeCarregar3D", () => {
  it("desktop bom", () => expect(podeCarregar3D(bom)).toBe(true));
  it("celular bom também pode", () => expect(podeCarregar3D({ ...bom, largura: 390 })).toBe(true));
  it.each([
    [{ reduzirMovimento: true }],
    [{ economia: true }],
    [{ conexao: "3g" }],
    [{ conexao: "slow-2g" }],
    [{ memoria: 2 }],
  ])("recusa %j", (troca) => expect(podeCarregar3D({ ...bom, ...troca })).toBe(false));
  it("sem informação de memória e conexão, aceita", () => {
    expect(podeCarregar3D({ ...bom, conexao: undefined, memoria: undefined })).toBe(true);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run test/palco.test.ts`
Expected: FAIL — módulo não existe.

- [ ] **Step 3: Implementar a regra (arquivo separado, sem JSX, para testar em Node)**

`src/components/robo/regra3d.ts`:
```ts
export interface InfoAparelho {
  reduzirMovimento: boolean;
  economia: boolean;
  conexao?: string;
  memoria?: number;
  largura: number;
}

export function podeCarregar3D(i: InfoAparelho): boolean {
  if (i.reduzirMovimento || i.economia) return false;
  if (i.conexao && /2g|^3g$/.test(i.conexao)) return false;
  if (i.memoria !== undefined && i.memoria < 4) return false;
  return true;
}

export function infoDoNavegador(): InfoAparelho {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean; effectiveType?: string } };
  return {
    reduzirMovimento: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    economia: !!nav.connection?.saveData,
    conexao: nav.connection?.effectiveType,
    memoria: nav.deviceMemory,
    largura: window.innerWidth,
  };
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run test/palco.test.ts`
Expected: PASS.

- [ ] **Step 5: Componentes do robô**

`src/components/robo/interactive-3d-robot.tsx` (copiado do projeto Maestro):
```tsx
import { Suspense, lazy } from "react";
const Spline = lazy(() => import("@splinetool/react-spline"));

export function InteractiveRobotSpline({ scene, className }: { scene: string; className?: string }) {
  return (
    <Suspense fallback={<div className={`h-full w-full ${className ?? ""}`} />}>
      <Spline scene={scene} className={className} />
    </Suspense>
  );
}
```

`src/components/robo/palco.tsx`:
```tsx
import { useEffect, useState } from "react";
import { CENA_ROBO } from "@/domain/constants";
import { cn } from "@/lib/utils";
import { InteractiveRobotSpline } from "./interactive-3d-robot";
import { infoDoNavegador, podeCarregar3D } from "./regra3d";

/** Robô grande: Spline quando o aparelho aguenta, imagem flutuando quando não. */
export function PalcoDoRobo({ className }: { className?: string }) {
  const [tresD, setTresD] = useState(false);
  useEffect(() => setTresD(podeCarregar3D(infoDoNavegador())), []);

  return (
    <div className={cn("relative", className)}>
      {tresD ? (
        <>
          <InteractiveRobotSpline scene={CENA_ROBO} className="absolute inset-0 h-full w-full" />
          {/* cobre a marca d'água "Built with Spline" pintada no canvas */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-ink via-ink/90 to-transparent" />
          <div className="pointer-events-none absolute bottom-1.5 right-1.5 h-12 w-56 rounded-xl bg-ink" />
        </>
      ) : (
        <img src="/robo.png" alt="Robô do Maestro" className="flutuar absolute inset-0 m-auto max-h-full w-auto object-contain" />
      )}
    </div>
  );
}
```

`src/components/robo/balao.tsx`:
```tsx
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Balão da reação do robô. `chave` muda a cada resposta para reanimar.
 * - "canto": celular — robô pequeno fixo no canto + balão.
 * - "coluna": desktop — só o balão, embaixo do robô grande da coluna esquerda.
 */
export function BalaoDoRobo({ texto, chave, variante = "canto" }: { texto: string | null; chave: string; variante?: "canto" | "coluna" }) {
  const balao = (
    <AnimatePresence mode="wait">
      {texto && (
        <motion.p
          key={chave}
          initial={{ opacity: 0, scale: 0.95, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
          className={cn(
            "rounded-2xl border border-ciano/30 bg-navy/95 px-3 py-2 text-sm text-offwhite shadow-lg",
            variante === "canto" ? "max-w-[14rem] rounded-br-sm" : "rounded-tl-sm",
          )}
          role="status"
        >
          {texto}
        </motion.p>
      )}
    </AnimatePresence>
  );
  if (variante === "coluna") return <div className="mt-4 min-h-16">{balao}</div>;
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-30 flex items-end gap-2">
      {balao}
      <img src="/robo.png" alt="" className="flutuar size-14 rounded-full border border-ciano/30 bg-navy object-cover" />
    </div>
  );
}
```

`src/lib/useEhDesktop.ts` (decide por JS, para o Spline não ser montado no celular só porque está escondido por CSS):
```ts
import { useEffect, useState } from "react";

const CONSULTA = "(min-width: 768px)";

export function useEhDesktop(): boolean {
  const [desktop, setDesktop] = useState(() => typeof window !== "undefined" && window.matchMedia(CONSULTA).matches);
  useEffect(() => {
    const mq = window.matchMedia(CONSULTA);
    const muda = () => setDesktop(mq.matches);
    mq.addEventListener("change", muda);
    return () => mq.removeEventListener("change", muda);
  }, []);
  return desktop;
}
```

- [ ] **Step 6: Verificar tipos e commitar**

Run: `npx tsc --noEmit`
Expected: nenhum erro.

```bash
git add src/components/robo src/lib/useEhDesktop.ts public/robo.png test/palco.test.ts
git commit -m "feat: robô Spline com fallback por aparelho e balão de reação

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 16: Barra de circuito, botão de som, moldura e contagem animada

**Files:**
- Create: `src/components/BarraCircuito.tsx`, `src/components/BotaoSom.tsx`, `src/components/Moldura.tsx`, `src/components/Contagem.tsx`
- Modify: `public/` (logos)

- [ ] **Step 1: Logos do Maestro**

```bash
M="$HOME/Claude/CLAUDE CODE/Maestro Always On/public/logos"
cp "$M/maestro-wordmark.svg" "$M/maestro-icon.svg" public/
```

- [ ] **Step 2: Barra de circuito**

`src/components/BarraCircuito.tsx`:
```tsx
import { motion } from "framer-motion";

/** Circuito com um nó por tela de pergunta. `atual` = nó da tela aberta (-1 se nenhuma). */
export function BarraCircuito({ feitos, total, atual, percentual }: { feitos: number; total: number; atual: number; percentual: number }) {
  const x = (i: number) => 2 + (i / (total - 1)) * 96;
  return (
    <div className="mx-auto w-full max-w-5xl px-5">
      <div className="flex items-center justify-between pb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        <span>Sincronização</span>
        <span className="text-ciano">{percentual}%</span>
      </div>
      <div className="relative">
      <motion.img
        src="/robo.png"
        alt=""
        aria-hidden
        initial={false}
        animate={{ left: `${feitos === 0 ? 2 : x(Math.min(feitos, total) - 1)}%` }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        className="absolute top-0 z-10 size-5 -translate-x-1/2 rounded-full border border-ciano/40 bg-navy object-cover"
      />
      <svg viewBox="0 0 100 6" preserveAspectRatio="none" className="h-5 w-full overflow-visible" aria-hidden>
        <line x1="2" y1="3" x2="98" y2="3" stroke="currentColor" className="text-border" strokeWidth="0.4" />
        <motion.line
          x1="2" y1="3" y2="3" stroke="var(--ciano)" strokeWidth="0.6"
          initial={false}
          animate={{ x2: feitos === 0 ? 2 : x(Math.min(feitos, total) - 1) }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        />
        {Array.from({ length: total }).map((_, i) => {
          const feito = i < feitos;
          const ehAtual = i === atual;
          return (
            <g key={i}>
              {ehAtual && (
                <motion.circle
                  cx={x(i)} cy="3" r="1.6" fill="none" stroke="var(--ciano)" strokeWidth="0.3"
                  animate={{ opacity: [0.9, 0.2, 0.9], scale: [1, 1.5, 1] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                  style={{ transformOrigin: `${x(i)}px 3px` }}
                />
              )}
              <circle cx={x(i)} cy="3" r={feito ? 1 : 0.8} fill={feito ? "var(--ciano)" : "var(--navy-light)"} stroke={feito ? "none" : "var(--ciano)"} strokeOpacity="0.4" strokeWidth="0.2" />
            </g>
          );
        })}
      </svg>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Botão de som**

`src/components/BotaoSom.tsx`:
```tsx
import { useSyncExternalStore } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { som } from "@/audio/som";

export function BotaoSom() {
  const mudo = useSyncExternalStore((f) => { const desfaz = som.assinar(f); return () => { desfaz(); }; }, () => som.mudo);
  return (
    <button
      type="button"
      onClick={() => som.alternarMudo()}
      aria-label={mudo ? "Ligar o som" : "Desligar o som"}
      aria-pressed={mudo}
      className="grid size-10 place-items-center rounded-full border border-border bg-navy/70 text-offwhite transition-colors hover:border-ciano/50 hover:text-ciano"
    >
      {mudo ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
    </button>
  );
}
```

- [ ] **Step 4: Moldura (cabeçalho fixo + fundo)**

`src/components/Moldura.tsx`:
```tsx
import type { ReactNode } from "react";
import { BotaoSom } from "./BotaoSom";

export function Moldura({ barra, children }: { barra?: ReactNode; children: ReactNode }) {
  return (
    <div className="relative min-h-dvh overflow-x-hidden pb-[env(safe-area-inset-bottom)]">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(60%_50%_at_80%_0%,oklch(0.55_0.25_295/0.18),transparent),radial-gradient(50%_45%_at_0%_100%,oklch(0.82_0.15_210/0.12),transparent)]" />
      <header className="sticky top-0 z-40 border-b border-border/60 bg-ink/80 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
          <div className="flex items-center gap-2">
            <img src="/maestro-wordmark.svg" alt="Maestro" className="h-5 w-auto" />
            <span className="text-[11px] text-muted-foreground">by always on</span>
          </div>
          <BotaoSom />
        </div>
        {barra && <div className="pb-2">{barra}</div>}
      </header>
      <main>{children}</main>
    </div>
  );
}
```

- [ ] **Step 5: Contagem animada (count up)**

`src/components/Contagem.tsx`:
```tsx
import { useEffect, useState } from "react";

/** Conta de 0 até `valor` com ease-out. Respeita "reduzir movimento". */
export function useContagem(valor: number, duracaoMs = 1600) {
  const [atual, setAtual] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setAtual(valor);
      return;
    }
    let raf = 0;
    const inicio = performance.now();
    const passo = (agora: number) => {
      const t = Math.min(1, (agora - inicio) / duracaoMs);
      setAtual(valor * (1 - (1 - t) ** 3));
      if (t < 1) raf = requestAnimationFrame(passo);
    };
    raf = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf);
  }, [valor, duracaoMs]);
  return atual;
}

export function Contagem({ valor, formatar, className }: { valor: number; formatar: (n: number) => string; className?: string }) {
  const atual = useContagem(valor);
  return <span className={className}>{formatar(atual)}</span>;
}
```

- [ ] **Step 6: Verificar tipos e commitar**

Run: `npx tsc --noEmit`
Expected: nenhum erro.

```bash
git add src/components public/maestro-wordmark.svg public/maestro-icon.svg
git commit -m "feat: barra de circuito, botão de som, moldura e contagem animada

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Fase 7 · Telas

Todas as telas recebem dados e callbacks por props; nenhuma fala com o n8n ou com o som diretamente (isso fica no `App`). Animação de entrada é feita pelo `App`.

### Task 17: Intro, perfil, pergunta e "Você sabia?"

**Files:**
- Create: `src/screens/TelaIntro.tsx`, `src/screens/TelaPerfil.tsx`, `src/screens/TelaPergunta.tsx`, `src/screens/TelaVoceSabia.tsx`, `src/screens/Navegacao.tsx`

- [ ] **Step 1: Navegação compartilhada (Voltar + Continuar)**

`src/screens/Navegacao.tsx`:
```tsx
import { ChevronLeft } from "lucide-react";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";

export function Navegacao({ podeVoltar, podeAvancar, aoVoltar, aoAvancar, textoAvancar = "Continuar" }: {
  podeVoltar: boolean; podeAvancar: boolean; aoVoltar: () => void; aoAvancar: () => void; textoAvancar?: string;
}) {
  return (
    <div className="mt-8 flex items-center justify-between gap-4">
      {podeVoltar ? (
        <button type="button" onClick={aoVoltar} className="inline-flex min-h-12 items-center gap-1 px-2 text-sm text-muted-foreground transition-colors hover:text-offwhite">
          <ChevronLeft className="size-4" /> Voltar
        </button>
      ) : <span />}
      <InteractiveHoverButton
        text={textoAvancar}
        onClick={aoAvancar}
        disabled={!podeAvancar}
        className="w-44 border-ciano/40 py-3 text-base disabled:pointer-events-none disabled:opacity-40"
      />
    </div>
  );
}
```

- [ ] **Step 2: Intro**

`src/screens/TelaIntro.tsx`:
```tsx
import { PalcoDoRobo } from "@/components/robo/palco";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { PalavraGirando } from "@/components/ui/palavra-girando";

const DADOS = [
  { n: "89%", t: "dizem que o criativo decide a performance" },
  { n: "3,6%", t: "otimizam o criativo de fato" },
  { n: "<10%", t: "dos criativos são testados antes de ir ao ar" },
];

export function TelaIntro({ aoComecar }: { aoComecar: () => void }) {
  return (
    <section className="mx-auto grid min-h-[calc(100dvh-3.5rem)] max-w-5xl items-center gap-6 px-5 py-8 md:grid-cols-2 md:gap-10">
      <div className="order-2 md:order-1">
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-ciano/30 bg-ciano/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-ciano">
          Você sabia? · 12 telas · 4 minutos
        </p>
        <h1 className="text-[2.1rem] font-extrabold leading-[1.08] tracking-tight md:text-5xl">
          Quanto custa a peça que o seu time
          <PalavraGirando palavras={["não faz?", "atrasa?", "refaz?", "esquece?"]} />
        </h1>
        <p className="mt-4 max-w-xl text-base text-muted-foreground md:text-lg">
          Toda operação de conteúdo tem uma fila, e ela não aparece em relatório nenhum. Responda rapidinho e descubra quanto ela custa por mês e quantas mãos podem publicar em nome da sua marca.
        </p>
        <ul className="mt-6 grid grid-cols-3 gap-2">
          {DADOS.map((d) => (
            <li key={d.n} className="rounded-xl border border-border bg-navy/60 p-3">
              <strong className="block text-xl font-extrabold text-ciano md:text-2xl">{d.n}</strong>
              <span className="text-[11px] leading-tight text-muted-foreground">{d.t}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[10px] text-muted-foreground/70">EMARKETER com Perion (abr/2026) e com Toluna (mai/2026).</p>
        <InteractiveHoverButton text="Começar" onClick={aoComecar} className="mt-7 w-44 border-ciano/40 py-3 text-base" />
        <p className="mt-3 text-xs text-muted-foreground">Tem som. Dá pra desligar no canto de cima.</p>
      </div>
      <PalcoDoRobo className="order-1 h-[34vh] md:order-2 md:h-[68vh]" />
    </section>
  );
}
```

- [ ] **Step 3: Perfil**

`src/screens/TelaPerfil.tsx`:
```tsx
import { FATURAMENTOS, SETORES } from "@/domain/steps";

const select = "w-full appearance-none rounded-xl border border-border bg-navy px-4 py-3.5 text-base text-offwhite outline-none transition-colors focus:border-ciano";

export function TelaPerfil({ setor, fat, aoMudar }: { setor: string; fat: string; aoMudar: (campo: "setor" | "fat", valor: string) => void }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ciano">Missão 0 · Quem é você</p>
      <h2 className="mt-2 text-2xl font-extrabold leading-tight md:text-3xl">Antes de tudo: onde a sua empresa joga?</h2>
      <div className="mt-6 grid gap-4">
        <label className="grid gap-2">
          <span className="text-sm text-muted-foreground">Em que setor a sua empresa joga?</span>
          <select className={select} value={setor} onChange={(e) => aoMudar("setor", e.target.value)}>
            <option value="" disabled>Selecione</option>
            {SETORES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
        <label className="grid gap-2">
          <span className="text-sm text-muted-foreground">E o faturamento anual, fica em que faixa?</span>
          <select className={select} value={fat} onChange={(e) => aoMudar("fat", e.target.value)}>
            <option value="" disabled>Selecione</option>
            {FATURAMENTOS.map((f) => <option key={f}>{f}</option>)}
          </select>
        </label>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Pergunta**

`src/screens/TelaPergunta.tsx`:
```tsx
import { Check } from "lucide-react";
import { GlowCard } from "@/components/ui/spotlight-card";
import { FASE_NOME, type Pergunta } from "@/domain/steps";
import { cn } from "@/lib/utils";

export function TelaPergunta({ pergunta, escolhida, aoEscolher }: { pergunta: Pergunta; escolhida: number | undefined; aoEscolher: (i: number) => void }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ciano">{FASE_NOME[pergunta.fase]} · {pergunta.eyebrow}</p>
      <h2 className="mt-2 text-2xl font-extrabold leading-tight md:text-3xl">{pergunta.pergunta}</h2>
      <p className="mt-3 text-sm text-muted-foreground md:text-base">{pergunta.ajuda}</p>
      <div role="radiogroup" aria-label={pergunta.pergunta} className="mt-6 grid gap-3">
        {pergunta.opcoes.map((op, i) => {
          const sel = escolhida === i;
          return (
            <GlowCard key={op.rotulo} customSize className={cn("block w-full gap-0 p-0 transition-transform duration-200", sel && "scale-[1.01] ring-2 ring-ciano")}>
              <button
                type="button"
                role="radio"
                aria-checked={sel}
                onClick={() => aoEscolher(i)}
                className="relative z-10 flex min-h-14 w-full items-center gap-4 rounded-2xl px-5 py-4 text-left"
              >
                <span className={cn("grid size-6 shrink-0 place-items-center rounded-full border transition-colors", sel ? "border-ciano bg-ciano" : "border-border")}>
                  {sel && <Check className="size-4 text-ink" />}
                </span>
                <span className="text-base font-medium">{op.rotulo}</span>
              </button>
            </GlowCard>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: "Você sabia?"**

`src/screens/TelaVoceSabia.tsx`:
```tsx
import { motion } from "framer-motion";
import type { CardVoceSabia } from "@/domain/conteudo";

export function TelaVoceSabia({ card }: { card: CardVoceSabia }) {
  return (
    <div className="text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ciano">Você sabia?</p>
      <motion.strong
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="mt-4 block text-7xl font-extrabold tracking-tight text-ciano md:text-8xl"
      >
        {card.numero}
      </motion.strong>
      <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed md:text-xl">{card.texto}</p>
      <p className="mt-4 text-xs text-muted-foreground">Fonte: {card.fonte}</p>
    </div>
  );
}
```

- [ ] **Step 6: Verificar tipos e commitar**

Run: `npx tsc --noEmit`
Expected: nenhum erro.

```bash
git add src/screens
git commit -m "feat: telas de intro, perfil, pergunta e Você sabia?

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 18: Contato e "calculando"

**Files:**
- Create: `src/screens/TelaContato.tsx`, `src/screens/TelaCalculando.tsx`

- [ ] **Step 1: Contato (com campo-isca e aviso LGPD)**

`src/screens/TelaContato.tsx`:
```tsx
import { useState, type FormEvent } from "react";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { validarContato } from "@/data/contato";
import type { Contato } from "@/flow/quiz";

const campo = "w-full rounded-xl border border-border bg-navy px-4 py-3.5 text-base text-offwhite outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-ciano";

export function TelaContato({ aoEnviar, aoErro }: { aoEnviar: (c: Contato, isca: boolean) => void; aoErro: () => void }) {
  const [v, setV] = useState<Contato>({ nome: "", email: "", empresa: "", cargo: "", whatsapp: "" });
  const [isca, setIsca] = useState("");
  const [erro, setErro] = useState<{ campo: keyof Contato; mensagem: string } | null>(null);
  const muda = (k: keyof Contato) => (e: { target: { value: string } }) => setV({ ...v, [k]: e.target.value });

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    const r = validarContato(v);
    if (!r.ok) {
      setErro({ campo: r.campo, mensagem: r.mensagem });
      document.getElementById(`c-${r.campo}`)?.focus();
      aoErro();
      return;
    }
    setErro(null);
    aoEnviar(r.contato, isca.trim() !== "");
  };

  return (
    <form onSubmit={enviar} noValidate>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ciano">Última etapa</p>
      <h2 className="mt-2 text-2xl font-extrabold leading-tight md:text-3xl">Desbloqueie a sua leitura</h2>
      <p className="mt-3 text-sm text-muted-foreground md:text-base">A conta já está pronta. Diga pra quem a gente entrega.</p>
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <input id="c-nome" className={campo} placeholder="Nome" autoComplete="name" value={v.nome} onChange={muda("nome")} aria-invalid={erro?.campo === "nome"} />
        <input id="c-email" className={campo} placeholder="E-mail corporativo" type="email" inputMode="email" autoComplete="email" value={v.email} onChange={muda("email")} aria-invalid={erro?.campo === "email"} />
        <input id="c-empresa" className={campo} placeholder="Empresa" autoComplete="organization" value={v.empresa} onChange={muda("empresa")} aria-invalid={erro?.campo === "empresa"} />
        <input id="c-cargo" className={campo} placeholder="Cargo" autoComplete="organization-title" value={v.cargo} onChange={muda("cargo")} aria-invalid={erro?.campo === "cargo"} />
        <input id="c-whatsapp" className={`${campo} md:col-span-2`} placeholder="WhatsApp (opcional)" type="tel" inputMode="tel" autoComplete="tel" value={v.whatsapp} onChange={muda("whatsapp")} aria-invalid={erro?.campo === "whatsapp"} />
        <input type="text" name="site" tabIndex={-1} autoComplete="off" aria-hidden value={isca} onChange={(e) => setIsca(e.target.value)} className="absolute -left-[9999px] h-0 w-0 opacity-0" />
      </div>
      {erro && <p role="alert" className="mt-3 text-sm text-err">{erro.mensagem}</p>}
      <InteractiveHoverButton type="submit" text="Desbloquear" className="mt-6 w-48 border-ciano/40 py-3 text-base" />
      <p className="mt-4 max-w-xl text-xs text-muted-foreground">
        Usamos seus dados para enviar este diagnóstico e entrar em contato sobre ele. Nada é compartilhado com terceiros.
      </p>
    </form>
  );
}
```

- [ ] **Step 2: Calculando**

`src/screens/TelaCalculando.tsx`:
```tsx
import { useEffect, useState } from "react";
import { DotLoader, QUADROS_JOGO } from "@/components/ui/dot-loader";

const FRASES = ["Somando as horas de montagem…", "Medindo a sua fila…", "Pesando a exposição da marca…", "Fechando a conta…"];

export function TelaCalculando({ aoTerminar }: { aoTerminar: () => void }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const frases = setInterval(() => setI((x) => Math.min(x + 1, FRASES.length - 1)), 650);
    const fim = setTimeout(aoTerminar, reduzir ? 400 : 2600);
    return () => { clearInterval(frases); clearTimeout(fim); };
  }, [aoTerminar]);

  return (
    <div className="grid min-h-[50vh] place-items-center text-center" aria-live="polite">
      <div>
        <DotLoader frames={QUADROS_JOGO} className="mx-auto scale-[2.5] gap-0.5" dotClassName="bg-white/10 [&.active]:bg-ciano" />
        <p className="mt-14 text-lg font-semibold">{FRASES[i]}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verificar tipos e commitar**

Run: `npx tsc --noEmit`
Expected: nenhum erro.

```bash
git add src/screens
git commit -m "feat: telas de contato (LGPD + isca) e calculando

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 19: Resultado (faróis, veredicto, números, ajuste)

**Files:**
- Create: `src/screens/TelaResultado.tsx`, `src/screens/AjusteNumeros.tsx`

- [ ] **Step 1: Ajuste dos números**

`src/screens/AjusteNumeros.tsx`:
```tsx
import type { CamposAjuste } from "@/domain/entradas";

const CAMPOS: { k: keyof CamposAjuste; rotulo: string; min: number; max?: number; passo: number }[] = [
  { k: "pecas", rotulo: "Peças por mês", min: 1, passo: 1 },
  { k: "custo", rotulo: "Custo mensal da estrutura (R$)", min: 1000, passo: 1000 },
  { k: "horas", rotulo: "Horas de gente por peça", min: 0.25, passo: 0.25 },
  { k: "mont", rotulo: "Montagem e versionamento (% do tempo)", min: 0, max: 100, passo: 5 },
  { k: "dias", rotulo: "Dias úteis de fila", min: 0.5, passo: 0.5 },
  { k: "mult", rotulo: "Quantas peças você faria (× hoje)", min: 1, max: 20, passo: 0.5 },
  { k: "rec", rotulo: "Custo de 1 recurso alocado (R$/mês)", min: 1000, passo: 1000 },
  { k: "preco", rotulo: "Mensalidade do Maestro Composer (R$)", min: 0, passo: 500 },
];

export function AjusteNumeros({ campos, aoMudar }: { campos: CamposAjuste; aoMudar: (c: CamposAjuste) => void }) {
  return (
    <details className="rounded-2xl border border-border bg-navy/60 p-5">
      <summary className="cursor-pointer text-base font-bold text-offwhite">Bônus: ajuste os números</summary>
      <p className="mt-2 text-sm text-muted-foreground">As faixas servem para começar. Coloque os seus números exatos e veja os faróis mudarem.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {CAMPOS.map((c) => (
          <label key={c.k} className="grid gap-1">
            <span className="text-xs text-muted-foreground">{c.rotulo}</span>
            <input
              type="number" inputMode="decimal" min={c.min} max={c.max} step={c.passo} value={campos[c.k]}
              onChange={(e) => aoMudar({ ...campos, [c.k]: e.target.value })}
              className="rounded-xl border border-border bg-ink px-3 py-2.5 text-base text-offwhite outline-none focus:border-ciano"
            />
          </label>
        ))}
      </div>
    </details>
  );
}
```

- [ ] **Step 2: Resultado**

`src/screens/TelaResultado.tsx`:
```tsx
import { Contagem } from "@/components/Contagem";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import type { Nivel, Resultado } from "@/domain/calc";
import type { CamposAjuste } from "@/domain/entradas";
import { brl, num } from "@/domain/format";
import * as L from "@/domain/readings";
import { cn } from "@/lib/utils";
import { AjusteNumeros } from "./AjusteNumeros";

const COR: Record<Nivel, string> = { ok: "text-ok", warn: "text-warn", err: "text-err" };
const LAMPADA: Record<Nivel, string> = { ok: "bg-ok", warn: "bg-warn", err: "bg-err" };

function Lampada({ k, texto }: { k: Nivel; texto: string }) {
  return (
    <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold">
      <span className={cn("size-2.5 rounded-full shadow-[0_0_12px_currentColor]", LAMPADA[k], COR[k])} />
      {texto}
    </p>
  );
}

const cartao = "rounded-2xl border border-border bg-navy/70 p-5 md:p-6";

export function TelaResultado({ r, campos, aoAjustar, aoContinuar, tag }: {
  r: Resultado; campos: CamposAjuste; aoAjustar: (c: CamposAjuste) => void; aoContinuar: () => void; tag: string;
}) {
  const v = L.verdict(r);
  const rel = L.relacao(r);
  const destaque = L.spot(r);
  const c = L.contas(r);
  const alerta = L.flagText(r);

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ciano">A leitura · {tag}</p>
        <h2 className="mt-2 text-2xl font-extrabold md:text-3xl">O custo da sua fila</h2>
      </div>

      <section className={cn(cartao, "border-l-4", v.k === "ok" ? "border-l-ok" : v.k === "warn" ? "border-l-warn" : "border-l-err")}>
        <Lampada k={v.k} texto={v.lamp} />
        <h3 className="mt-2 text-xl font-extrabold md:text-2xl">{v.t}</h3>
        <p className="mt-3 text-muted-foreground">{v.b}</p>
      </section>

      <section className={cartao}>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Farol 1 · O dinheiro</p>
        <p className="mt-1 text-sm text-muted-foreground">Valor em jogo por mês na sua operação de conteúdo</p>
        <Contagem valor={r.teto} formatar={brl} className={cn("mt-2 block text-5xl font-extrabold tracking-tight md:text-6xl", COR[r.f.k])} />
        <Lampada k={r.f.k} texto={r.f.t} />
        <p className="mt-3 text-muted-foreground">{L.explainValor(r)}</p>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-border p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Piso · já acontece hoje</p>
            <p className="mt-1 text-2xl font-bold">{brl(r.piso)}</p>
            <p className="mt-1 text-sm text-muted-foreground">{L.pisoExp(r)}</p>
          </div>
          <div className="rounded-xl border border-border p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Teto · com a sua ambição declarada</p>
            <p className="mt-1 text-2xl font-bold">{brl(r.teto)}</p>
            <p className="mt-1 text-sm text-muted-foreground">{L.tetoExp(r)}</p>
          </div>
        </div>
        <div className="mt-4 rounded-xl bg-ciano/10 p-4">
          <p className="text-3xl font-extrabold text-ciano">{rel.destaque}</p>
          <p className="mt-1 text-sm" dangerouslySetInnerHTML={{ __html: rel.html }} />
          <p className="mt-2 text-sm text-muted-foreground">{L.recursoTexto(r)}</p>
        </div>
      </section>

      <section className={cartao}>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Farol 2 · A marca</p>
        <p className="mt-1 text-sm text-muted-foreground">Exposição da sua marca na produção de conteúdo</p>
        <p className={cn("mt-2 text-5xl font-extrabold", COR[r.m.k])}>{r.marca}/100</p>
        <div className="mt-3 h-2 rounded-full bg-border">
          <div className="h-2 rounded-full bg-gradient-to-r from-ok via-warn to-err transition-[width] duration-700" style={{ width: `${r.marca}%` }} />
        </div>
        <div className="mt-1 flex justify-between text-[11px] text-muted-foreground"><span>Travada por software</span><span>Governada por gente</span></div>
        <Lampada k={r.m.k} texto={r.m.t} />
        <p className="mt-3 text-muted-foreground">{L.explainMarca(r)}</p>
      </section>

      {destaque && (
        <section className={cn(cartao, "border-violeta/40")}>
          <h3 className="text-lg font-extrabold">{destaque.h}</h3>
          <div className="mt-2 grid gap-2 text-muted-foreground [&_strong]:text-offwhite" dangerouslySetInnerHTML={{ __html: destaque.b }} />
        </section>
      )}

      <section className={cartao}>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Os números por trás</p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <div><p className="text-2xl font-bold">{brl(r.custoPeca)}</p><p className="text-sm text-muted-foreground">custo real de uma peça hoje</p></div>
          <div><p className="text-2xl font-bold">{brl(r.custoHora)}</p><p className="text-sm text-muted-foreground">custo de uma hora de produção</p></div>
          <div><p className="text-2xl font-bold">{num(r.horasMont, 0)} h</p><p className="text-sm text-muted-foreground">{L.montagemRotulo(r)}</p></div>
        </div>
        {alerta && <p role="note" className="mt-4 rounded-xl border border-warn/40 bg-warn/10 p-3 text-sm">{alerta}</p>}
        <p className="mt-4 text-muted-foreground">{L.tempoText(r)}</p>
        <p className="mt-3 text-muted-foreground">{L.filaText(r)}</p>
        <p className="mt-3 text-muted-foreground">{L.eqText(r)}</p>
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-semibold text-ciano">Como esta conta é feita</summary>
          <ul className="mt-2 grid gap-1 text-sm text-muted-foreground">
            <li>{c.peca}</li><li>{c.hora}</li><li>{c.piso}</li><li>{c.teto}</li><li>{c.rec}</li>
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">Nenhum número desta página é estimativa nossa. Todos saem das suas respostas.</p>
        </details>
      </section>

      <AjusteNumeros campos={campos} aoMudar={aoAjustar} />

      <div className="flex justify-end">
        <InteractiveHoverButton text="E o Maestro?" onClick={aoContinuar} className="w-48 border-ciano/40 py-3 text-base" />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verificar tipos e commitar**

Run: `npx tsc --noEmit`
Expected: nenhum erro.

```bash
git add src/screens
git commit -m "feat: tela de resultado com faróis, veredicto e ajuste dos números

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 20: Fase final (manifesto + pedido de sessão)

**Files:**
- Create: `src/screens/TelaFinal.tsx`

- [ ] **Step 1: Implementar**

`src/screens/TelaFinal.tsx`:
```tsx
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { PalcoDoRobo } from "@/components/robo/palco";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";

const MARCOS = [25, 50, 75, 100];

export function TelaFinal({ aoAssistir, aoPedirSessao, aoTocarVideo }: {
  aoAssistir: (pct: number) => void; aoPedirSessao: () => void; aoTocarVideo: () => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [pediu, setPediu] = useState(false);
  const atingidos = useRef(new Set<number>());

  useEffect(() => {
    setSrc(window.matchMedia("(max-width: 767px)").matches ? "/video/manifesto-480.mp4" : "/video/manifesto-720.mp4");
  }, []);

  const progresso = () => {
    const v = video.current;
    if (!v || !v.duration) return;
    const pct = Math.floor((v.currentTime / v.duration) * 100);
    for (const m of MARCOS) {
      if (pct >= m && !atingidos.current.has(m)) {
        atingidos.current.add(m);
        aoAssistir(m);
      }
    }
  };

  return (
    <div className="grid gap-8 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:items-center">
      <div>
        <PalcoDoRobo className="mx-auto h-[26vh] md:h-[46vh]" />
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-ciano">Fase final</p>
        <h2 className="mt-2 text-3xl font-extrabold leading-tight md:text-4xl">Como o Maestro pode ajudar a sua empresa?</h2>
        <p className="mt-3 text-muted-foreground">Você já viu o tamanho da fila. Agora veja como ela some.</p>
      </div>
      <div>
        <motion.div
          initial={{ opacity: 0, filter: "blur(16px)", scale: 0.96 }}
          whileInView={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 1.1, ease: [0.23, 1, 0.32, 1] }}
          className="overflow-hidden rounded-2xl border border-ciano/30 bg-black shadow-[0_0_60px_-20px_var(--ciano)]"
        >
          {src && (
            <video
              ref={video}
              src={src}
              poster="/video/manifesto-poster.jpg"
              controls
              playsInline
              preload="metadata"
              onPlay={aoTocarVideo}
              onTimeUpdate={progresso}
              className="aspect-video w-full"
            />
          )}
        </motion.div>
        <div className="mt-6 rounded-2xl border border-border bg-navy/70 p-5">
          <h3 className="text-lg font-extrabold">Quer a leitura completa, com o seu time na sala?</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Uma sessão de 45 minutos sobre os seus números: onde a fila se forma, quais peças ela come primeiro, quantas mãos hoje tocam a sua marca e o que mudaria de fato na sua régua. Sem apresentação de produto.
          </p>
          {pediu ? (
            <p role="status" className="mt-4 font-semibold text-ok">Recebido. Respondemos em até um dia útil.</p>
          ) : (
            <InteractiveHoverButton
              text="Quero a sessão"
              onClick={() => { setPediu(true); aoPedirSessao(); }}
              className="mt-4 w-52 border-ciano/40 py-3 text-base"
            />
          )}
          <button type="button" onClick={() => window.location.reload()} className="mt-4 block text-sm text-muted-foreground underline-offset-4 hover:text-offwhite hover:underline">
            Refazer o diagnóstico
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar tipos e commitar**

Run: `npx tsc --noEmit`
Expected: nenhum erro.

```bash
git add src/screens/TelaFinal.tsx
git commit -m "feat: fase final com manifesto, medição de vídeo e pedido de sessão

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 21: App — orquestração

**Files:**
- Modify: `src/App.tsx` (substitui o provisório)

- [ ] **Step 1: Implementar**

`src/App.tsx`:
```tsx
import { type ReactNode, useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { som } from "@/audio/som";
import { BarraCircuito } from "@/components/BarraCircuito";
import { Moldura } from "@/components/Moldura";
import { BalaoDoRobo } from "@/components/robo/balao";
import { PalcoDoRobo } from "@/components/robo/palco";
import { useEhDesktop } from "@/lib/useEhDesktop";
import { DotLoader, QUADROS_JOGO } from "@/components/ui/dot-loader";
import { FluxoConvergente } from "@/components/ui/fluxo-convergente";
import { origemDoNavegador } from "@/data/origem";
import { depsDoNavegador, enviar, linhaAtualizacao, linhaDesbloqueio, reenviarPendentes } from "@/data/lead";
import { calcular } from "@/domain/calc";
import { REACAO_PERFIL, REACOES, VOCE_SABIA } from "@/domain/conteudo";
import { ajustesDeCampos, camposIniciais, entradasDe, type CamposAjuste } from "@/domain/entradas";
import { verdict } from "@/domain/readings";
import { PERGUNTA_POR_ID } from "@/domain/steps";
import { ESTADO_INICIAL, SEQUENCIA, mostraBarra, nivelMusica, podeAvancar, progresso, quizReducer, respostasCompletas, telaAtual, type Contato } from "@/flow/quiz";
import { Navegacao } from "@/screens/Navegacao";
import { TelaCalculando } from "@/screens/TelaCalculando";
import { TelaContato } from "@/screens/TelaContato";
import { TelaFinal } from "@/screens/TelaFinal";
import { TelaIntro } from "@/screens/TelaIntro";
import { TelaPergunta } from "@/screens/TelaPergunta";
import { TelaPerfil } from "@/screens/TelaPerfil";
import { TelaResultado } from "@/screens/TelaResultado";
import { TelaVoceSabia } from "@/screens/TelaVoceSabia";

function Carregando() {
  return (
    <div className="grid min-h-dvh place-items-center bg-ink">
      <div className="text-center">
        <DotLoader frames={QUADROS_JOGO} className="mx-auto scale-[2] gap-0.5" dotClassName="bg-white/10 [&.active]:bg-ciano" />
        <p className="mt-10 text-sm text-muted-foreground">Ligando o Maestro…</p>
      </div>
    </div>
  );
}

export default function App() {
  const [e, despachar] = useReducer(quizReducer, ESTADO_INICIAL);
  const [carregando, setCarregando] = useState(true);
  const [reacao, setReacao] = useState<{ texto: string; chave: string } | null>(null);
  const [campos, setCampos] = useState<CamposAjuste | null>(null);
  const id = useMemo(() => crypto.randomUUID(), []);
  const desktop = useEhDesktop();
  const tela = telaAtual(e);

  useEffect(() => {
    const minimo = new Promise((r) => setTimeout(r, 1200));
    const maximo = new Promise((r) => setTimeout(r, 3000));
    Promise.race([Promise.all([document.fonts.ready, minimo]), maximo]).then(() => setCarregando(false));
    void reenviarPendentes(depsDoNavegador());
  }, []);

  useEffect(() => {
    som.definirNivel(nivelMusica(e));
    window.scrollTo({ top: 0 });
    setReacao(null);
  }, [e.indice]); // eslint-disable-line react-hooks/exhaustive-deps

  const resultado = useMemo(() => {
    if (!respostasCompletas(e)) return null;
    return calcular(entradasDe(e.respostas, campos ? ajustesDeCampos(campos) : {}));
  }, [e, campos]);

  const atualizar = useCallback((m: Parameters<typeof linhaAtualizacao>[1]) => {
    void enviar({ evento: "atualizacao", linha: linhaAtualizacao(id, m) }, depsDoNavegador());
  }, [id]);

  const avancar = () => {
    const proxima = { ...e, indice: e.indice + 1 };
    som.tocar(proxima.indice < SEQUENCIA.length && nivelMusica(proxima) !== nivelMusica(e) ? "fase" : "clique");
    despachar({ type: "avancar" });
  };

  const comecar = () => {
    som.iniciar();
    som.tocar("fase");
    despachar({ type: "avancar" });
  };

  const responder = (i: number) => {
    if (tela.tipo !== "pergunta") return;
    som.tocar("selecao");
    despachar({ type: "responder", id: tela.id, opcao: i });
    setReacao({ texto: REACOES[tela.id][i], chave: `${tela.id}-${i}` });
  };

  const mudarPerfil = (campo: "setor" | "fat", valor: string) => {
    som.tocar("selecao");
    despachar({ type: "perfil", campo, valor });
    if ((campo === "setor" ? e.fat : e.setor) !== "") setReacao({ texto: REACAO_PERFIL, chave: "perfil" });
  };

  const enviarContato = (c: Contato, isca: boolean) => {
    despachar({ type: "contato", contato: c });
    despachar({ type: "avancar" });
    som.tocar("fase");
    if (!respostasCompletas(e)) return;
    setCampos(camposIniciais(entradasDe(e.respostas)));
    if (isca) return; // robô de spam: mostra o resultado, mas não grava nada
    const r = calcular(entradasDe(e.respostas));
    void enviar(
      { evento: "desbloqueio", linha: linhaDesbloqueio({ id, agora: new Date(), contato: c, setor: e.setor, fat: e.fat, respostas: e.respostas, resultado: r, veredicto: verdict(r), origem: origemDoNavegador() }) },
      depsDoNavegador(),
    );
  };

  const terminarCalculo = useCallback(() => {
    som.tocar("revelar");
    despachar({ type: "avancar" });
  }, []);

  if (carregando) return <Carregando />;

  const p = progresso(e);
  const comFluxo = tela.tipo === "contato" || tela.tipo === "calculando" || tela.tipo === "resultado";
  const nav = (texto?: string) => (
    <Navegacao podeVoltar={e.indice > 1} podeAvancar={podeAvancar(e)} aoVoltar={() => { som.tocar("clique"); despachar({ type: "voltar" }); }} aoAvancar={avancar} textoAvancar={texto} />
  );

  let conteudo: ReactNode;
  switch (tela.tipo) {
    case "intro": conteudo = <TelaIntro aoComecar={comecar} />; break;
    case "perfil": conteudo = <>{<TelaPerfil setor={e.setor} fat={e.fat} aoMudar={mudarPerfil} />}{nav()}</>; break;
    case "vocesabia": conteudo = <>{<TelaVoceSabia card={VOCE_SABIA[tela.card]} />}{nav()}</>; break;
    case "pergunta": conteudo = <>{<TelaPergunta pergunta={PERGUNTA_POR_ID[tela.id]} escolhida={e.respostas[tela.id]} aoEscolher={responder} />}{nav(tela.id === "ia" ? "Ver o resultado" : undefined)}</>; break;
    case "contato": conteudo = <TelaContato aoEnviar={enviarContato} aoErro={() => som.tocar("erro")} />; break;
    case "calculando": conteudo = <TelaCalculando aoTerminar={terminarCalculo} />; break;
    case "resultado":
      conteudo = resultado && campos && (
        <TelaResultado r={resultado} campos={campos} aoAjustar={setCampos} aoContinuar={avancar} tag={`${e.setor} · ${e.fat}`} />
      );
      break;
    case "final":
      conteudo = (
        <TelaFinal
          aoTocarVideo={() => som.definirNivel(0)}
          aoAssistir={(pct) => atualizar({ videoPct: pct })}
          aoPedirSessao={() => atualizar({ pediuSessao: true, ajustes: campos ? ajustesDeCampos(campos) : undefined })}
        />
      );
      break;
  }

  const telaDeJogo = mostraBarra(tela); // perfil · você sabia · pergunta · contato
  const colunaRobo = telaDeJogo && desktop;
  const comReacao = tela.tipo === "pergunta" || tela.tipo === "perfil";
  const classeConteudo =
    tela.tipo === "intro" ? ""
    : tela.tipo === "final" ? "mx-auto w-full max-w-6xl px-5 py-8 md:py-12"
    : colunaRobo ? "w-full"
    : "mx-auto w-full max-w-3xl px-5 py-8 md:py-12";

  const animado = (
    <AnimatePresence mode="wait">
      <motion.div
        key={e.indice}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
        className={classeConteudo}
      >
        {conteudo}
      </motion.div>
    </AnimatePresence>
  );

  return (
    <MotionConfig reducedMotion="user">
      <Moldura barra={telaDeJogo ? <BarraCircuito {...p} /> : undefined}>
        {comFluxo && <FluxoConvergente className="fixed -z-10 opacity-60" />}
        {colunaRobo ? (
          // Desktop: robô fixo à esquerda (fora do AnimatePresence, para o Spline não recarregar a cada tela).
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-8 md:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] md:py-12">
            <aside className="sticky top-32 self-start">
              <PalcoDoRobo className="h-[56vh]" />
              {comReacao && <BalaoDoRobo variante="coluna" texto={reacao?.texto ?? null} chave={reacao?.chave ?? "nada"} />}
            </aside>
            {animado}
          </div>
        ) : (
          animado
        )}
        {!desktop && comReacao && <BalaoDoRobo variante="canto" texto={reacao?.texto ?? null} chave={reacao?.chave ?? "nada"} />}
      </Moldura>
    </MotionConfig>
  );
}
```

- [ ] **Step 2: Rodar tudo**

Run: `npm test && npm run build`
Expected: todos os testes PASS e `✓ built in`.

- [ ] **Step 3: Conferência manual rápida no desktop**

Run: `npm run dev` e abrir `http://localhost:8080` com o Playwright (script de screenshot, regra do usuário) ou no navegador do Marcelo.
Expected: loader → intro com robô → Começar liga a música → perfil → cards → perguntas → contato → calculando → resultado → final. O envio para o n8n acontece porque `localhost:8080` está liberado no webhook.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: App orquestra fluxo, som, reações e envio ao n8n

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Fase 8 · Mídia e compartilhamento

### Task 22: Vídeo do manifesto para web

**Files:**
- Create: `scripts/video.sh`, `public/video/manifesto-720.mp4`, `public/video/manifesto-480.mp4`, `public/video/manifesto-poster.jpg`

- [ ] **Step 1: Script**

`scripts/video.sh`:
```bash
#!/usr/bin/env bash
# Converte o manifesto (1080p, 1min50, áudio PCM, 170 MB) em versões leves para a web.
set -euo pipefail
ORIGEM="$HOME/Library/CloudStorage/GoogleDrive-marcelo@i9criacoes.com.br/Drives compartilhados/ALWAYS ON/ALWAYS ON/PEÇAS/3_VIDEOS/18_MAESTRO_MANIFESTO/AF/Maestro_Manifesto_v2.mp4"
DEST="public/video"
TMP="$(mktemp -d)"
mkdir -p "$DEST"
cp "$ORIGEM" "$TMP/origem.mp4"

# 720p ~ 14 MB (2 passadas, 950 kb/s de vídeo + 96 kb/s de áudio)
ffmpeg -y -i "$TMP/origem.mp4" -vf "scale=-2:720" -c:v libx264 -preset slow -b:v 950k -pass 1 -passlogfile "$TMP/p720" -an -f mp4 /dev/null
ffmpeg -y -i "$TMP/origem.mp4" -vf "scale=-2:720" -c:v libx264 -preset slow -b:v 950k -pass 2 -passlogfile "$TMP/p720" \
  -pix_fmt yuv420p -profile:v high -movflags +faststart -c:a aac -b:a 96k "$DEST/manifesto-720.mp4"

# 480p ~ 8 MB
ffmpeg -y -i "$TMP/origem.mp4" -vf "scale=-2:480" -c:v libx264 -preset slow -b:v 520k -pass 1 -passlogfile "$TMP/p480" -an -f mp4 /dev/null
ffmpeg -y -i "$TMP/origem.mp4" -vf "scale=-2:480" -c:v libx264 -preset slow -b:v 520k -pass 2 -passlogfile "$TMP/p480" \
  -pix_fmt yuv420p -profile:v main -movflags +faststart -c:a aac -b:a 80k "$DEST/manifesto-480.mp4"

# Capa: quadro aos 3 s
ffmpeg -y -ss 3 -i "$TMP/origem.mp4" -frames:v 1 -vf "scale=1280:-2" -q:v 3 "$DEST/manifesto-poster.jpg"

rm -rf "$TMP"
ls -lh "$DEST"
```

- [ ] **Step 2: Rodar**

Run: `chmod +x scripts/video.sh && scripts/video.sh`
Expected: `manifesto-720.mp4` ≤ 15 MB, `manifesto-480.mp4` ≤ 10 MB, `manifesto-poster.jpg`. Se a cópia do Drive demorar, é o Google Drive baixando os 170 MB: esperar.

- [ ] **Step 3: Conferir**

Run: `ffprobe -v error -show_entries format=duration,size:stream=codec_name,height -of compact public/video/manifesto-720.mp4`
Expected: `h264`, `height=720`, `aac`, duração ~109.9 s.

- [ ] **Step 4: Commit**

```bash
git add scripts/video.sh public/video
git commit -m "feat: manifesto do Maestro em 720p, 480p e capa

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 23: Imagem de compartilhamento e metatags

**Files:**
- Create: `scripts/og/og.html`, `scripts/og/render.py`, `public/og-image.jpg`
- Modify: `index.html`

- [ ] **Step 1: Layout da imagem (1200 × 630)**

`scripts/og/og.html`:
```html
<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800&display=swap" rel="stylesheet" />
<style>
  * { margin: 0; box-sizing: border-box; }
  body { width: 1200px; height: 630px; overflow: hidden; background: #05070f; font-family: "Plus Jakarta Sans", sans-serif; color: #eef0f7; position: relative; }
  .brilho { position: absolute; inset: 0; background:
    radial-gradient(520px 380px at 88% 18%, rgba(123, 70, 230, .35), transparent 70%),
    radial-gradient(560px 420px at 8% 100%, rgba(0, 212, 255, .22), transparent 70%); }
  svg.linhas { position: absolute; inset: 0; opacity: .5; }
  .conteudo { position: absolute; left: 72px; top: 64px; width: 640px; }
  .marca { display: flex; align-items: center; gap: 12px; }
  .marca img { height: 30px; }
  .marca span { font-size: 16px; color: #9aa3c4; }
  .selo { display: inline-block; margin-top: 54px; padding: 8px 16px; border: 1px solid rgba(0,212,255,.4); border-radius: 999px; color: #00d4ff; font-weight: 700; font-size: 18px; letter-spacing: .14em; text-transform: uppercase; background: rgba(0,212,255,.08); }
  h1 { margin-top: 26px; font-size: 62px; line-height: 1.04; font-weight: 800; letter-spacing: -.02em; }
  h1 b { color: #00d4ff; }
  p { margin-top: 22px; font-size: 24px; color: #b9c0dc; }
  .robo { position: absolute; right: 30px; bottom: 0; height: 560px; filter: drop-shadow(0 0 40px rgba(0,212,255,.25)); }
</style>
</head>
<body>
  <div class="brilho"></div>
  <svg class="linhas" viewBox="0 0 1200 630" aria-hidden="true">
    <g fill="none" stroke="#00d4ff" stroke-opacity=".35" stroke-dasharray="1 5">
      <path d="M0 40 C 300 40, 480 315, 900 315" /><path d="M0 160 C 300 160, 480 315, 900 315" />
      <path d="M0 470 C 300 470, 480 315, 900 315" /><path d="M0 590 C 300 590, 480 315, 900 315" />
      <path d="M1200 60 C 1050 60, 980 315, 900 315" /><path d="M1200 570 C 1050 570, 980 315, 900 315" />
    </g>
  </svg>
  <img class="robo" src="../../public/robo.png" alt="" />
  <div class="conteudo">
    <div class="marca"><img src="../../public/maestro-wordmark.svg" alt="Maestro" /><span>by always on</span></div>
    <div class="selo">Você sabia?</div>
    <h1>Você sabe quanto custa <b>cada peça</b> que o seu time produz?</h1>
    <p>Diagnóstico de 4 minutos: quanto a fila de produção custa por mês.</p>
  </div>
</body>
</html>
```

- [ ] **Step 2: Renderizar com Playwright**

`scripts/og/render.py`:
```python
"""Renderiza scripts/og/og.html em public/og-image.jpg (1200x630)."""
from pathlib import Path
from playwright.sync_api import sync_playwright

raiz = Path(__file__).resolve().parents[2]
html = raiz / "scripts" / "og" / "og.html"
saida = raiz / "public" / "og-image.jpg"

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1200, "height": 630})
    pg.goto(html.as_uri(), wait_until="networkidle")
    pg.wait_for_timeout(500)
    pg.screenshot(path=str(saida), type="jpeg", quality=88)
    b.close()
print(saida, saida.stat().st_size // 1024, "KB")
```

Run:
```bash
cd "$HOME/Claude/CLAUDE CODE/playwright" && source .venv/bin/activate && python "$HOME/Claude/CLAUDE CODE/questionario-maestro/scripts/og/render.py"
```
Expected: `public/og-image.jpg` com menos de 300 KB. Abrir a imagem e conferir: logo, título legível, robô à direita, nada cortado.

- [ ] **Step 3: `index.html` final**

`index.html`:
```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="theme-color" content="#05070F" />
    <title>Você sabe quanto custa cada peça? · Maestro</title>
    <meta name="description" content="Diagnóstico de 4 minutos: descubra quanto a fila de produção de conteúdo custa à sua empresa por mês, e quanto valor ela segura." />
    <link rel="icon" type="image/svg+xml" href="/maestro-icon.svg" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />

    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://questionario.aodigital.net.br/" />
    <meta property="og:site_name" content="Maestro · Always On" />
    <meta property="og:locale" content="pt_BR" />
    <meta property="og:title" content="Você sabe quanto custa cada peça que o seu time produz?" />
    <meta property="og:description" content="Diagnóstico de 4 minutos: descubra quanto a fila de produção de conteúdo custa à sua empresa por mês, e quanto valor ela segura." />
    <meta property="og:image" content="https://questionario.aodigital.net.br/og-image.jpg" />
    <meta property="og:image:secure_url" content="https://questionario.aodigital.net.br/og-image.jpg" />
    <meta property="og:image:type" content="image/jpeg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="Maestro · Você sabe quanto custa cada peça que o seu time produz?" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Você sabe quanto custa cada peça que o seu time produz?" />
    <meta name="twitter:description" content="Diagnóstico de 4 minutos: descubra quanto a fila de produção de conteúdo custa à sua empresa por mês, e quanto valor ela segura." />
    <meta name="twitter:image" content="https://questionario.aodigital.net.br/og-image.jpg" />
  </head>
  <body>
    <div id="root"></div>
    <noscript>Ative o JavaScript para fazer o diagnóstico.</noscript>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 4: Build e commit**

Run: `npm run build`
Expected: `✓ built in`; `dist/og-image.jpg` presente.

```bash
git add scripts/og public/og-image.jpg index.html
git commit -m "feat: imagem de compartilhamento e metatags OG/Twitter

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Fase 9 · Verificação

### Task 24: Conferir que a referência ainda é igual ao site ao vivo

**Files:**
- Create: `scripts/conferir_referencia.py`

- [ ] **Step 1: Script**

`scripts/conferir_referencia.py`:
```python
"""1) O script do maestro.com.ai/custo-da-fila ainda é igual a docs/referencia/custo-da-fila/calc.js?
2) O site ao vivo devolve R$ 161.200 e 'Caso fechado' para todas as respostas no índice 2?"""
import re
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

raiz = Path(__file__).resolve().parents[1]
referencia = (raiz / "docs/referencia/custo-da-fila/calc.js").read_text()
URL = "https://www.maestro.com.ai/custo-da-fila"

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1366, "height": 900})
    pg.goto(URL, wait_until="networkidle", timeout=60000)
    scripts = re.findall(r"<script(?![^>]*src=)[^>]*>(.*?)</script>", pg.content(), re.S)
    ao_vivo = max(scripts, key=len)
    igual = ao_vivo.strip() == referencia.strip()
    print("script igual à referência:", igual)

    pg.click("#start")
    for _ in range(11):
        pg.wait_for_selector("#opts button")
        if pg.is_visible("#setor"):
            pg.select_option("#setor", index=1)
            pg.select_option("#fat", index=1)
        botoes = pg.query_selector_all("#opts button")
        botoes[min(2, len(botoes) - 1)].click()
        pg.click("#next")
    pg.wait_for_selector("#r-valor")
    valor = pg.inner_text("#r-valor")
    veredicto = pg.inner_text("#r-vlamp-t")
    print("ao vivo:", valor, "·", veredicto)
    b.close()

ok = igual and valor == "R$ 161.200" and veredicto == "Caso fechado"
print("OK" if ok else "DIVERGÊNCIA: atualizar docs/referencia e rodar npm test")
sys.exit(0 if ok else 1)
```

- [ ] **Step 2: Rodar**

```bash
cd "$HOME/Claude/CLAUDE CODE/playwright" && source .venv/bin/activate && python "$HOME/Claude/CLAUDE CODE/questionario-maestro/scripts/conferir_referencia.py"
```
Expected: `script igual à referência: True`, `ao vivo: R$ 161.200 · Caso fechado`, `OK`.
Se der `DIVERGÊNCIA` por mudança no site: salvar o script novo em `docs/referencia/custo-da-fila/calc.js`, rodar `npm test` e ajustar `calc.ts`/`readings.ts`/`steps.ts` até ficar verde. Se os seletores (`#start`, `#opts`, `#next`, `#r-valor`, `#r-vlamp-t`) não existirem mais, ler `docs/referencia/custo-da-fila/page.html` atualizado e trocar os seletores.

- [ ] **Step 3: Commit**

```bash
git add scripts/conferir_referencia.py
git commit -m "test: conferência da referência contra o site ao vivo

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 25: Ponta a ponta no celular e no desktop

**Files:**
- Create: `e2e/fluxo_e2e.py`

- [ ] **Step 1: Script**

`e2e/fluxo_e2e.py`:
```python
"""Joga o questionário inteiro (celular e desktop), envia o contato 'TESTE E2E' e confere o resultado.
Uso: python e2e/fluxo_e2e.py [URL]  (padrão http://localhost:4173)"""
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:4173"
CAPTURAS = Path(__file__).resolve().parent / "capturas"
CAPTURAS.mkdir(exist_ok=True)

TELAS = [("celular", {"viewport": {"width": 390, "height": 844}, "is_mobile": True, "has_touch": True, "device_scale_factor": 3}),
         ("desktop", {"viewport": {"width": 1440, "height": 900}})]

def jogar(pg, nome):
    n = 0
    def foto():
        nonlocal n
        n += 1
        pg.screenshot(path=str(CAPTURAS / f"{nome}-{n:02d}.png"), full_page=True)

    pg.goto(URL)
    pg.get_by_role("button", name="Começar").click(timeout=10000)
    foto()
    pg.locator("select").nth(0).select_option(index=1)
    pg.locator("select").nth(1).select_option(index=1)
    foto()
    pg.get_by_role("button", name="Continuar").click()
    while True:
        pg.wait_for_timeout(450)
        if pg.get_by_role("heading", name="Desbloqueie a sua leitura").count():
            break
        radios = pg.get_by_role("radio")
        if radios.count():
            radios.nth(min(2, radios.count() - 1)).click()
            foto()
            botao = pg.get_by_role("button", name="Ver o resultado")
            (botao if botao.count() else pg.get_by_role("button", name="Continuar")).click()
        else:
            foto()
            pg.get_by_role("button", name="Continuar").click()
    pg.fill("#c-nome", "TESTE E2E")
    pg.fill("#c-email", "teste-e2e@aodigital.com.br")
    pg.fill("#c-empresa", "Teste")
    pg.fill("#c-cargo", "QA")
    pg.fill("#c-whatsapp", "+55 (11) 90000-0000")
    foto()
    pg.get_by_role("button", name="Desbloquear").click()
    expect(pg.get_by_text("Caso fechado").first).to_be_visible(timeout=10000)
    pg.wait_for_timeout(1800)
    expect(pg.get_by_text("R$ 161.200").first).to_be_visible()
    foto()
    pg.get_by_role("button", name="E o Maestro?").click()
    pg.wait_for_timeout(800)
    foto()
    pg.get_by_role("button", name="Quero a sessão").click()
    expect(pg.get_by_text("Recebido. Respondemos em até um dia útil.")).to_be_visible()
    foto()
    print(nome, "OK —", n, "capturas")

with sync_playwright() as p:
    b = p.chromium.launch()
    for nome, opts in TELAS:
        ctx = b.new_context(**opts)
        jogar(ctx.new_page(), nome)
        ctx.close()
    b.close()
```

- [ ] **Step 2: Subir o build e rodar**

```bash
cd "$HOME/Claude/CLAUDE CODE/questionario-maestro" && npm run build && (npm run preview > /tmp/preview.log 2>&1 &) && sleep 3
cd "$HOME/Claude/CLAUDE CODE/playwright" && source .venv/bin/activate && python "$HOME/Claude/CLAUDE CODE/questionario-maestro/e2e/fluxo_e2e.py"
```
Expected: `celular OK — N capturas` e `desktop OK — N capturas`.

- [ ] **Step 3: Conferir as capturas**

Ler as imagens de `e2e/capturas/` (Read tool). Checar em cada uma: nada cortado, texto legível, botões com área de toque grande no celular, barra de circuito avançando, balão do robô sem cobrir botão.
Corrigir o que estiver errado nas telas, rodar o Step 2 de novo.

- [ ] **Step 4: Conferir a planilha e limpar**

- `read_file_content` na planilha `1ecWjh-Sgsyu_QgSCv8Sx5bneQDZfav1HEwxgPAN-pZU`: duas linhas `TESTE E2E`, com `Teto` 161200, `Veredicto` Caso fechado, `WhatsApp` 5511900000000, `Pediu sessão` Sim, `Dispositivo` celular e desktop.
- `execute_workflow` da manutenção. Conferir de novo: as linhas sumiram e o cabeçalho ficou.

- [ ] **Step 5: Parar o preview e commitar**

```bash
pkill -f "vite preview" || true
cd "$HOME/Claude/CLAUDE CODE/questionario-maestro"
git add e2e/fluxo_e2e.py
git commit -m "test: ponta a ponta no celular e desktop

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Fase 10 · Publicação

### Task 26: Repositório e GitHub Action

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Workflow de build (padrão da skill deploy-git-plesk, versão npm)**

`.github/workflows/deploy.yml`:
```yaml
name: Build e Deploy Site
on:
  push: { branches: [main] }
  workflow_dispatch:
permissions: { contents: write }
concurrency: { group: deploy-${{ github.ref }}, cancel-in-progress: true }
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm test
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
          publish_branch: deploy
          force_orphan: false
```

- [ ] **Step 2: Criar o repositório privado e enviar**

```bash
cd "$HOME/Claude/CLAUDE CODE/questionario-maestro"
git add .github
git commit -m "ci: build, testes e publicação na branch deploy

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
gh repo create midiai9/questionario-maestro --private --source . --remote origin --push
```
Expected: repositório criado e `main` enviada.

- [ ] **Step 3: Conferir a Action**

Run: `gh run watch --repo midiai9/questionario-maestro --exit-status`
Expected: `completed success`. Depois: `git ls-remote origin deploy` mostra a branch `deploy`.

### Task 27: Plesk Git puxando a branch `deploy`

- [ ] **Step 1: Ver se a extensão Git do Plesk tem CLI**

Via `mcp__plesk__exec`: `["sh", "-c", "plesk ext git --help 2>&1 | head -60"]`
Expected: lista de comandos. Se existir `--create`/`--add`, seguir o Step 2A; se não, Step 2B.

- [ ] **Step 2A: Criar pela CLI**

Usando os nomes de opção mostrados no `--help`, criar o repositório com:
- domínio `questionario.aodigital.net.br`
- URL remota `git@github.com:midiai9/questionario-maestro.git`
- branch `deploy`
- caminho de publicação `/questionario.aodigital.net.br`
- modo de deploy automático

Pegar a chave SSH pública que o Plesk gerar (ela aparece na saída ou em `plesk ext git --get-public-key`/equivalente no `--help`) e pegar a URL do webhook.

- [ ] **Step 2B: Criar pelo painel (se não houver CLI)**

Pedir ao Marcelo, em 5 cliques: Plesk → `questionario.aodigital.net.br` → Git → Adicionar repositório → URL `git@github.com:midiai9/questionario-maestro.git`, branch `deploy`, caminho `/questionario.aodigital.net.br`, modo Automático. Ele me passa a chave SSH pública e a URL do webhook mostradas na tela.

- [ ] **Step 3: Chave de deploy no GitHub (repositório privado)**

```bash
printf '%s\n' "<CHAVE_PUBLICA_DO_PLESK>" > /tmp/plesk-deploy.pub
gh repo deploy-key add /tmp/plesk-deploy.pub --repo midiai9/questionario-maestro --title "Plesk questionario.aodigital.net.br"
rm /tmp/plesk-deploy.pub
```
Expected: `✓ Deploy key added`.

- [ ] **Step 4: Webhook do GitHub para o Plesk**

```bash
gh api repos/midiai9/questionario-maestro/hooks -f name=web -F active=true -f 'events[]=push' \
  -f "config[url]=<PAYLOAD_URL_DO_PLESK>" -f config[content_type]=json -f config[insecure_ssl]=0
```
Expected: JSON com `"id"`. O ping pode voltar 404 do Plesk: é normal (ver skill), vale o push.

- [ ] **Step 5: Primeiro pull e verificação**

Disparar `gh workflow run "Build e Deploy Site" --repo midiai9/questionario-maestro` e esperar terminar. Depois:
```bash
curl -s https://questionario.aodigital.net.br/ | grep -o "<title>[^<]*</title>"
curl -s -o /dev/null -w "%{content_type}\n" https://questionario.aodigital.net.br/og-image.jpg
curl -s -o /dev/null -w "%{content_type} %{size_download}\n" https://questionario.aodigital.net.br/video/manifesto-480.mp4
```
Expected: `<title>Você sabe quanto custa cada peça? · Maestro</title>`, `image/jpeg`, `video/mp4` com tamanho > 1 MB (validar por content-type, não por HTTP 200 — regra da skill).

### Task 28: Verificação final em produção

- [ ] **Step 1: Ponta a ponta contra produção**

```bash
cd "$HOME/Claude/CLAUDE CODE/playwright" && source .venv/bin/activate && python "$HOME/Claude/CLAUDE CODE/questionario-maestro/e2e/fluxo_e2e.py" https://questionario.aodigital.net.br
```
Expected: `celular OK` e `desktop OK`. Conferir a planilha e rodar a manutenção para apagar as linhas `TESTE E2E` (como na Task 25, Step 4).

- [ ] **Step 2: Lighthouse mobile**

```bash
CHROME_PATH="$(cd "$HOME/Claude/CLAUDE CODE/playwright" && .venv/bin/python -c 'from playwright.sync_api import sync_playwright as s; p=s().start(); print(p.chromium.executable_path); p.stop()')" \
npx --yes lighthouse https://questionario.aodigital.net.br --only-categories=performance --form-factor=mobile --output=json --output-path=./lh.json --quiet --chrome-flags="--headless=new"
node -e "const r=require('./lh.json');console.log('performance', Math.round(r.categories.performance.score*100), '· LCP', r.audits['largest-contentful-paint'].displayValue)"
```
Expected: performance ≥ 85. Se ficar abaixo, o candidato é o Spline no celular: forçar `podeCarregar3D` a exigir `largura >= 768` e medir de novo.

- [ ] **Step 3: Teste de compartilhamento**

Rodar `curl -s -A "WhatsApp/2.23" https://questionario.aodigital.net.br/ | grep -E "og:(title|image|description)"` e conferir as 3 tags. Pedir ao Marcelo para colar o link num chat do WhatsApp e confirmar a prévia com a imagem.

- [ ] **Step 4: Registrar e avisar**

Atualizar o `README.md` do projeto com: endereço, planilha, IDs dos workflows n8n, como rodar testes, como publicar (git push na `main`). Commit e push:
```bash
git add README.md
git commit -m "docs: README com endereço, planilha, n8n e como publicar

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push
```

---

## IDs (preencher durante a execução)

- Workflow n8n principal: `______`
- Workflow n8n manutenção: `______`
- Webhook Plesk Git: `______`
