import { describe, expect, it } from "vitest";
import { COLUNAS } from "@/data/colunas";
import { COLS, sanitizar } from "../n8n/sanitizar.mjs";

const ID = "3f2b8c1e-9d4a-4e7b-8a21-5c6d7e8f9a0b";
const base = { ID, Nome: "Ana", "E-mail": "ana@empresa.com.br", Empresa: "Empresa", Cargo: "Diretora", WhatsApp: "5511987654321" };
const desb = (linha: Record<string, unknown>) => sanitizar({ evento: "desbloqueio", linha });
const atual = (linha: Record<string, unknown>) => sanitizar({ evento: "atualizacao", linha });

describe("sanitizar · comum", () => {
  it("COLS é a lista do front", () => expect(COLS).toEqual([...COLUNAS]));
  it("honeypot → ignorar", () => expect(sanitizar({ site: "http://spam", evento: "desbloqueio", linha: base })).toEqual({ _acao: "ignorar" }));
  it("corpo vazio ou evento inválido → rejeitar", () => {
    expect(sanitizar({})).toEqual({ _acao: "rejeitar" });
    expect(sanitizar(undefined)).toEqual({ _acao: "rejeitar" });
    expect(sanitizar({ evento: "outro", linha: base })).toEqual({ _acao: "rejeitar" });
  });
  it.each([[undefined], [""], ["   "], ["abc"], ["3f2b8c1e-9d4a-4e7b-8a21-5c6d7e8f9a0"], [123]])("ID inválido %j → rejeitar", (id) => {
    expect(desb({ ...base, ID: id })).toEqual({ _acao: "rejeitar" });
    expect(atual({ ID: id, "Pediu sessão": "Sim" })).toEqual({ _acao: "rejeitar" });
  });
  it("ID é aparado e aceito em maiúsculas", () => {
    expect(desb({ ...base, ID: `  ${ID.toUpperCase()} ` }).ID).toBe(ID.toUpperCase());
  });
});

describe("sanitizar · desbloqueio", () => {
  it("grava com colunas conhecidas", () => {
    const r = desb(base);
    expect(r._acao).toBe("gravar");
    expect(r.Nome).toBe("Ana");
  });
  it("sem nome ou e-mail ruim → rejeitar", () => {
    expect(desb({ ...base, Nome: " " })).toEqual({ _acao: "rejeitar" });
    expect(desb({ ...base, "E-mail": "ana@" })).toEqual({ _acao: "rejeitar" });
    expect(desb({ ...base, "E-mail": undefined })).toEqual({ _acao: "rejeitar" });
  });
  it("descarta colunas desconhecidas", () => {
    const r = desb({ ...base, Invasora: "x", __proto__x: "y" });
    expect(Object.keys(r).filter((k) => k !== "_acao").every((k) => (COLS as string[]).includes(k))).toBe(true);
    expect(r).not.toHaveProperty("Invasora");
  });
  it("corta textos em 500 e mantém números finitos", () => {
    const r = desb({ ...base, Empresa: "x".repeat(900), Teto: 161200, Piso: Infinity });
    expect(String(r.Empresa)).toHaveLength(500);
    expect(r.Teto).toBe(161200);
    expect(r.Piso).toBe("");
  });
  it.each(["=1+1", "+1", "-1", "@SOMA(A1)", "\t=1", "\r=1"])("protege contra fórmula: %j", (v) => {
    const r = desb({ ...base, Empresa: v, Cargo: ` ${v}` });
    expect(String(r.Empresa).startsWith("'")).toBe(true);
    expect(String(r.Empresa).length).toBeLessThanOrEqual(500);
  });
  it("'=1+1 vira '=1+1", () => expect(desb({ ...base, Empresa: "=1+1" }).Empresa).toBe("'=1+1"));
  it("não mexe em texto normal", () => expect(desb({ ...base, Empresa: "Empresa 1+1" }).Empresa).toBe("Empresa 1+1"));
  it("WhatsApp: só dígitos, até 15", () => {
    expect(desb({ ...base, WhatsApp: "+55 (11) 98765-4321" }).WhatsApp).toBe("5511987654321");
    expect(desb({ ...base, WhatsApp: "1".repeat(30) }).WhatsApp).toBe("1".repeat(15));
  });
  it("Data/hora vem do servidor", () => {
    const antes = Date.now();
    const r = desb({ ...base, "Data/hora": "1999-01-01" });
    const t = Date.parse(String(r["Data/hora"]));
    expect(t).toBeGreaterThanOrEqual(antes - 1000);
    expect(t).toBeLessThanOrEqual(Date.now() + 1000);
  });
});

describe("sanitizar · atualização", () => {
  it("mantém só os 3 campos, validados", () => {
    const r = atual({ ID, "Pediu sessão": "Sim", "Vídeo assistido (%)": 50, "Números ajustados": '{"pecas":10}', Nome: "Hack", Teto: 1 });
    expect(r).toEqual({ _acao: "atualizar", ID, "Pediu sessão": "Sim", "Vídeo assistido (%)": 50, "Números ajustados": '{"pecas":10}' });
  });
  it("descarta valores inválidos de cada campo", () => {
    expect(atual({ ID, "Pediu sessão": "Talvez", "Vídeo assistido (%)": 50 })).toEqual({ _acao: "atualizar", ID, "Vídeo assistido (%)": 50 });
    expect(atual({ ID, "Pediu sessão": "Não", "Vídeo assistido (%)": 101 })).toEqual({ _acao: "atualizar", ID, "Pediu sessão": "Não" });
    expect(atual({ ID, "Pediu sessão": "Sim", "Vídeo assistido (%)": -1 })).toEqual({ _acao: "atualizar", ID, "Pediu sessão": "Sim" });
    expect(atual({ ID, "Pediu sessão": "Sim", "Vídeo assistido (%)": NaN })).toEqual({ _acao: "atualizar", ID, "Pediu sessão": "Sim" });
    expect(atual({ ID, "Pediu sessão": "Sim", "Vídeo assistido (%)": "50" })).toEqual({ _acao: "atualizar", ID, "Pediu sessão": "Sim" });
  });
  it("0 e 100 são válidos", () => {
    expect(atual({ ID, "Vídeo assistido (%)": 0 })["Vídeo assistido (%)"]).toBe(0);
    expect(atual({ ID, "Vídeo assistido (%)": 100 })["Vídeo assistido (%)"]).toBe(100);
  });
  it("Números ajustados: texto até 500", () => {
    expect(String(atual({ ID, "Números ajustados": "x".repeat(900) })["Números ajustados"])).toHaveLength(500);
  });
  it("nenhum campo válido → rejeitar", () => {
    expect(atual({ ID })).toEqual({ _acao: "rejeitar" });
    expect(atual({ ID, Nome: "x", "Pediu sessão": "Talvez", "Vídeo assistido (%)": 300 })).toEqual({ _acao: "rejeitar" });
  });
  it("não exige nome nem e-mail e não mexe em Data/hora", () => {
    expect(atual({ ID, "Pediu sessão": "Sim" })).not.toHaveProperty("Data/hora");
  });
});

describe("sanitizar · isolado no Code node", () => {
  it("o código gerado roda só com COLS e $input", () => {
    const codigo = `const COLS = ${JSON.stringify(COLS)};\n${sanitizar.toString()}\nreturn [{ json: sanitizar($input.first().json.body || {}) }];`;
    const rodar = new Function("$input", codigo) as (i: unknown) => { json: Record<string, unknown> }[];
    const out = rodar({ first: () => ({ json: { body: { evento: "desbloqueio", linha: base } } }) });
    expect(out[0].json._acao).toBe("gravar");
    expect(out[0].json.ID).toBe(ID);
  });
});
