import type { Resultado } from "@/domain/calc";
import type { Ajustes, Respostas } from "@/domain/entradas";
import type { Veredicto } from "@/domain/readings";
import { PERGUNTA_POR_ID, type StepId } from "@/domain/steps";
import type { Contato } from "@/flow/quiz";
import { armazenamentoSeguro } from "./armazenamento";
import type { Coluna } from "./colunas";
import type { Origem } from "./origem";

export const WEBHOOK_URL = import.meta.env.VITE_WEBHOOK_URL ?? "/api/lead.php";

export type Linha = Partial<Record<Coluna, string | number>>;
export interface Envio { evento: "desbloqueio" | "atualizacao"; linha: Linha }
export interface Deps { fetch: typeof fetch; storage: Pick<Storage, "getItem" | "setItem">; url: string; timeoutMs?: number; esperaMs?: number }

const CHAVE = "vcsabia:pendentes";
const VALIDADE_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_FILA = 20;
const dois = (n: number) => Math.round(n * 100) / 100;

interface Pendente { envio: Envio; quando: number }

export function linhaDesbloqueio(a: {
  id: string; agora: Date; contato: Contato; setor: string; fat: string; respostas: Respostas;
  resultado: Resultado; veredicto: Veredicto; origem: Origem;
}): Linha {
  const rot = (id: StepId) => PERGUNTA_POR_ID[id].opcoes[a.respostas[id]!].rotulo;
  const r = a.resultado;
  return {
    "Data/hora": a.agora.toISOString(),
    ID: a.id,
    Nome: a.contato.nome,
    "E-mail": a.contato.email,
    Empresa: a.contato.empresa,
    Cargo: a.contato.cargo,
    WhatsApp: a.contato.whatsapp,
    Setor: a.setor,
    Faturamento: a.fat,
    "Quem produz": rot("quem"),
    "Peças/mês": rot("pecas"),
    "Custo da estrutura": rot("custo"),
    "Horas/peça": rot("horas"),
    "% montagem": rot("mont"),
    "Dias de fila": rot("dias"),
    "Peças sem fila": rot("mult"),
    "Mãos que publicam": rot("maos"),
    "O que trava": rot("trava"),
    "Já escapou": rot("furo"),
    "Posição sobre IA": rot("ia"),
    "Custo/peça": dois(r.custoPeca),
    "Custo/hora": dois(r.custoHora),
    "Horas de montagem/mês": dois(r.horasMont),
    Piso: dois(r.piso),
    Teto: dois(r.teto),
    "Recursos equivalentes": dois(r.recursos),
    "Farol dinheiro": r.f.t,
    "Score marca": r.marca,
    "Farol marca": r.m.t,
    Veredicto: a.veredicto.lamp,
    "Origem (?o=)": a.origem.origem,
    UTMs: a.origem.utms,
    Dispositivo: a.origem.dispositivo,
  };
}

export function linhaAtualizacao(id: string, m: { pediuSessao?: boolean; videoPct?: number; ajustes?: Ajustes }): Linha {
  const l: Linha = { ID: id };
  if (m.pediuSessao) l["Pediu sessão"] = "Sim";
  if (m.videoPct !== undefined) l["Vídeo assistido (%)"] = m.videoPct;
  if (m.ajustes && Object.keys(m.ajustes).length) l["Números ajustados"] = JSON.stringify(m.ajustes);
  return l;
}

type Desfecho = "ok" | "descartar" | "tentar";

/** 4xx (menos 408/429) não adianta repetir: o servidor recusou o conteúdo. O resto vale tentar de novo. */
function classificar(status: number): Desfecho {
  if (status >= 200 && status < 300) return "ok";
  if (status >= 400 && status < 500 && status !== 408 && status !== 429) return "descartar";
  return "tentar";
}

async function post(envio: Envio, d: Deps): Promise<Desfecho> {
  const ctrl = new AbortController();
  let temporizador: ReturnType<typeof setTimeout> | undefined;
  const limite = new Promise<Desfecho>((resolve) => {
    temporizador = setTimeout(() => {
      ctrl.abort();
      resolve("tentar");
    }, d.timeoutMs ?? 10000);
  });
  const tentativa = (async (): Promise<Desfecho> => {
    try {
      const res = await d.fetch(d.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(envio),
        signal: ctrl.signal,
      });
      return classificar(res.status);
    } catch {
      return "tentar";
    }
  })();
  try {
    return await Promise.race([tentativa, limite]);
  } finally {
    clearTimeout(temporizador);
  }
}

function lerFila(s: Deps["storage"]): Pendente[] {
  try {
    const v: unknown = JSON.parse(s.getItem(CHAVE) ?? "[]");
    if (!Array.isArray(v)) return [];
    const limite = Date.now() - VALIDADE_MS;
    return v.filter(
      (p): p is Pendente =>
        !!p && typeof p === "object" && typeof p.quando === "number" && p.quando >= limite &&
        !!p.envio && typeof p.envio === "object" && !!p.envio.linha && typeof p.envio.linha === "object",
    );
  } catch {
    return [];
  }
}

function escreverFila(fila: Pendente[], s: Deps["storage"]) {
  try {
    s.setItem(CHAVE, JSON.stringify(fila.slice(-MAX_FILA)));
  } catch {
    /* sem armazenamento: o envio se perde, mas o questionário não pode quebrar */
  }
}

export function lerPendentes(s: Deps["storage"]): Envio[] {
  return lerFila(s).map((p) => p.envio);
}

function guardar(envio: Envio, s: Deps["storage"]) {
  escreverFila([...lerFila(s), { envio, quando: Date.now() }], s);
}

const mesmoItem = (a: Pendente, b: Pendente) => a.quando === b.quando && JSON.stringify(a.envio) === JSON.stringify(b.envio);

/** Relê a fila antes de gravar, para não apagar o que outra aba enfileirou nesse meio-tempo. */
function remover(item: Pendente, s: Deps["storage"]) {
  const fila = lerFila(s);
  const i = fila.findIndex((p) => mesmoItem(p, item));
  if (i < 0) return;
  fila.splice(i, 1);
  escreverFila(fila, s);
}

const espera = (ms: number) => (ms > 0 ? new Promise<void>((r) => setTimeout(r, ms)) : Promise.resolve());

/**
 * Tenta 2 vezes (só repete se o erro for temporário). Se não der, guarda para a próxima visita.
 * Se já há envio pendente para o mesmo ID, o novo entra atrás dele para manter a ordem. Nunca lança erro.
 */
export async function enviar(envio: Envio, d: Deps): Promise<boolean> {
  try {
    const id = envio.linha.ID;
    if (id !== undefined && lerFila(d.storage).some((p) => p.envio.linha.ID === id)) {
      guardar(envio, d.storage);
      return false;
    }
    for (let tentativa = 0; tentativa < 2; tentativa++) {
      const r = await post(envio, d);
      if (r === "ok") return true;
      if (r === "descartar") return false;
      if (tentativa === 0) await espera(d.esperaMs ?? 1000);
    }
    guardar(envio, d.storage);
  } catch {
    /* nunca lança */
  }
  return false;
}

/** Um envio por item, em ordem. Só sai da fila o que deu certo ou foi recusado em definitivo. */
export async function reenviarPendentes(d: Deps): Promise<void> {
  try {
    const bloqueados = new Set<string | number>();
    for (const item of lerFila(d.storage)) {
      const id = item.envio.linha.ID;
      if (id !== undefined && bloqueados.has(id)) continue;
      const r = await post(item.envio, d);
      if (r === "tentar") {
        if (id !== undefined) bloqueados.add(id);
        continue;
      }
      remover(item, d.storage);
    }
  } catch {
    /* nunca lança */
  }
}

export function depsDoNavegador(): Deps {
  return { fetch: window.fetch.bind(window), storage: armazenamentoSeguro(), url: WEBHOOK_URL };
}
