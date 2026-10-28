import { motion } from "framer-motion";
import { useRef } from "react";
import type { Nivel, Resultado } from "@/domain/calc";
import { num } from "@/domain/format";
import { cn } from "@/lib/utils";
import { reguaFila } from "./dados";
import { TabelaSr } from "./Cartao";
import { useLargura, useReduz, useVisto } from "./movimento";

const COR: Record<Nivel, string> = { ok: "var(--ok)", warn: "var(--warn)", err: "var(--err)" };

/** Régua da fila: onde os dias úteis do usuário caem contra as marcas de 1 semana (6) e 2 semanas (11). */
export function ReguaFila({ r }: { r: Resultado }) {
  const ref = useRef<HTMLDivElement>(null);
  const trilho = useRef<HTMLDivElement>(null);
  const w = useLargura(trilho);
  const visto = useVisto(ref);
  const reduz = useReduz();
  const f = reguaFila(r);
  const [m6, m11] = f.marcas;
  const faixas: { de: number; ate: number; nivel: Nivel }[] = [
    { de: 0, ate: m6.pos, nivel: "ok" }, { de: m6.pos, ate: m11.pos, nivel: "warn" }, { de: m11.pos, ate: 1, nivel: "err" },
  ];
  const lado = f.pos > 0.72 ? "direita" : f.pos < 0.28 ? "esquerda" : "centro";
  const rotulo = `${num(f.dias, 1)} dia${f.dias === 1 ? "" : "s"} úte${f.dias === 1 ? "il" : "is"}`;
  const titulo = `Régua da fila: ${rotulo} da ideia aprovada ao ar, contra as marcas de 6 e 11 dias úteis.`;

  return (
    <figure ref={ref} className="grid gap-2">
      <div ref={trilho} className="relative h-24 w-full" role="img" aria-label={titulo}>
        {/* marcador do usuário: só transform, em pixels da largura medida */}
        <motion.div
          className="pointer-events-none absolute left-0 top-0 z-[1] h-full w-0"
          initial={reduz ? false : { x: 0 }}
          animate={{ x: visto ? f.pos * w : 0 }}
          transition={reduz ? { duration: 0 } : { type: "spring", stiffness: 60, damping: 16, delay: 0.2 }}
        >
          <div className="absolute bottom-[30px] left-0 top-0 flex -translate-x-1/2 flex-col items-center">
            <span
              className={cn(
                "whitespace-nowrap rounded-md border border-white/15 bg-ink px-2 py-1 text-xs font-bold text-offwhite shadow-lg",
                lado === "direita" && "-translate-x-[calc(50%-14px)]",
                lado === "esquerda" && "translate-x-[calc(50%-14px)]",
              )}
            >
              Você · {rotulo}
            </span>
            <span className="w-px flex-1 bg-offwhite/50" />
            <span className="size-4 shrink-0 rounded-full border-2 border-navy" style={{ background: COR[f.nivel] }} />
          </div>
        </motion.div>
        <div className="absolute inset-x-0 bottom-[34px] flex h-2 gap-0.5">
          {faixas.map((z) => (
            <span key={z.nivel} className="h-2 first:rounded-l-full last:rounded-r-full" style={{ width: `${(z.ate - z.de) * 100}%`, background: COR[z.nivel], opacity: z.nivel === f.nivel ? 0.95 : 0.3 }} />
          ))}
        </div>
        {f.marcas.map((m) => (
          <div key={m.dias} className="absolute bottom-0 flex -translate-x-1/2 flex-col items-center" style={{ left: `${m.pos * 100}%` }}>
            <span className="mb-1 h-4 w-px bg-white/40" />
            <span className="whitespace-nowrap text-[11px] leading-tight text-muted-foreground">
              <span className="font-semibold text-offwhite tabular-nums">{m.dias}</span> · {m.rotulo}
            </span>
          </div>
        ))}
        <span className="absolute bottom-0 left-0 text-[11px] text-muted-foreground">0</span>
        <span className="absolute bottom-0 right-0 text-[11px] text-muted-foreground tabular-nums">{f.max} dias</span>
      </div>
      <TabelaSr legenda="Dias úteis de fila" linhas={[["Sua fila", rotulo], ["Marca 1", "6 dias úteis"], ["Marca 2", "11 dias úteis"]]} />
    </figure>
  );
}
