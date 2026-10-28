import { describe, expect, it } from "vitest";
import { calcular, type Resultado } from "@/domain/calc";
import { entradasDe, type Respostas } from "@/domain/entradas";
import * as L from "@/domain/readings";
import { barras, cascata, fatoresMarca, kpis, reguaFila, rosca, velocimetro, arco, polar } from "@/dashboard/dados";
import { combinacoes } from "./combinacoes";

const todas = (i: number) =>
  ({ quem: i, pecas: i, custo: i, horas: i, mont: i, dias: i, mult: i, maos: i, trava: i, furo: i, ia: i }) as Respostas;
const meio = calcular(entradasDe(todas(2)));
const baixo = calcular(entradasDe(todas(0)));
const amostra: Resultado[] = combinacoes().filter((_, i) => i % 37 === 0).map((c) => calcular(entradasDe(c as Respostas)));

describe("kpis", () => {
  it("seis indicadores, na ordem do spec, com o teto em destaque", () => {
    const k = kpis(meio);
    expect(k.map((x) => x.chave)).toEqual(["teto", "piso", "custoPeca", "custoHora", "horasMont", "pessoas"]);
    expect(k.filter((x) => x.destaque).map((x) => x.chave)).toEqual(["teto"]);
  });
  it("valores saem do resultado, sem conta nova", () => {
    const k = Object.fromEntries(kpis(meio).map((x) => [x.chave, x.valor]));
    expect(k).toEqual({
      teto: meio.teto, piso: meio.piso, custoPeca: meio.custoPeca, custoHora: meio.custoHora,
      horasMont: meio.horasMont, pessoas: meio.pessoas,
    });
  });
});

describe("rosca montagem × criação", () => {
  it("montagem = piso, criação = custo − piso, frações somam 1", () => {
    const s = rosca(meio);
    expect(s.total).toBe(meio.custo);
    expect(s.segmentos[0]).toMatchObject({ chave: "montagem", valor: meio.piso, inicio: 0 });
    expect(s.segmentos[1]).toMatchObject({ chave: "criacao", valor: meio.custo - meio.piso });
    expect(s.segmentos[0].frac).toBeCloseTo(meio.mont);
    expect(s.segmentos[0].fim).toBeCloseTo(s.segmentos[1].inicio);
    expect(s.segmentos[1].fim).toBeCloseTo(1);
  });
  it("frações sempre entre 0 e 1 em toda a amostra", () => {
    for (const r of amostra) for (const g of rosca(r).segmentos) {
      expect(g.frac).toBeGreaterThanOrEqual(0);
      expect(g.frac).toBeLessThanOrEqual(1);
    }
  });
});

describe("cascata piso + peças que faltam = teto", () => {
  it("três degraus encadeados", () => {
    const c = cascata(meio);
    expect(c.passos.map((p) => p.chave)).toEqual(["piso", "gap", "teto"]);
    const [p, g, t] = c.passos;
    expect([p.base, p.topo]).toEqual([0, meio.piso]);
    expect(g.base).toBe(meio.piso);
    expect(g.topo).toBeCloseTo(meio.teto);
    expect(g.valor).toBe(meio.custoGap);
    expect([t.base, t.topo, t.valor]).toEqual([0, meio.teto, meio.teto]);
    expect(c.max).toBe(meio.teto);
  });
  it("sem ambição (mult 1) o degrau do meio é zero e teto = piso", () => {
    const c = cascata(baixo);
    expect(baixo.mult).toBe(1);
    expect(c.passos[1].valor).toBe(0);
    expect(c.passos[2].topo).toBe(c.passos[0].topo);
  });
  it("max nunca é zero (evita divisão por zero no desenho)", () => {
    const zerado = { ...baixo, piso: 0, custoGap: 0, teto: 0 };
    expect(cascata(zerado).max).toBeGreaterThan(0);
  });
});

describe("barras teto × mensalidade", () => {
  it("valores, escala comum e o destaque da relação", () => {
    const b = barras(meio);
    expect(b.itens.map((i) => [i.chave, i.valor])).toEqual([["teto", meio.teto], ["preco", meio.preco]]);
    const max = Math.max(meio.teto, meio.preco);
    expect(b.itens[0].frac).toBeCloseTo(meio.teto / max);
    expect(b.itens[1].frac).toBeCloseTo(meio.preco / max);
    expect(b.destaque).toBe(L.relacao(meio).destaque);
  });
  it("no caso vermelho a mensalidade é a barra cheia", () => {
    const b = barras(baixo);
    expect(baixo.teto).toBeLessThan(baixo.preco);
    expect(b.itens[1].frac).toBe(1);
    expect(b.vence).toBe("preco");
  });
  it("mensalidade zero não quebra", () => {
    const b = barras({ ...meio, preco: 0 });
    expect(b.itens[1].frac).toBe(0);
    expect(b.vence).toBe("teto");
  });
});

describe("velocímetro da marca", () => {
  it("ângulo de -90 (0) a +90 (100)", () => {
    expect(velocimetro({ ...meio, marca: 0 }).angulo).toBe(-90);
    expect(velocimetro({ ...meio, marca: 50 }).angulo).toBe(0);
    expect(velocimetro({ ...meio, marca: 100 }).angulo).toBe(90);
    expect(velocimetro({ ...meio, marca: 140 }).angulo).toBe(90);
  });
  it("zonas <35, <60, ≥60 batem com o nível do resultado", () => {
    const v = velocimetro(meio);
    expect(v.zonas.map((z) => [z.de, z.ate, z.nivel])).toEqual([[0, 35, "ok"], [35, 60, "warn"], [60, 100, "err"]]);
    for (const r of amostra) {
      const z = velocimetro(r).zona;
      expect(z.nivel).toBe(r.m.k);
      expect(z.lvl).toBe(r.m.lvl);
    }
  });
});

describe("régua da fila", () => {
  it("marcas em 6 e 11 dias úteis, posição proporcional", () => {
    const f = reguaFila(meio);
    expect(f.marcas.map((m) => m.dias)).toEqual([6, 11]);
    expect(f.dias).toBe(meio.dias);
    expect(f.pos).toBeCloseTo(meio.dias / f.max);
    for (const m of f.marcas) expect(m.pos).toBeCloseTo(m.dias / f.max);
  });
  it("escala sempre cabe o valor do usuário e as duas marcas", () => {
    for (const r of [...amostra, { ...meio, dias: 25 }, { ...meio, dias: 400 }]) {
      const f = reguaFila(r);
      expect(f.max).toBeGreaterThanOrEqual(Math.max(11, r.dias));
      expect(f.pos).toBeLessThanOrEqual(1);
    }
  });
  it("faixa segue os mesmos cortes do filaText", () => {
    expect(reguaFila({ ...meio, dias: 4 }).nivel).toBe("ok");
    expect(reguaFila({ ...meio, dias: 6 }).nivel).toBe("warn");
    expect(reguaFila({ ...meio, dias: 10.5 }).nivel).toBe("warn");
    expect(reguaFila({ ...meio, dias: 11 }).nivel).toBe("err");
  });
});

describe("geometria", () => {
  it("polar: 0° aponta para cima", () => {
    const p = polar(50, 50, 10, 0);
    expect(p.x).toBeCloseTo(50);
    expect(p.y).toBeCloseTo(40);
  });
  it("arco gera path SVG válido", () => {
    expect(arco(50, 50, 40, -90, 90)).toMatch(/^M [\d.]+ [\d.]+ A 40 40 0 0 1 [\d.]+ [\d.]+$/);
    expect(arco(50, 50, 40, 0, 270)).toContain(" 0 1 1 ");
  });
});

describe("fatoresMarca", () => {
  it("devolve os 4 fatores com pontos e máximo, somando a nota da marca", () => {
    const f = fatoresMarca({ maos: 1, trava: 3, furo: 0, ia: 2 });
    expect(f.map((x) => x.id)).toEqual(["maos", "trava", "furo", "ia"]);
    expect(f.map((x) => x.pontos)).toEqual([25, 30, 20, 10]);
    expect(f.map((x) => x.maximo)).toEqual([40, 30, 20, 10]);
    expect(f[0].resposta).toBe("De 4 a 10");
  });
  it("fator sem resposta vale zero", () => {
    const f = fatoresMarca({});
    expect(f.every((x) => x.pontos === 0 && x.resposta === null)).toBe(true);
  });
});
