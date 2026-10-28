import { motion } from "framer-motion";
import { useRef } from "react";
import type { Resultado } from "@/domain/calc";
import { brl, pct } from "@/domain/format";
import { rosca } from "./dados";
import { TabelaSr } from "./Cartao";
import { SERIE, transicao, useReduz, useVisto } from "./movimento";

const TAM = 176, ESP = 18, R = (TAM - ESP) / 2, FOLGA = 0.006; // folga ≈ 2px de superfície entre os arcos

/** Rosca: custo da estrutura dividido em montagem (destaque) e criação. */
export function GraficoRosca({ r }: { r: Resultado }) {
  const ref = useRef<HTMLDivElement>(null);
  const visto = useVisto(ref);
  const reduz = useReduz();
  const { segmentos } = rosca(r);
  const cor = { montagem: SERIE.s1, criacao: SERIE.s2 };
  const titulo = `Rosca: ${pct(segmentos[0].frac)} do custo da estrutura (${brl(segmentos[0].valor)}) é montagem e ${pct(segmentos[1].frac)} (${brl(segmentos[1].valor)}) é criação.`;

  return (
    <figure ref={ref} className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-6">
      <div className="relative shrink-0" style={{ width: TAM, height: TAM }}>
        <svg width={TAM} height={TAM} viewBox={`0 0 ${TAM} ${TAM}`} role="img" aria-label={titulo}>
          <title>{titulo}</title>
          <circle cx={TAM / 2} cy={TAM / 2} r={R} fill="none" stroke="rgb(255 255 255 / 0.05)" strokeWidth={ESP} />
          <g transform={`rotate(-90 ${TAM / 2} ${TAM / 2})`}>
            {segmentos.map((s, i) => {
              const cheio = s.frac >= 0.999;
              const comp = cheio ? 1 : Math.max(0, s.frac - FOLGA * 2);
              if (s.frac <= 0.001) return null;
              return (
                <motion.circle
                  key={s.chave}
                  cx={TAM / 2} cy={TAM / 2} r={R} fill="none" stroke={cor[s.chave]} strokeWidth={ESP}
                  initial={reduz ? false : { pathLength: 0, pathOffset: s.inicio + (cheio ? 0 : FOLGA) }}
                  animate={{ pathLength: visto ? comp : 0, pathOffset: s.inicio + (cheio ? 0 : FOLGA) }}
                  transition={transicao(reduz, 0.1 + i * 0.35, 0.8)}
                />
              );
            })}
          </g>
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center" aria-hidden>
          <span className="text-3xl font-extrabold leading-none text-offwhite tabular-nums">{pct(segmentos[0].frac)}</span>
          <span className="mt-1 text-xs text-muted-foreground">é montagem</span>
        </div>
      </div>
      <ul className="grid w-full gap-3 text-sm">
        {segmentos.map((s) => (
          <li key={s.chave} className="grid grid-cols-[auto_1fr_auto] items-baseline gap-x-2 border-t border-white/[0.07] pt-3 first:border-t-0 first:pt-0">
            <span className="size-2.5 translate-y-[1px] rounded-[3px]" style={{ background: cor[s.chave] }} aria-hidden />
            <span className="text-muted-foreground">{s.rotulo}</span>
            <span className="text-right font-bold text-offwhite tabular-nums">
              {brl(s.valor)} <span className="ml-1 font-medium text-muted-foreground">{pct(s.frac)}</span>
            </span>
          </li>
        ))}
      </ul>
      <TabelaSr legenda="Custo mensal da estrutura por natureza do trabalho" linhas={segmentos.map((s) => [s.rotulo, `${brl(s.valor)} (${pct(s.frac)})`] as [string, string])} />
    </figure>
  );
}
