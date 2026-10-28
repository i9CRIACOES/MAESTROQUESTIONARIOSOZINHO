import { motion } from "framer-motion";
import { Bot, Hand, ShieldAlert, UserCheck, type LucideIcon } from "lucide-react";
import { useRef } from "react";
import type { Nivel, Resultado } from "@/domain/calc";
import type { Respostas } from "@/domain/entradas";
import { PalcoContador } from "@/components/ui/palco-contador";
import { useHiperNumeros } from "@/lib/hiperNumeros";
import { cn } from "@/lib/utils";
import { fatoresMarca, velocimetro, type FatorMarca } from "./dados";
import { EASE, useNumero, useReduz, useVisto } from "./movimento";

const COR: Record<Nivel, string> = { ok: "bg-ok", warn: "bg-warn", err: "bg-err" };
const TEXTO: Record<Nivel, string> = { ok: "text-ok", warn: "text-warn", err: "text-err" };
const ICONE: Record<FatorMarca["id"], LucideIcon> = { maos: Hand, trava: UserCheck, furo: ShieldAlert, ia: Bot };

/** Peso do fator: até 1/3 do máximo é baixo, até 2/3 é médio, acima disso é alto. */
const nivelDoFator = (f: FatorMarca): Nivel => (f.pontos / f.maximo > 2 / 3 ? "err" : f.pontos / f.maximo > 1 / 3 ? "warn" : "ok");

/**
 * Painel 06 · A marca: a nota grande no centro, a régua de zonas com o marcador e, embaixo,
 * de onde vem cada ponto (uma barra por fator, no estilo das listas do painel do Núcleo i9).
 */
export function PainelMarca({ r, respostas }: { r: Resultado; respostas: Respostas }) {
  const ref = useRef<HTMLDivElement>(null);
  const numRef = useRef<HTMLSpanElement>(null);
  const visto = useVisto(ref);
  const reduz = useReduz();
  const v = velocimetro(r);
  const nota = Math.round(useNumero(v.valor, visto));
  useHiperNumeros(numRef);
  const fatores = fatoresMarca(respostas);
  const anim = (atraso: number) => (reduz ? { duration: 0 } : { duration: 0.9, ease: EASE, delay: atraso });

  return (
    <div ref={ref} className="grid gap-6">
      <PalcoContador className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Nota de exposição</p>
        <p className="mt-1 leading-none">
          <span ref={numRef} className="num-hiper text-6xl font-black tabular-nums tracking-tight text-offwhite md:text-7xl">
            <span aria-hidden>{nota}</span>
            <span className="sr-only">{v.valor}</span>
          </span>
          <span className="text-2xl font-bold text-white/35 md:text-3xl"> /100</span>
        </p>
        <span className={cn("mt-3 inline-block rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-ink", COR[v.zona.nivel])}>
          Exposição {v.zona.lvl}
        </span>
      </PalcoContador>

      {/* Régua das zonas com o marcador na nota. */}
      <div aria-hidden>
        <div className="relative pt-4">
          <motion.span
            className="absolute top-0 -ml-[7px] block size-0 border-x-[7px] border-t-[9px] border-x-transparent border-t-offwhite"
            initial={{ left: "0%" }}
            animate={{ left: visto ? `${v.valor}%` : "0%" }}
            transition={anim(0.2)}
          />
          <div className="flex h-3 gap-0.5 overflow-hidden rounded-full">
            {v.zonas.map((z) => (
              <span key={z.lvl} className={cn(COR[z.nivel], z === v.zona ? "opacity-100" : "opacity-30")} style={{ width: `${z.ate - z.de}%` }} />
            ))}
          </div>
        </div>
        <div className="relative mt-1.5 h-4 text-[11px] font-semibold text-muted-foreground">
          {v.zonas.map((z) => (
            <span key={z.lvl} className="absolute -translate-x-1/2" style={{ left: `${(z.de + z.ate) / 2}%` }}>{z.rotulo}</span>
          ))}
        </div>
      </div>

      {/* De onde vem a nota. */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">De onde vêm os pontos</p>
        <ul className="mt-3 grid gap-3">
          {fatores.map((f, i) => {
            const Icone = ICONE[f.id];
            const n = nivelDoFator(f);
            return (
              <li key={f.id} className="grid grid-cols-[auto_1fr] items-start gap-3">
                <span className={cn("mt-0.5 grid size-8 place-items-center rounded-lg bg-white/[0.06]", TEXTO[n])}>
                  <Icone className="size-4" strokeWidth={2.2} aria-hidden />
                </span>
                <div className="min-w-0">
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-semibold text-offwhite">{f.rotulo}</span>
                    <span className="shrink-0 font-bold tabular-nums text-offwhite">
                      {f.pontos}<span className="text-muted-foreground">/{f.maximo}</span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/[0.07]">
                    <motion.div
                      className={cn("h-full origin-left rounded-full", COR[n])}
                      initial={{ transform: "scaleX(0)" }}
                      animate={{ transform: `scaleX(${visto ? f.pontos / f.maximo : 0})` }}
                      transition={anim(0.3 + i * 0.12)}
                    />
                  </div>
                  {f.resposta && <p className="mt-1 truncate text-xs text-muted-foreground">{f.resposta}</p>}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
