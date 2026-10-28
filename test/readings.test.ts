import { describe, expect, it } from "vitest";
import { calcular } from "@/domain/calc";
import { entradasDe, type Respostas } from "@/domain/entradas";
import * as L from "@/domain/readings";
import { brl } from "@/domain/format";
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
    expect(c.hora).toBe("R$ 62.000 ÷ (95 × 8 h) = R$ 82 por hora");
  });
  it("texto da régua e rótulo da montagem (plural)", () => {
    expect(L.recursoTexto(r)).toBe(
      "Na régua de R$ 25.000 por recurso alocado, isso equivale a 6,4 pessoas dedicadas em tempo integral. Ajuste esse valor abaixo se na sua empresa ele for outro.",
    );
    expect(L.montagemRotulo(r)).toBe("horas por mês em montagem e versionamento — 2,7 pessoas em tempo integral");
  });
});

describe("ramos que o caso de conferência não cobre (tudo no índice 0)", () => {
  const zero = { quem: 0, pecas: 0, custo: 0, horas: 0, mont: 0, dias: 0, mult: 0, maos: 0, trava: 0, furo: 0, ia: 0 } as Respostas;
  const r = calcular(entradasDe(zero));

  it("teto abaixo da mensalidade: relação mostra o preço", () => {
    expect(r.teto).toBeLessThan(r.preco);
    const rel = L.relacao(r);
    expect(rel.destaque).toBe(brl(r.preco));
    expect(rel.html).toContain("menor do que isso");
  });
  it("mult == 1: teto e piso são o mesmo número", () => {
    expect(L.tetoExp(r)).toBe("Você disse que manteria o volume de hoje. Sem gap de capacidade, teto e piso são o mesmo número.");
  });
  it("singular quando recursos e pessoas <= 1", () => {
    expect(r.recursos).toBeLessThanOrEqual(1);
    expect(r.pessoas).toBeLessThanOrEqual(1);
    const rec = L.contas(r).rec;
    expect(rec).toMatch(/ pessoa$/);
    expect(rec).not.toContain("pessoas");
    const rt = L.recursoTexto(r);
    expect(rt).toContain(" pessoa dedicada ");
    expect(rt).not.toMatch(/pessoas|dedicadas/);
    const ml = L.montagemRotulo(r);
    expect(ml).toMatch(/ pessoa em tempo integral$/);
    expect(ml).not.toContain("pessoas");
  });
});
