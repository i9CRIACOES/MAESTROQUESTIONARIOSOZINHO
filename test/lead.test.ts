import { describe, expect, it, vi } from "vitest";
import { calcular } from "@/domain/calc";
import { entradasDe, type Respostas } from "@/domain/entradas";
import { verdict } from "@/domain/readings";
import { COLUNAS } from "@/data/colunas";
import { enviar, lerPendentes, linhaAtualizacao, linhaDesbloqueio, reenviarPendentes, type Deps } from "@/data/lead";

function memoria() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
}
const resp = (status: number) => (async () => new Response("{}", { status })) as unknown as typeof fetch;

const respostas = { quem: 2, pecas: 2, custo: 2, horas: 2, mont: 2, dias: 2, mult: 2, maos: 2, trava: 2, furo: 2, ia: 2 } as Respostas;
const r = calcular(entradasDe(respostas));
const contato = { nome: "Ana", email: "ana@empresa.com.br", empresa: "Empresa", cargo: "Diretora", whatsapp: "5511987654321" };
const origem = { origem: "cmp", utms: "", dispositivo: "desktop" as const };

describe("linhas", () => {
  it("desbloqueio preenche só colunas conhecidas, com números calculados", () => {
    const l = linhaDesbloqueio({ id: "abc", agora: new Date("2026-10-23T12:00:00Z"), contato, setor: "Varejo", fat: "Até R$ 100 milhões", respostas, resultado: r, veredicto: verdict(r), origem });
    Object.keys(l).forEach((k) => expect(COLUNAS).toContain(k));
    expect(l["ID"]).toBe("abc");
    expect(l["Peças/mês"]).toBe("De 51 a 150");
    expect(l["Teto"]).toBe(161200);
    expect(l["Custo/peça"]).toBe(652.63);
    expect(l["Veredicto"]).toBe("Caso fechado");
    expect(l["Farol marca"]).toBe("Exposição alta");
    expect(l).not.toHaveProperty("Pediu sessão");
    expect(l).not.toHaveProperty("Vídeo assistido (%)");
    expect(l).not.toHaveProperty("Números ajustados");
  });
  it("atualização leva só ID e o que mudou", () => {
    expect(linhaAtualizacao("abc", { pediuSessao: true, videoPct: 50 })).toEqual({ ID: "abc", "Pediu sessão": "Sim", "Vídeo assistido (%)": 50 });
  });
});

const CHAVE = "vcsabia:pendentes";
const DIA = 24 * 60 * 60 * 1000;

describe("envio", () => {
  const base = (f: typeof fetch, storage: Deps["storage"] = memoria()): Deps => ({ fetch: f, storage, url: "https://exemplo/webhook", timeoutMs: 500, esperaMs: 0 });
  const env = (id: string, extra: Record<string, string> = {}) => ({ evento: "desbloqueio" as const, linha: { ID: id, ...extra } });
  const sequencia = (...status: number[]) => {
    let i = 0;
    return vi.fn(async () => new Response("{}", { status: status[Math.min(i++, status.length - 1)] })) as unknown as typeof fetch & ReturnType<typeof vi.fn>;
  };

  it("sucesso na primeira", async () => {
    const f = vi.fn(resp(200));
    const d = base(f as unknown as typeof fetch);
    expect(await enviar(env("1"), d)).toBe(true);
    expect(f).toHaveBeenCalledTimes(1);
  });
  it("500 duas vezes → guarda na fila local", async () => {
    const f = vi.fn(resp(500));
    const d = base(f as unknown as typeof fetch);
    expect(await enviar(env("1"), d)).toBe(false);
    expect(f).toHaveBeenCalledTimes(2);
    expect(lerPendentes(d.storage)).toHaveLength(1);
  });
  it("500 e depois 200: a nova tentativa resolve, nada na fila", async () => {
    const f = sequencia(500, 200);
    const d = base(f);
    expect(await enviar(env("1"), d)).toBe(true);
    expect(f).toHaveBeenCalledTimes(2);
    expect(lerPendentes(d.storage)).toHaveLength(0);
  });
  it("429 e 408 são temporários: tentam de novo e entram na fila", async () => {
    for (const status of [429, 408]) {
      const f = sequencia(status);
      const d = base(f);
      expect(await enviar(env("1"), d)).toBe(false);
      expect(f).toHaveBeenCalledTimes(2);
      expect(lerPendentes(d.storage)).toHaveLength(1);
    }
  });
  it("400 é descartado: uma tentativa só e nada na fila", async () => {
    const f = sequencia(400);
    const d = base(f);
    expect(await enviar(env("1"), d)).toBe(false);
    expect(f).toHaveBeenCalledTimes(1);
    expect(lerPendentes(d.storage)).toHaveLength(0);
  });
  it("fetch que lança erro de rede é temporário", async () => {
    const f = vi.fn(async () => { throw new TypeError("Failed to fetch"); });
    const d = base(f as unknown as typeof fetch);
    expect(await enviar(env("1"), d)).toBe(false);
    expect(f).toHaveBeenCalledTimes(2);
    expect(lerPendentes(d.storage)).toHaveLength(1);
  });
  it("fetch que nunca responde estoura o tempo e vai para a fila", async () => {
    const f = vi.fn(() => new Promise<Response>(() => {}));
    const d = { ...base(f as unknown as typeof fetch), timeoutMs: 20 };
    expect(await enviar(env("1"), d)).toBe(false);
    expect(f).toHaveBeenCalledTimes(2);
    expect(lerPendentes(d.storage)).toHaveLength(1);
  });
  it("espera entre as tentativas (esperaMs)", async () => {
    const f = sequencia(500, 200);
    const d = { ...base(f), esperaMs: 60 };
    const t = Date.now();
    await enviar(env("1"), d);
    expect(Date.now() - t).toBeGreaterThanOrEqual(50);
  });

  it("reenvia pendentes e limpa a fila", async () => {
    const d = base(resp(500));
    await enviar(env("1"), d);
    await reenviarPendentes({ ...d, fetch: resp(200) });
    expect(lerPendentes(d.storage)).toHaveLength(0);
  });
  it("falha parcial: só os que falharam continuam na fila", async () => {
    const d = base(resp(500));
    await enviar(env("A"), d);
    await enviar(env("B"), d);
    await enviar(env("C"), d);
    const f = vi.fn(async (_u: unknown, init?: RequestInit) => {
      const id = JSON.parse(String(init?.body)).linha.ID;
      return new Response("{}", { status: id === "B" ? 500 : 200 });
    });
    await reenviarPendentes({ ...d, fetch: f as unknown as typeof fetch });
    expect(f).toHaveBeenCalledTimes(3);
    expect(lerPendentes(d.storage).map((e) => e.linha.ID)).toEqual(["B"]);
  });
  it("pendente rejeitado com 4xx sai da fila sem ficar para sempre", async () => {
    const d = base(resp(500));
    await enviar(env("A"), d);
    await reenviarPendentes({ ...d, fetch: resp(400) });
    expect(lerPendentes(d.storage)).toHaveLength(0);
  });
  it("não perde o que outra aba enfileirou durante o reenvio", async () => {
    const d = base(resp(500));
    await enviar(env("A"), d);
    const f = vi.fn(async () => {
      // outra aba grava na fila enquanto o envio de A está em andamento
      const atual = JSON.parse(d.storage.getItem(CHAVE)!);
      d.storage.setItem(CHAVE, JSON.stringify([...atual, { envio: env("Z"), quando: Date.now() }]));
      return new Response("{}", { status: 200 });
    });
    await reenviarPendentes({ ...d, fetch: f as unknown as typeof fetch });
    expect(lerPendentes(d.storage).map((e) => e.linha.ID)).toEqual(["Z"]);
  });

  it("ordem: com item pendente do mesmo ID, o novo entra atrás e não é enviado", async () => {
    const d = base(resp(500));
    await enviar(env("1", { n: "primeiro" }), d);
    const f = vi.fn(resp(200));
    expect(await enviar(env("1", { n: "segundo" }), { ...d, fetch: f as unknown as typeof fetch })).toBe(false);
    expect(f).not.toHaveBeenCalled();
    expect(lerPendentes(d.storage).map((e) => (e.linha as Record<string, string>).n)).toEqual(["primeiro", "segundo"]);
  });
  it("ordem: outro ID não espera", async () => {
    const d = base(resp(500));
    await enviar(env("1"), d);
    const f = vi.fn(resp(200));
    expect(await enviar(env("2"), { ...d, fetch: f as unknown as typeof fetch })).toBe(true);
  });
  it("ordem no reenvio: se o primeiro de um ID falha, os seguintes do mesmo ID esperam", async () => {
    const d = base(resp(500));
    await enviar(env("1", { n: "primeiro" }), d);
    await enviar(env("1", { n: "segundo" }), d);
    const f = vi.fn(resp(500));
    await reenviarPendentes({ ...d, fetch: f as unknown as typeof fetch });
    expect(f).toHaveBeenCalledTimes(1);
    expect(lerPendentes(d.storage)).toHaveLength(2);
    const ok = vi.fn(async (_u: unknown, init?: RequestInit) => { void init; return new Response("{}", { status: 200 }); });
    await reenviarPendentes({ ...d, fetch: ok as unknown as typeof fetch });
    expect(ok.mock.calls.map((c) => JSON.parse(String(c[1]?.body)).linha.n)).toEqual(["primeiro", "segundo"]);
    expect(lerPendentes(d.storage)).toHaveLength(0);
  });

  it("descarta da fila o que tem mais de 7 dias", () => {
    const s = memoria();
    s.setItem(CHAVE, JSON.stringify([
      { envio: env("velho"), quando: Date.now() - 8 * DIA },
      { envio: env("novo"), quando: Date.now() - 6 * DIA },
    ]));
    expect(lerPendentes(s).map((e) => e.linha.ID)).toEqual(["novo"]);
  });
  it("fila corrompida ou em formato antigo é ignorada", () => {
    const s = memoria();
    s.setItem(CHAVE, "{não é json");
    expect(lerPendentes(s)).toEqual([]);
    s.setItem(CHAVE, JSON.stringify([env("sem-quando"), null, 7]));
    expect(lerPendentes(s)).toEqual([]);
  });

  it("storage que lança nunca derruba o envio nem o reenvio", async () => {
    const ruim: Deps["storage"] = { getItem: () => { throw new Error("bloqueado"); }, setItem: () => { throw new Error("bloqueado"); } };
    const d = base(resp(500), ruim);
    await expect(enviar(env("1"), d)).resolves.toBe(false);
    await expect(reenviarPendentes(d)).resolves.toBeUndefined();
    expect(lerPendentes(ruim)).toEqual([]);
  });
});
