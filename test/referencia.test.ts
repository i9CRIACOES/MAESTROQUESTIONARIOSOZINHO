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
