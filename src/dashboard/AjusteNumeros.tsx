import { ChevronDown, SlidersHorizontal } from "lucide-react";
import type { CamposAjuste } from "@/domain/entradas";

/** Mesmos campos e limites do AjusteNumeros da v1; o painel recalcula a cada tecla. */
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
    <details className="group rounded-2xl border border-white/10 bg-navy/60 open:bg-navy/80">
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 rounded-2xl px-5 py-4 outline-none focus-visible:ring-2 focus-visible:ring-ciano [&::-webkit-details-marker]:hidden">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-ciano/10 text-ciano">
          <SlidersHorizontal className="size-4" strokeWidth={2} aria-hidden />
        </span>
        <span className="flex-1">
          <span className="block text-base font-bold text-offwhite">Bônus: ajuste os números</span>
          <span className="block text-sm text-muted-foreground">Coloque os seus números exatos e veja o painel mudar na hora.</span>
        </span>
        <ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" aria-hidden />
      </summary>
      <div className="grid gap-4 px-5 pb-5 sm:grid-cols-2 lg:grid-cols-4">
        {CAMPOS.map((c) => (
          <label key={c.k} className="grid content-start gap-1.5">
            <span className="text-xs leading-snug text-muted-foreground">{c.rotulo}</span>
            <input
              type="number" inputMode="decimal" min={c.min} max={c.max} step={c.passo} value={campos[c.k]}
              onChange={(e) => aoMudar({ ...campos, [c.k]: e.target.value })}
              className="min-h-11 rounded-xl border border-white/10 bg-ink px-3 py-2.5 text-base text-offwhite tabular-nums outline-none transition-colors focus:border-ciano focus-visible:ring-2 focus-visible:ring-ciano/40"
            />
          </label>
        ))}
      </div>
    </details>
  );
}
