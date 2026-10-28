import { describe, expect, it } from "vitest";
import { calcular } from "@/domain/calc";
import { entradasDe } from "@/domain/entradas";
import { ESTADO_INICIAL, INDICE_CALCULANDO, INDICE_CONTATO, SEQUENCIA, mostraBarra, nivelMusica, podeAvancar, progresso, quizReducer, respostasCompletas, telaAtual, type Estado } from "@/flow/quiz";

const avancar = (e: Estado) => quizReducer(e, { type: "avancar", de: e.indice });

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

describe("robustez do reducer", () => {
  it("ignora opção inválida em responder", () => {
    for (const opcao of [99, -1, 1.5, NaN]) {
      const e = quizReducer(ESTADO_INICIAL, { type: "responder", id: "quem", opcao });
      expect(e).toBe(ESTADO_INICIAL);
    }
    expect(quizReducer(ESTADO_INICIAL, { type: "responder", id: "quem", opcao: 2 }).respostas.quem).toBe(2);
  });
});

describe("integração e bordas", () => {
  it("percorre a sequência inteira só com ações válidas até a tela final", () => {
    let e: Estado = ESTADO_INICIAL;
    let guarda = 0;
    while (telaAtual(e).tipo !== "final") {
      const t = telaAtual(e);
      if (t.tipo === "perfil") {
        e = quizReducer(e, { type: "perfil", campo: "setor", valor: "Varejo" });
        e = quizReducer(e, { type: "perfil", campo: "fat", valor: "Até R$ 100 milhões" });
      } else if (t.tipo === "pergunta") {
        e = quizReducer(e, { type: "responder", id: t.id, opcao: 2 });
      } else if (t.tipo === "contato") {
        e = quizReducer(e, { type: "contato", contato: { nome: "A", email: "a@b.co", empresa: "E", cargo: "C", whatsapp: "" } });
      }
      const antes = e.indice;
      e = avancar(e);
      expect(e.indice).toBe(antes + 1);
      expect(++guarda).toBeLessThan(50);
    }
    expect(e.indice).toBe(SEQUENCIA.length - 1);
    expect(respostasCompletas(e)).toBe(true);
    expect(calcular(entradasDe(e.respostas)).teto).toBe(161200);
  });

  it("avancar com `de` desatualizado é ignorado (clique duplo na animação de saída)", () => {
    let e = avancar(ESTADO_INICIAL); // perfil
    e = quizReducer(e, { type: "perfil", campo: "setor", valor: "Varejo" });
    e = quizReducer(e, { type: "perfil", campo: "fat", valor: "Até R$ 100 milhões" });
    const de = e.indice;
    const depois = quizReducer(e, { type: "avancar", de });
    expect(depois.indice).toBe(de + 1);
    expect(quizReducer(depois, { type: "avancar", de })).toBe(depois);
    expect(quizReducer(depois, { type: "avancar", de: de + 5 })).toBe(depois);
    expect(quizReducer(depois, { type: "avancar", de: depois.indice }).indice).toBe(de + 2);
  });

  it("índices fixos de contato e calculando apontam para as telas certas", () => {
    expect(SEQUENCIA[INDICE_CONTATO].tipo).toBe("contato");
    expect(SEQUENCIA[INDICE_CALCULANDO].tipo).toBe("calculando");
    const calculando = quizReducer({ ...ESTADO_INICIAL, indice: INDICE_CALCULANDO }, { type: "avancar", de: INDICE_CALCULANDO });
    expect(telaAtual(calculando).tipo).toBe("resultado");
    expect(quizReducer(calculando, { type: "avancar", de: INDICE_CALCULANDO })).toBe(calculando);
  });

  it("avancar não passa do último índice", () => {
    const e: Estado = { ...ESTADO_INICIAL, indice: SEQUENCIA.length - 1 };
    expect(avancar(e).indice).toBe(SEQUENCIA.length - 1);
  });

  it("voltar da primeira pergunta cai no card Você sabia?", () => {
    const i = SEQUENCIA.findIndex((t) => t.tipo === "pergunta");
    const e = quizReducer({ ...ESTADO_INICIAL, indice: i }, { type: "voltar" });
    expect(telaAtual(e)).toEqual({ tipo: "vocesabia", card: 0 });
  });

  it("nível da música nos 4 cards", () => {
    const niveis = [0, 1, 2, 3].map((card) =>
      nivelMusica({ ...ESTADO_INICIAL, indice: SEQUENCIA.findIndex((t) => t.tipo === "vocesabia" && t.card === card) }),
    );
    expect(niveis).toEqual([1, 2, 3, 3]);
  });

  it("progresso.atual é -1 num card Você sabia?", () => {
    expect(progresso({ ...ESTADO_INICIAL, indice: 2 }).atual).toBe(-1);
  });

  it("respostasCompletas", () => {
    expect(respostasCompletas(ESTADO_INICIAL)).toBe(false);
    expect(respostasCompletas({ ...ESTADO_INICIAL, respostas: { quem: 0 } })).toBe(false);
  });
});
