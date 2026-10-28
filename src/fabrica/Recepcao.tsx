import {
  Building2, Car, Cpu, Factory, GraduationCap, HeartPulse, Hotel, Landmark, Megaphone, MoreHorizontal, Plane, RadioTower, Shirt,
  ShoppingCart, Store, UtensilsCrossed, Warehouse, Zap, type LucideIcon,
} from "lucide-react";
import { FATURAMENTOS, SETORES } from "@/domain/steps";
import { cn } from "@/lib/utils";
import { RotuloPergunta } from "./Estacao";

const ICONE_SETOR: LucideIcon[] = [
  Store, ShoppingCart, Shirt, Landmark, HeartPulse, GraduationCap, RadioTower, Factory, Zap, Hotel, Plane, Car, UtensilsCrossed, Cpu, Megaphone, MoreHorizontal,
];
/** Rótulo curto do galpão (o valor gravado continua sendo o texto completo de FATURAMENTOS). */
const GALPAO = [
  { linha1: "Até", linha2: "R$ 100 mi" },
  { linha1: "R$ 100 a", linha2: "500 mi" },
  { linha1: "R$ 500 mi", linha2: "a 1 bi" },
  { linha1: "R$ 1 a", linha2: "5 bi" },
  { linha1: "Mais de", linha2: "R$ 5 bi" },
];

export function Recepcao({ setor, fat, aoMudar, travado }: {
  setor: string; fat: string; aoMudar: (campo: "setor" | "fat", valor: string) => void; travado?: boolean;
}) {
  return (
    <div className="grid gap-10">
      <fieldset className="rounded-2xl border border-white/10 bg-navy/40 p-4 md:p-5">
        <legend className="float-left w-full"><RotuloPergunta n={1} total={2} texto="Em que setor a sua empresa joga?" respondida={!!setor} /></legend>
        <div role="radiogroup" aria-label="Setor da empresa" className="clear-both grid grid-cols-2 gap-2 pt-4 sm:grid-cols-3 lg:grid-cols-4">
          {SETORES.map((s, i) => {
            const Icone = ICONE_SETOR[i] ?? Building2;
            const sel = setor === s;
            return (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={sel}
                disabled={travado && !sel}
                onClick={() => aoMudar("setor", s)}
                className={cn(
                  "flex min-h-14 cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-[background-color,border-color,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40",
                  sel ? "border-ciano bg-ciano/12 text-offwhite" : "border-white/12 bg-navy/70 text-offwhite/85 hover:border-white/30 hover:bg-navy-light/80",
                )}
              >
                <Icone className={cn("size-5 shrink-0 transition-colors", sel ? "text-ciano" : "text-muted-foreground")} strokeWidth={1.8} />
                <span className="text-[0.82rem] font-semibold leading-tight md:text-sm">{s}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset id="recepcao-fat" className="scroll-mt-24 rounded-2xl border border-white/10 bg-navy/40 p-4 md:p-5">
        <legend className="float-left w-full"><RotuloPergunta n={2} total={2} texto="E o faturamento anual, fica em que faixa?" respondida={!!fat} /></legend>
        <div role="radiogroup" aria-label="Faturamento anual" className="clear-both grid grid-cols-5 items-end gap-1.5 pt-4 md:gap-3">
          {FATURAMENTOS.map((f, i) => {
            const sel = fat === f;
            const g = GALPAO[i];
            return (
              <button
                key={f}
                type="button"
                role="radio"
                aria-checked={sel}
                aria-label={f}
                disabled={travado && !sel}
                onClick={() => aoMudar("fat", f)}
                className="group flex cursor-pointer flex-col items-center gap-2 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span
                  className={cn(
                    "relative grid w-full place-items-center rounded-t-lg border border-b-4 transition-[background-color,border-color,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-active:scale-[0.97]",
                    sel ? "border-ciano bg-ciano/15 text-ciano" : "border-white/15 bg-navy/80 text-muted-foreground group-hover:border-white/35",
                  )}
                  style={{ height: `${3 + i * 1.25}rem` }}
                >
                  <Warehouse className="size-5 md:size-7" strokeWidth={1.7} />
                </span>
                <span className={cn("text-center text-[11px] font-semibold leading-tight md:text-xs", sel ? "text-offwhite" : "text-muted-foreground")}>
                  {g.linha1}<br />{g.linha2}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
