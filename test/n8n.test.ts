import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { COLUNAS } from "@/data/colunas";

const ler = (arq: string) => readFileSync(new URL(`../n8n/${arq}`, import.meta.url), "utf8");

describe("n8n", () => {
  // O workflow principal importa COLS de sanitizar.mjs; a manutenção mantém a lista literal.
  it.each(["sanitizar.mjs", "manutencao.workflow.js"])("%s usa as mesmas 36 colunas", (arq) => {
    const m = ler(arq).match(/const COLS = (\[.*?\]);/s);
    expect(m).not.toBeNull();
    expect(JSON.parse(m![1])).toEqual([...COLUNAS]);
  });

  it("workflow principal injeta o sanitizar.mjs e roteia as 4 ações", () => {
    const w = ler("vc-sabia-maestro.workflow.js");
    expect(w).toContain("import { sanitizar, COLS } from './sanitizar.mjs'");
    expect(w).not.toMatch(/const COLS = \[/);
    const ordem = [...w.matchAll(/regra\('(\w+)'\)/g)].map((x) => x[1]);
    expect(ordem).toEqual(["gravar", "atualizar", "ignorar", "rejeitar"]);
    expect(w).toContain("operation: 'appendOrUpdate'");
    expect(w).toContain("operation: 'update'");
  });
});
