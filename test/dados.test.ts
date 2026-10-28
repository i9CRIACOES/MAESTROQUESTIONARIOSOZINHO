import { describe, expect, it } from "vitest";
import { COLUNAS } from "@/data/colunas";
import { validarContato } from "@/data/contato";
import { lerOrigem } from "@/data/origem";

describe("colunas", () => {
  it("36 colunas, ID e Nome presentes, sem repetição", () => {
    expect(COLUNAS).toHaveLength(36);
    expect(new Set(COLUNAS).size).toBe(36);
    expect(COLUNAS[1]).toBe("ID");
  });
});

describe("origem", () => {
  it("lê ?o= e UTMs", () => {
    const o = lerOrigem("?o=cmp-nc&utm_source=linkedin&utm_campaign=lancamento", false);
    expect(o).toEqual({ origem: "cmp-nc", utms: "utm_source=linkedin; utm_campaign=lancamento", dispositivo: "desktop" });
  });
  it("sem parâmetros", () => {
    expect(lerOrigem("", true)).toEqual({ origem: "", utms: "", dispositivo: "celular" });
  });
});

describe("contato", () => {
  const ok = { nome: " Ana ", email: "ANA@Empresa.com.br", empresa: "Empresa", cargo: "Diretora", whatsapp: "+55 (11) 98765-4321" };
  it("aceita e normaliza", () => {
    expect(validarContato(ok)).toEqual({ ok: true, contato: { nome: "Ana", email: "ana@empresa.com.br", empresa: "Empresa", cargo: "Diretora", whatsapp: "5511987654321" } });
  });
  it("WhatsApp é opcional", () => {
    const r = validarContato({ ...ok, whatsapp: "" });
    expect(r.ok && r.contato.whatsapp).toBe("");
  });
  it.each([
    [{ ...ok, nome: "" }, "nome", "Informe seu nome."],
    [{ ...ok, email: "ana@" }, "email", "Informe um e-mail corporativo válido."],
    [{ ...ok, empresa: " " }, "empresa", "Informe a empresa."],
    [{ ...ok, cargo: "" }, "cargo", "Informe seu cargo."],
    [{ ...ok, whatsapp: "123" }, "whatsapp", "Confira o WhatsApp (DDD + número)."],
  ])("recusa %#", (entrada, campo, mensagem) => {
    expect(validarContato(entrada)).toEqual({ ok: false, campo, mensagem });
  });
});
