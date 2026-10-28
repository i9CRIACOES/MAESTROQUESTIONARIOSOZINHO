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
