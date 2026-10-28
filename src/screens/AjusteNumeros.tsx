import type { CamposAjuste } from "@/domain/entradas";

const CAMPOS: { k: keyof CamposAjuste; rotulo: string; min: number; max?: number; passo: number }[] = [
  { k: "pecas", rotulo: "Peças por mês", min: 1, passo: 1 },
  { k: "custo", rotulo: "Custo mensal da estrutura (R$)", min: 1000, passo: 1000 },
  { k: "horas", rotulo: "Horas de gente por peça", min: 0.25, passo: 0.25 },
  { k: "mont", rotulo: "Montagem e versionamento (% do tempo)", min: 0, max: 100, passo: 5 },
  { k: "dias", rotulo: "Dias úteis de fila", min: 0.5, passo: 0.5 },
  { k: "mult", rotulo: "Quantas peças você faria (× hoje)", min: 1, max: 20, passo: 0.5 },
  { k: "rec", rotulo: "Custo de 1 recurso alocado (R$/mês)", min: 1000, passo: 1000 },
  { k: "preco", rotulo: "Mensalidade do Maestro Composer (R$)", min: 0, passo: 500 },
];

export function AjusteNumeros({ campos, aoMudar }: { campos: CamposAjuste; aoMudar: (c: CamposAjuste) => void }) {
  return (
    <details className="rounded-2xl border border-border bg-navy/60 p-5">
      <summary className="cursor-pointer text-base font-bold text-offwhite">Bônus: ajuste os números</summary>
      <p className="mt-2 text-sm text-muted-foreground">As faixas servem para começar. Coloque os seus números exatos e veja os faróis mudarem.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {CAMPOS.map((c) => (
          <label key={c.k} className="grid gap-1">
            <span className="text-xs text-muted-foreground">{c.rotulo}</span>
            <input
              type="number" inputMode="decimal" min={c.min} max={c.max} step={c.passo} value={campos[c.k]}
              onChange={(e) => aoMudar({ ...campos, [c.k]: e.target.value })}
              className="rounded-xl border border-border bg-ink px-3 py-2.5 text-base text-offwhite outline-none focus:border-ciano"
            />
          </label>
        ))}
      </div>
    </details>
  );
}
