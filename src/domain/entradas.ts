import type { Entradas } from "./calc";
import { PRECO, RECURSO } from "./constants";
import { PERGUNTA_POR_ID, type StepId } from "./steps";

/** Índice da opção escolhida em cada pergunta. */
export type Respostas = Partial<Record<StepId, number>>;

export interface Ajustes {
  pecas?: number; custo?: number; horas?: number; mont?: number; dias?: number; mult?: number; rec?: number; preco?: number;
}

export type CamposAjuste = Record<"pecas" | "custo" | "horas" | "mont" | "dias" | "mult" | "rec" | "preco", string>;

export function entradasDe(r: Respostas, aj: Ajustes = {}): Entradas {
  const v = (id: StepId) => {
    const i = r[id];
    if (i === undefined) throw new Error(`Pergunta ${id} sem resposta`);
    const opcao = PERGUNTA_POR_ID[id].opcoes[i];
    if (!opcao) throw new Error(`Pergunta ${id} com opção inválida: ${i}`);
    return opcao.valor;
  };
  return {
    pecas: aj.pecas ?? v("pecas"),
    custo: aj.custo ?? v("custo"),
    horas: aj.horas ?? v("horas"),
    mont: aj.mont ?? v("mont"),
    mult: aj.mult ?? v("mult"),
    dias: aj.dias ?? v("dias"),
    maos: v("maos"),
    trava: v("trava"),
    furo: v("furo"),
    ia: v("ia"),
    iaProibida: r.ia === 3,
    rec: aj.rec ?? RECURSO,
    preco: aj.preco ?? PRECO,
  };
}

/** Mesmas regras de readTune() do original: campo vazio ou zero cai no valor padrão. */
export function ajustesDeCampos(c: CamposAjuste): Required<Ajustes> {
  return {
    pecas: parseFloat(c.pecas) || 1,
    custo: parseFloat(c.custo) || 1,
    horas: parseFloat(c.horas) || 0.25,
    mont: (parseFloat(c.mont) || 0) / 100,
    dias: parseFloat(c.dias) || 0.5,
    mult: parseFloat(c.mult) || 1,
    rec: parseFloat(c.rec) || RECURSO,
    preco: parseFloat(c.preco) || 0,
  };
}

/** Valores iniciais dos campos de ajuste, como o finish() do original preenche. */
export function camposIniciais(e: Entradas): CamposAjuste {
  return {
    pecas: String(e.pecas), custo: String(e.custo), horas: String(e.horas), mont: String(Math.round(e.mont * 100)),
    dias: String(e.dias), mult: String(e.mult), rec: String(e.rec), preco: String(e.preco),
  };
}
