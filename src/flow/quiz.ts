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
  | { type: "avancar"; de: number }
  | { type: "voltar" }
  | { type: "responder"; id: StepId; opcao: number }
  | { type: "perfil"; campo: "setor" | "fat"; valor: string }
  | { type: "contato"; contato: Contato };

export const ESTADO_INICIAL: Estado = { indice: 0, respostas: {}, setor: "", fat: "", contato: null };

export const INDICE_CALCULANDO = SEQUENCIA.findIndex((t) => t.tipo === "calculando");
export const INDICE_CONTATO = SEQUENCIA.findIndex((t) => t.tipo === "contato");

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
      // `de` = tela de onde o clique saiu: durante a animação de saída a tela antiga ainda recebe clique.
      if (a.de !== e.indice) return e;
      return podeAvancar(e) ? { ...e, indice: Math.min(e.indice + 1, SEQUENCIA.length - 1) } : e;
    case "voltar":
      return VOLTAVEL.includes(telaAtual(e).tipo) && e.indice > 1 ? { ...e, indice: e.indice - 1 } : e;
    case "responder": {
      const n = PERGUNTA_POR_ID[a.id].opcoes.length;
      if (!Number.isInteger(a.opcao) || a.opcao < 0 || a.opcao >= n) return e;
      return { ...e, respostas: { ...e.respostas, [a.id]: a.opcao } };
    }
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
  const total = PERGUNTAS.length + 1;
  return { feitos, total, percentual: Math.round((feitos / total) * 100), atual };
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

// ——— v2 "A Fábrica de Peças": página de rolagem única. ———
// A SEQUENCIA continua sendo a ordem das seções na página; o que muda é que nada "avança":
// cada seção fica trancada até as anteriores estarem feitas.

/** As 12 estações que contam no progresso: a recepção (perfil) e as 11 perguntas. */
export type Estacao = "perfil" | StepId;
export const ESTACOES: Estacao[] = ["perfil", ...PERGUNTAS.map((q) => q.id)];

/** Número da estação (1 a 12) para o rótulo "Estação N de 12". */
export function numeroDaEstacao(s: Estacao): number {
  return ESTACOES.indexOf(s) + 1;
}

export function estacaoFeita(e: Estado, s: Estacao): boolean {
  return s === "perfil" ? !!e.setor && !!e.fat : e.respostas[s] !== undefined;
}

/** A tela já foi cumprida? (Telas só de leitura contam como cumpridas.) */
export function telaFeita(e: Estado, t: Tela): boolean {
  switch (t.tipo) {
    case "perfil": return estacaoFeita(e, "perfil");
    case "pergunta": return estacaoFeita(e, t.id);
    case "contato": return e.contato !== null;
    default: return true;
  }
}

/** Uma seção da página está liberada quando todas as anteriores na SEQUENCIA estão cumpridas. */
export function secaoDesbloqueada(e: Estado, indice: number): boolean {
  if (indice < 0 || indice >= SEQUENCIA.length) return false;
  return SEQUENCIA.slice(0, indice).every((t) => telaFeita(e, t));
}

export function indiceDaEstacao(s: Estacao): number {
  return SEQUENCIA.findIndex((t) => (s === "perfil" ? t.tipo === "perfil" : t.tipo === "pergunta" && t.id === s));
}

/** Depois do contato enviado, as respostas ficam travadas: o lead já foi gravado com elas. */
export function respostasTravadas(e: Estado): boolean {
  return e.contato !== null;
}

export type Conquista = "recepcao" | "operacao" | "marca";

const ESTACOES_DA_FASE: Record<Conquista, Estacao[]> = {
  recepcao: ["perfil"],
  operacao: PERGUNTAS.filter((q) => q.fase === "operacao").map((q) => q.id),
  marca: PERGUNTAS.filter((q) => q.fase === "marca").map((q) => q.id),
};

/** Fase que acabou de ser concluída na transição `antes` → `depois` (para o aviso de conquista). */
export function conquistaNova(antes: Estado, depois: Estado): Conquista | null {
  for (const c of ["recepcao", "operacao", "marca"] as Conquista[]) {
    const completa = (e: Estado) => ESTACOES_DA_FASE[c].every((s) => estacaoFeita(e, s));
    if (!completa(antes) && completa(depois)) return c;
  }
  return null;
}

/** id do elemento da seção na página (âncora da rolagem automática). "calculando" acontece dentro do cofre. */
export function idDaSecao(t: Tela): string {
  switch (t.tipo) {
    case "intro": return "portao";
    case "perfil": return "estacao-perfil";
    case "pergunta": return `estacao-${t.id}`;
    case "vocesabia": return `letreiro-${t.card}`;
    case "contato":
    case "calculando": return "cofre";
    case "resultado": return "painel";
    case "final": return "expedicao";
  }
}

/** Nível da trilha para a seção que está na tela (mesma régua da v1). */
export function nivelDaSecao(e: Estado, indice: number): number {
  return nivelMusica({ ...e, indice: Math.max(0, Math.min(indice, SEQUENCIA.length - 1)) });
}
