import { ref } from "./referencia";

export type Combo = Record<string, number>;

const IDS = ref.STEPS.map((s) => s.id);
const QTD: Record<string, number> = Object.fromEntries(ref.STEPS.map((s) => [s.id, s.opts.length]));

/** Cada opção de cada pergunta ao menos uma vez + 400 combinações pseudoaleatórias (semente fixa). */
export function combinacoes(): Combo[] {
  const base: Combo = Object.fromEntries(IDS.map((id) => [id, 0]));
  const lista: Combo[] = [];
  for (const id of IDS) for (let i = 0; i < QTD[id]; i++) lista.push({ ...base, [id]: i });
  let semente = 20261023;
  const aleatorio = () => {
    semente = (semente * 1103515245 + 12345) % 2147483648;
    return semente / 2147483648;
  };
  for (let k = 0; k < 400; k++) lista.push(Object.fromEntries(IDS.map((id) => [id, Math.floor(aleatorio() * QTD[id])])));
  return lista;
}

/** Monta o objeto `S` exatamente como o original faz ao terminar o questionário. */
export function estadoOriginal(c: Combo, ajustes: Partial<Record<string, number>> = {}): Record<string, number> {
  const S: Record<string, number> = {};
  for (const st of ref.STEPS) {
    S[st.id] = st.opts[c[st.id]][0];
    S[st.id + "Label"] = c[st.id];
  }
  S.preco = ref.PRECO;
  S.rec = ref.RECURSO;
  return { ...S, ...ajustes } as Record<string, number>;
}
