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

  it("entradasDe recusa opção fora do intervalo", () => {
    const ok = { quem: 0, pecas: 0, custo: 0, horas: 0, mont: 0, dias: 0, mult: 0, maos: 0, trava: 0, furo: 0, ia: 0 } as Respostas;
    expect(() => entradasDe({ ...ok, pecas: 99 })).toThrow(/opção inválida: 99/);
  });
});
