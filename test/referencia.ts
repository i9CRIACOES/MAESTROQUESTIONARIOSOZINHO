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
