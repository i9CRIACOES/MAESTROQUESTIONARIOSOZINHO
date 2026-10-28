import { motion } from "framer-motion";
import { useRef } from "react";
import type { Resultado } from "@/domain/calc";
import { brl } from "@/domain/format";
import { relacao } from "@/domain/readings";
import { barras } from "./dados";
import { TabelaSr } from "./Cartao";
import { SERIE, transicao, useReduz, useVisto } from "./movimento";

/** Barras horizontais na mesma escala: valor em jogo (destaque) contra a mensalidade (contexto, em cinza). */
export function GraficoBarras({ r }: { r: Resultado }) {
  const ref = useRef<HTMLDivElement>(null);
  const visto = useVisto(ref);
  const reduz = useReduz();
  const b = barras(r);
  const rel = relacao(r);
  const cor = { teto: SERIE.s1, preco: SERIE.neutra };
  const titulo = `Valor em jogo de ${brl(b.itens[0].valor)} por mês contra mensalidade de ${brl(b.itens[1].valor)}.`;

  return (
    <figure ref={ref} className="flex flex-1 flex-col gap-6">
      <div className="grid gap-2 rounded-xl bg-ciano/[0.07] p-4 ring-1 ring-inset ring-ciano/15 md:p-5">
        <motion.p
          className="text-5xl font-extrabold leading-none tracking-tight text-ciano tabular-nums"
          initial={reduz ? false : { opacity: 0, scale: 0.9 }}
          animate={visto ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
          transition={transicao(reduz, 0.6, 0.45)}
        >
          {rel.destaque}
        </motion.p>
        <p className="text-sm leading-relaxed text-offwhite/90 [&_strong]:text-offwhite" dangerouslySetInnerHTML={{ __html: rel.html }} />
      </div>
      <div role="img" aria-label={titulo} className="grid gap-4">
        {b.itens.map((it, i) => (
          <div key={it.chave} className="grid gap-1.5">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <span className="size-2.5 rounded-[3px]" style={{ background: cor[it.chave] }} aria-hidden />
                {it.rotulo}
              </span>
              <span className="font-bold text-offwhite tabular-nums">{brl(it.valor)}</span>
            </div>
            <div className="h-6 w-full rounded-r-[4px] bg-white/[0.04]">
              <motion.div
                className="h-6 rounded-r-[4px]"
                style={{ background: cor[it.chave] }}
                initial={reduz ? false : { width: "0%" }}
                animate={{ width: visto ? `${Math.max(it.frac * 100, it.valor > 0 ? 1 : 0)}%` : "0%" }}
                transition={transicao(reduz, 0.1 + i * 0.12)}
              />
            </div>
          </div>
        ))}
      </div>
      <TabelaSr legenda="Valor em jogo contra mensalidade" linhas={b.itens.map((i) => [i.rotulo, brl(i.valor)] as [string, string])} />
    </figure>
  );
}
