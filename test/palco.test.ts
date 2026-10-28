import { describe, expect, it } from "vitest";
import { podeCarregar3D } from "@/components/robo/regra3d";

const bom = { reduzirMovimento: false, economia: false, conexao: "4g", memoria: 8, largura: 1440 };

describe("podeCarregar3D", () => {
  it("desktop bom", () => expect(podeCarregar3D(bom)).toBe(true));
  it("celular recebe sempre a imagem, mesmo com aparelho bom", () => expect(podeCarregar3D({ ...bom, largura: 390 })).toBe(false));
  it("celular sem informação de memória e conexão (iOS) também", () => {
    expect(podeCarregar3D({ ...bom, largura: 390, conexao: undefined, memoria: undefined })).toBe(false);
  });
  it("limite em 768 px: 767 recusa, 768 aceita", () => {
    expect(podeCarregar3D({ ...bom, largura: 767 })).toBe(false);
    expect(podeCarregar3D({ ...bom, largura: 768 })).toBe(true);
  });
  it("desktop OK", () => expect(podeCarregar3D({ ...bom, largura: 1280, memoria: 8, conexao: "4g" })).toBe(true));
  it.each([
    [{ reduzirMovimento: true }],
    [{ economia: true }],
    [{ conexao: "3g" }],
    [{ conexao: "slow-2g" }],
    [{ memoria: 2 }],
  ])("recusa %j", (troca) => expect(podeCarregar3D({ ...bom, ...troca })).toBe(false));
  it("sem informação de memória e conexão, aceita", () => {
    expect(podeCarregar3D({ ...bom, conexao: undefined, memoria: undefined })).toBe(true);
  });
});
