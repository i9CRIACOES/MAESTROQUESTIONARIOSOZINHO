import type { Nivel, Resultado } from "@/domain/calc";
import { MARCA_ALTA, MARCA_MEDIA } from "@/domain/constants";
import { relacao } from "@/domain/readings";
import type { Respostas } from "@/domain/entradas";
import { PERGUNTA_POR_ID } from "@/domain/steps";

/** Dados dos gráficos do painel. Tudo sai de `r`: nenhuma conta de negócio nova, só geometria e proporção. */

export type FormatoKpi = "brl" | "horas" | "pessoas";
export interface Kpi { chave: "teto" | "piso" | "custoPeca" | "custoHora" | "horasMont" | "pessoas"; rotulo: string; valor: number; formato: FormatoKpi; destaque?: boolean }

export function kpis(r: Resultado): Kpi[] {
  return [
    { chave: "teto", rotulo: "Valor em jogo por mês", valor: r.teto, formato: "brl", destaque: true },
    { chave: "piso", rotulo: "Piso: montagem que já acontece hoje", valor: r.piso, formato: "brl" },
    { chave: "custoPeca", rotulo: "Custo real de uma peça", valor: r.custoPeca, formato: "brl" },
    { chave: "custoHora", rotulo: "Custo de uma hora de produção", valor: r.custoHora, formato: "brl" },
    { chave: "horasMont", rotulo: "Horas de montagem por mês", valor: r.horasMont, formato: "horas" },
    { chave: "pessoas", rotulo: "Pessoas em tempo integral só montando", valor: r.pessoas, formato: "pessoas" },
  ];
}

const frac = (v: number, total: number) => (total > 0 ? Math.min(1, Math.max(0, v / total)) : 0);

export interface Segmento { chave: "montagem" | "criacao"; rotulo: string; valor: number; frac: number; inicio: number; fim: number }

/** Rosca: o custo da estrutura dividido em montagem (piso) e criação (o resto). */
export function rosca(r: Resultado): { total: number; segmentos: [Segmento, Segmento] } {
  const montagem = r.piso;
  const criacao = Math.max(0, r.custo - r.piso);
  const fm = frac(montagem, r.custo);
  return {
    total: r.custo,
    segmentos: [
      { chave: "montagem", rotulo: "Montagem e versionamento", valor: montagem, frac: fm, inicio: 0, fim: fm },
      { chave: "criacao", rotulo: "Criação", valor: criacao, frac: 1 - fm, inicio: fm, fim: 1 },
    ],
  };
}

export interface Passo { chave: "piso" | "gap" | "teto"; rotulo: string; valor: number; base: number; topo: number }

/** Cascata: piso + custo das peças que faltam = teto. */
export function cascata(r: Resultado): { passos: [Passo, Passo, Passo]; max: number } {
  return {
    max: Math.max(r.teto, r.piso, 1),
    passos: [
      { chave: "piso", rotulo: "Piso", valor: r.piso, base: 0, topo: r.piso },
      { chave: "gap", rotulo: "Peças que faltam", valor: r.custoGap, base: r.piso, topo: r.piso + r.custoGap },
      { chave: "teto", rotulo: "Em jogo", valor: r.teto, base: 0, topo: r.teto },
    ],
  };
}

export interface Barra { chave: "teto" | "preco"; rotulo: string; valor: number; frac: number }

/** Barras: valor em jogo contra a mensalidade, na mesma escala. */
export function barras(r: Resultado): { itens: [Barra, Barra]; max: number; destaque: string; vence: "teto" | "preco" } {
  const max = Math.max(r.teto, r.preco);
  return {
    max,
    destaque: relacao(r).destaque,
    vence: r.teto >= r.preco ? "teto" : "preco",
    itens: [
      { chave: "teto", rotulo: "Valor em jogo / mês", valor: r.teto, frac: frac(r.teto, max) },
      { chave: "preco", rotulo: "Mensalidade do Composer", valor: r.preco, frac: frac(r.preco, max) },
    ],
  };
}

export interface Zona { de: number; ate: number; nivel: Nivel; lvl: "baixa" | "média" | "alta"; rotulo: string }
const ZONAS: Zona[] = [
  { de: 0, ate: MARCA_MEDIA, nivel: "ok", lvl: "baixa", rotulo: "Baixa" },
  { de: MARCA_MEDIA, ate: MARCA_ALTA, nivel: "warn", lvl: "média", rotulo: "Média" },
  { de: MARCA_ALTA, ate: 100, nivel: "err", lvl: "alta", rotulo: "Alta" },
];

/** Velocímetro: score de marca 0–100 em meia-lua; -90° = 0, +90° = 100. */
export function velocimetro(r: Resultado): { valor: number; angulo: number; zona: Zona; zonas: Zona[] } {
  const valor = Math.min(100, Math.max(0, r.marca));
  const zona = r.marca >= MARCA_ALTA ? ZONAS[2] : r.marca >= MARCA_MEDIA ? ZONAS[1] : ZONAS[0];
  return { valor, angulo: -90 + (valor / 100) * 180, zona, zonas: ZONAS };
}

/** Régua da fila: dias úteis do usuário com marcas em 6 (uma semana) e 11 (duas semanas), mesmos cortes do filaText. */
export function reguaFila(r: Resultado): { dias: number; max: number; pos: number; nivel: Nivel; marcas: { dias: number; pos: number; rotulo: string }[] } {
  const max = Math.max(15, Math.ceil(r.dias * 1.1));
  const nivel: Nivel = r.dias >= 11 ? "err" : r.dias >= 6 ? "warn" : "ok";
  return {
    dias: r.dias, max, pos: frac(r.dias, max), nivel,
    marcas: [
      { dias: 6, pos: 6 / max, rotulo: "1 semana" },
      { dias: 11, pos: 11 / max, rotulo: "2 semanas" },
    ],
  };
}

// ---- Geometria SVG ----

/** Ponto no círculo; 0° aponta para cima, sentido horário. */
export function polar(cx: number, cy: number, raio: number, graus: number) {
  const rad = ((graus - 90) * Math.PI) / 180;
  return { x: cx + raio * Math.cos(rad), y: cy + raio * Math.sin(rad) };
}

const f = (n: number) => +n.toFixed(2);

/** Path de arco de `de` até `ate` graus (0° = topo, horário). */
export function arco(cx: number, cy: number, raio: number, de: number, ate: number): string {
  const a = polar(cx, cy, raio, de);
  const b = polar(cx, cy, raio, ate);
  const grande = ate - de > 180 ? 1 : 0;
  return `M ${f(a.x)} ${f(a.y)} A ${raio} ${raio} 0 ${grande} 1 ${f(b.x)} ${f(b.y)}`;
}

/** Os 4 fatores que somam a nota de exposição da marca (mesmos valores das opções usados pela conta). */
export interface FatorMarca { id: "maos" | "trava" | "furo" | "ia"; rotulo: string; resposta: string | null; pontos: number; maximo: number }
const FATORES: { id: FatorMarca["id"]; rotulo: string }[] = [
  { id: "maos", rotulo: "Quem publica" },
  { id: "trava", rotulo: "O que segura o padrão" },
  { id: "furo", rotulo: "Já escapou" },
  { id: "ia", rotulo: "Regra para IA" },
];
export function fatoresMarca(respostas: Partial<Respostas>): FatorMarca[] {
  return FATORES.map(({ id, rotulo }) => {
    const opcoes = PERGUNTA_POR_ID[id].opcoes;
    const i = respostas[id];
    const op = i === undefined ? undefined : opcoes[i];
    return { id, rotulo, resposta: op?.rotulo ?? null, pontos: op?.valor ?? 0, maximo: Math.max(...opcoes.map((o) => o.valor)) };
  });
}
