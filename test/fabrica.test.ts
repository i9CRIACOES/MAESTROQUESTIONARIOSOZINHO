import { describe, expect, it } from "vitest";
import { VOCE_SABIA } from "@/domain/conteudo";
import { PERGUNTAS } from "@/domain/steps";
import { partesDoNumero } from "@/fabrica/numero";
import {
  ESTACOES, ESTADO_INICIAL, INDICE_CALCULANDO, INDICE_CONTATO, SEQUENCIA, conquistaNova, estacaoFeita, idDaSecao, indiceDaEstacao,
  nivelDaSecao, numeroDaEstacao, quizReducer, respostasTravadas, secaoDesbloqueada, type Estado,
} from "@/flow/quiz";

const CONTATO = { nome: "A", email: "a@b.co", empresa: "E", cargo: "C", whatsapp: "" };
const comPerfil: Estado = { ...ESTADO_INICIAL, setor: "Varejo", fat: "Até R$ 100 milhões" };
const tudoRespondido: Estado = { ...comPerfil, respostas: Object.fromEntries(PERGUNTAS.map((q) => [q.id, 0])) };

describe("estações da fábrica", () => {
  it("são 12, recepção primeiro, na ordem das perguntas", () => {
    expect(ESTACOES).toHaveLength(12);
    expect(ESTACOES[0]).toBe("perfil");
    expect(ESTACOES.slice(1)).toEqual(PERGUNTAS.map((q) => q.id));
    expect(numeroDaEstacao("perfil")).toBe(1);
    expect(numeroDaEstacao("ia")).toBe(12);
  });

  it("recepção só conta feita com setor e faturamento", () => {
    expect(estacaoFeita(ESTADO_INICIAL, "perfil")).toBe(false);
    expect(estacaoFeita({ ...ESTADO_INICIAL, setor: "Varejo" }, "perfil")).toBe(false);
    expect(estacaoFeita(comPerfil, "perfil")).toBe(true);
  });

  it("indiceDaEstacao aponta para a seção certa da SEQUENCIA", () => {
    expect(SEQUENCIA[indiceDaEstacao("perfil")].tipo).toBe("perfil");
    for (const q of PERGUNTAS) expect(SEQUENCIA[indiceDaEstacao(q.id)]).toEqual({ tipo: "pergunta", id: q.id });
  });
});

describe("trancas da página", () => {
  it("portão e recepção começam abertos; o resto trancado", () => {
    expect(secaoDesbloqueada(ESTADO_INICIAL, 0)).toBe(true);
    expect(secaoDesbloqueada(ESTADO_INICIAL, indiceDaEstacao("perfil"))).toBe(true);
    expect(secaoDesbloqueada(ESTADO_INICIAL, indiceDaEstacao("quem"))).toBe(false);
    expect(secaoDesbloqueada(ESTADO_INICIAL, 2)).toBe(false); // primeiro "Você sabia?"
  });

  it("cada estação abre só quando a anterior foi respondida", () => {
    let e = comPerfil;
    expect(secaoDesbloqueada(e, indiceDaEstacao("quem"))).toBe(true);
    expect(secaoDesbloqueada(e, indiceDaEstacao("pecas"))).toBe(false);
    e = quizReducer(e, { type: "responder", id: "quem", opcao: 1 });
    expect(secaoDesbloqueada(e, indiceDaEstacao("pecas"))).toBe(true);
    expect(secaoDesbloqueada(e, indiceDaEstacao("custo"))).toBe(false);
  });

  it("pular uma estação não libera as seguintes", () => {
    const e: Estado = { ...comPerfil, respostas: { quem: 0, custo: 1 } };
    expect(secaoDesbloqueada(e, indiceDaEstacao("horas"))).toBe(false);
  });

  it("cofre abre com as 12 estações; painel e expedição só depois do contato", () => {
    expect(secaoDesbloqueada(tudoRespondido, INDICE_CONTATO)).toBe(true);
    expect(secaoDesbloqueada(tudoRespondido, INDICE_CALCULANDO)).toBe(false);
    const comContato = quizReducer(tudoRespondido, { type: "contato", contato: CONTATO });
    expect(secaoDesbloqueada(comContato, INDICE_CALCULANDO)).toBe(true);
    expect(secaoDesbloqueada(comContato, SEQUENCIA.length - 1)).toBe(true);
  });

  it("índices fora da página nunca estão liberados", () => {
    expect(secaoDesbloqueada(tudoRespondido, -1)).toBe(false);
    expect(secaoDesbloqueada(tudoRespondido, SEQUENCIA.length)).toBe(false);
  });

  it("respostas travam depois do contato", () => {
    expect(respostasTravadas(tudoRespondido)).toBe(false);
    expect(respostasTravadas({ ...tudoRespondido, contato: CONTATO })).toBe(true);
  });
});

describe("conquistas", () => {
  it("recepção ao completar o perfil", () => {
    const antes = { ...ESTADO_INICIAL, setor: "Varejo" };
    expect(conquistaNova(antes, comPerfil)).toBe("recepcao");
    expect(conquistaNova(comPerfil, comPerfil)).toBeNull();
  });

  it("operação ao responder a última pergunta da fase 1, marca ao responder a última da fase 2", () => {
    const op = PERGUNTAS.filter((q) => q.fase === "operacao");
    const quase: Estado = { ...comPerfil, respostas: Object.fromEntries(op.slice(0, -1).map((q) => [q.id, 0])) };
    const feito = quizReducer(quase, { type: "responder", id: op[op.length - 1].id, opcao: 0 });
    expect(conquistaNova(quase, feito)).toBe("operacao");

    const semIa: Estado = { ...tudoRespondido, respostas: { ...tudoRespondido.respostas, ia: undefined } };
    expect(conquistaNova(semIa, tudoRespondido)).toBe("marca");
  });

  it("trocar uma resposta já dada não repete a conquista", () => {
    const trocado = quizReducer(tudoRespondido, { type: "responder", id: "ia", opcao: 2 });
    expect(conquistaNova(tudoRespondido, trocado)).toBeNull();
  });
});

describe("âncoras e números dos letreiros", () => {
  it("cada seção tem um id; só o cofre é compartilhado (o cálculo acontece dentro dele)", () => {
    const ids = SEQUENCIA.map(idDaSecao);
    expect(ids[0]).toBe("portao");
    expect(ids[INDICE_CONTATO]).toBe("cofre");
    expect(ids[INDICE_CALCULANDO]).toBe("cofre");
    expect(new Set(ids).size).toBe(SEQUENCIA.length - 1);
    expect(ids.at(-1)).toBe("expedicao");
  });

  it("partesDoNumero separa prefixo, número e sufixo dos 4 cards", () => {
    expect(VOCE_SABIA.map((c) => partesDoNumero(c.numero))).toEqual([
      { antes: "", n: 3.6, casas: 1, depois: "%" },
      { antes: "", n: 78, casas: 0, depois: "%" },
      { antes: "", n: 72.1, casas: 1, depois: "%" },
      { antes: "<", n: 10, casas: 0, depois: "%" },
    ]);
    expect(partesDoNumero("sem número")).toBeNull();
  });
});

describe("trilha por seção", () => {
  it("segue a régua da v1: portão mudo, recepção 1, operação 2, marca 3, cofre e painel 4, expedição muda", () => {
    expect(nivelDaSecao(ESTADO_INICIAL, 0)).toBe(0);
    expect(nivelDaSecao(ESTADO_INICIAL, indiceDaEstacao("perfil"))).toBe(1);
    expect(nivelDaSecao(ESTADO_INICIAL, indiceDaEstacao("custo"))).toBe(2);
    expect(nivelDaSecao(ESTADO_INICIAL, indiceDaEstacao("trava"))).toBe(3);
    expect(nivelDaSecao(ESTADO_INICIAL, INDICE_CONTATO)).toBe(4);
    expect(nivelDaSecao(ESTADO_INICIAL, SEQUENCIA.length - 1)).toBe(0);
  });

  it("índice fora da faixa é preso às pontas", () => {
    expect(nivelDaSecao(ESTADO_INICIAL, -3)).toBe(0);
    expect(nivelDaSecao(ESTADO_INICIAL, 999)).toBe(0);
  });
});
