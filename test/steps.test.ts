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
