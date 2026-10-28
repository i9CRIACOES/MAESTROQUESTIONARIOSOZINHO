import { motion } from "framer-motion";
import { Clock3, Coins, Layers, Timer, Users, Wallet, type LucideIcon } from "lucide-react";
import { useRef, type ReactNode } from "react";
import { brl, num } from "@/domain/format";
import { PalcoContador } from "@/components/ui/palco-contador";
import { useHiperNumeros } from "@/lib/hiperNumeros";
import { cn } from "@/lib/utils";
import type { FormatoKpi, Kpi } from "./dados";
import { EASE, useNumero, useReduz, useVisto } from "./movimento";

export function formatarKpi(v: number, f: FormatoKpi): string {
  if (f === "brl") return brl(v);
  if (f === "horas") return num(v, 0) + " h";
  return num(v, v > 0 && v < 0.1 ? 2 : 1);
}

const ICONE: Record<Kpi["chave"], LucideIcon> = {
  teto: Wallet, piso: Layers, custoPeca: Coins, custoHora: Clock3, horasMont: Timer, pessoas: Users,
};

/** Número que conta; com reduzir movimento aparece direto. Leitor de tela recebe o valor final, não a contagem. */
export function Numero({ valor, formato, className }: { valor: number; formato: FormatoKpi; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const visto = useVisto(ref);
  const atual = useNumero(valor, visto);
  useHiperNumeros(ref);
  return (
    <span ref={ref} className={cn("num-hiper", className)}>
      <span aria-hidden>{formatarKpi(atual, formato)}</span>
      <span className="sr-only">{formatarKpi(valor, formato)}</span>
    </span>
  );
}

/** Indicador de destaque: o valor em jogo. */
export function KpiHero({ kpi, children }: { kpi: Kpi; children?: ReactNode }) {
  return (
    <PalcoContador className="text-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ciano">{kpi.rotulo}</p>
      <Numero
        valor={kpi.valor}
        formato={kpi.formato}
        className="mt-2 block text-[2.75rem] font-extrabold leading-none tracking-tight text-offwhite tabular-nums sm:text-6xl"
      />
      {children}
    </PalcoContador>
  );
}

export function KpiTile({ kpi, indice, sufixo, className }: { kpi: Kpi; indice: number; sufixo?: string; className?: string }) {
  const reduz = useReduz();
  const Icone = ICONE[kpi.chave];
  return (
    <motion.div
      initial={reduz ? false : { opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, ease: EASE, delay: 0.08 + indice * 0.06 }}
      className={cn("flex min-w-0 flex-col items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-ink/50 p-4 text-center", className)}
    >
      <div className="flex flex-col items-center gap-2">
        <p className="text-xs leading-snug text-muted-foreground">{kpi.rotulo}</p>
        <Icone className="size-4 shrink-0 text-ciano/80" strokeWidth={1.75} aria-hidden />
      </div>
      <p className="text-2xl font-extrabold leading-none text-ciano tabular-nums sm:text-3xl">
        <Numero valor={kpi.valor} formato={kpi.formato} />
        {sufixo && <span className="ml-1 text-sm font-semibold text-muted-foreground">{sufixo}</span>}
      </p>
    </motion.div>
  );
}
