import { LIMIAR_AMARELO, LIMIAR_VERDE, MARCA_ALTA, MARCA_MEDIA, RECURSO } from "./constants";

export type Nivel = "ok" | "warn" | "err";

export interface Entradas {
  pecas: number;
  custo: number;
  horas: number;
  mont: number;
  mult: number;
  dias: number;
  maos: number;
  trava: number;
  furo: number;
  ia: number;
  iaProibida: boolean;
  rec: number;
  preco: number;
}

export interface Resultado {
  preco: number; rec: number; pecas: number; custo: number; horas: number; mont: number; mult: number; dias: number;
  custoPeca: number; horasMes: number; custoHora: number; horasMont: number; pessoas: number;
  piso: number; gap: number; custoGap: number; teto: number; recursos: number; frac: number; pecasEq: number; horasEq: number;
  f: { k: Nivel; t: string; b: number };
  marca: number;
  m: { k: Nivel; t: string; lvl: "alta" | "média" | "baixa" };
  iaProibida: boolean;
}

/** Porte exato de calc() de maestro.com.ai/custo-da-fila. Não adicione nem remova campos: o teste compara com o resultado do original. */
export function calcular(s: Entradas): Resultado {
  const preco = s.preco > 0 ? s.preco : 0;
  const rec = s.rec > 0 ? s.rec : RECURSO;
  const pecas = Math.max(1, s.pecas);
  const custo = Math.max(1, s.custo);
  const horas = Math.max(0.25, s.horas);
  const mont = Math.min(1, Math.max(0, s.mont));
  const mult = Math.max(1, s.mult);

  const custoPeca = custo / pecas;
  const horasMes = pecas * horas;
  const custoHora = custo / horasMes;
  const horasMont = horasMes * mont;
  const piso = custo * mont;
  const gap = pecas * (mult - 1);
  const custoGap = gap * custoPeca;
  const teto = piso + custoGap;
  const recursos = teto / rec;
  const pessoas = horasMont / 168;
  const frac = preco / custo;
  const pecasEq = preco / custoPeca;
  const horasEq = preco / custoHora;

  let f: Resultado["f"];
  if (teto >= LIMIAR_VERDE) f = { k: "ok", t: "Verde — um recurso alocado ou mais", b: 2 };
  else if (teto >= LIMIAR_AMARELO) f = { k: "warn", t: "Amarelo — perto de um recurso alocado", b: 1 };
  else f = { k: "err", t: "Vermelho — abaixo do limiar de mudança", b: 0 };

  const marca = (s.maos || 0) + (s.trava || 0) + (s.furo || 0) + (s.ia || 0);
  let m: Resultado["m"];
  if (marca >= MARCA_ALTA) m = { k: "err", t: "Exposição alta", lvl: "alta" };
  else if (marca >= MARCA_MEDIA) m = { k: "warn", t: "Exposição média", lvl: "média" };
  else m = { k: "ok", t: "Exposição baixa", lvl: "baixa" };

  return {
    preco, rec, pecas, custo, horas, mont, mult, dias: s.dias,
    custoPeca, horasMes, custoHora, horasMont, pessoas,
    piso, gap, custoGap, teto, recursos, frac, pecasEq, horasEq,
    f, marca, m, iaProibida: s.iaProibida,
  };
}
