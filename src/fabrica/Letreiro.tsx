import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import type { CardVoceSabia } from "@/domain/conteudo";
import { PalcoContador } from "@/components/ui/palco-contador";
import { Parallax } from "@/components/ui/parallax";
import { CONTAGEM_MS, easeOutCubic, useHiperNumeros } from "@/lib/hiperNumeros";
import { cn } from "@/lib/utils";
import { partesDoNumero } from "./numero";
import { reduzMovimento } from "./rolar";

function NumeroContando({ texto, ativo }: { texto: string; ativo: boolean }) {
  const p = partesDoNumero(texto);
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!ativo || !p) return;
    if (reduzMovimento()) { setV(p.n); return; }
    let raf = 0;
    const t0 = performance.now();
    const passo = (t: number) => {
      const k = Math.min(1, (t - t0) / CONTAGEM_MS);
      setV(p.n * easeOutCubic(k));
      if (k < 1) raf = requestAnimationFrame(passo);
    };
    raf = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf);
  }, [ativo]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!p) return <>{texto}</>;
  return <>{p.antes}{v.toLocaleString("pt-BR", { minimumFractionDigits: p.casas, maximumFractionDigits: p.casas })}{p.depois}</>;
}

/** Letreiro "Você sabia?" entre as fases: placa iluminada, número contando, faixa rolante. */
export function Letreiro({ id, indice, card, desbloqueado, aoAparecer }: {
  id: string; indice: number; card: CardVoceSabia; desbloqueado: boolean; aoAparecer: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const visto = useInView(ref, { once: true, amount: 0.55 });
  const ativo = visto && desbloqueado;
  const avisou = useRef(false);
  const numRef = useRef<HTMLElement>(null);
  useHiperNumeros(numRef);
  useEffect(() => {
    if (ativo && !avisou.current) { avisou.current = true; aoAparecer(); }
  }, [ativo, aoAparecer]);

  const faixa = Array.from({ length: 8 }, () => "Você sabia?");
  return (
    <section id={id} data-indice={indice} aria-label="Você sabia?" className="relative flex min-h-[78dvh] items-center overflow-hidden py-16 lg:-ml-64 lg:px-64">
      <div className="pointer-events-none absolute inset-x-0 top-10 -rotate-2 border-y border-warn/30 bg-warn/90 py-1.5 text-ink" aria-hidden>
        <Parallax eixo="x" distancia={-180}>
          <div className="faixa flex w-max gap-8 whitespace-nowrap text-sm font-extrabold uppercase tracking-[0.2em]">
            {[...faixa, ...faixa].map((t, k) => <span key={k}>{t}</span>)}
          </div>
        </Parallax>
      </div>
      <div
        ref={ref}
        inert={!desbloqueado}
        className={cn(
          "relative mx-5 w-full max-w-3xl rounded-[1.75rem] border border-white/12 bg-[oklch(0.12_0.04_265/0.92)] p-7 shadow-[inset_0_1px_0_oklch(1_0_0/0.08),0_32px_64px_-32px_oklch(0.05_0.03_265)] transition-[filter,opacity] duration-700 md:p-12",
          "mx-auto text-center",
          !desbloqueado && "opacity-30 blur-[6px]",
        )}
      >
        {/* Parafusos da placa. */}
        {["left-3 top-3", "right-3 top-3", "bottom-3 left-3", "bottom-3 right-3"].map((p) => (
          <span key={p} aria-hidden className={cn("absolute size-2 rounded-full bg-white/20 shadow-[inset_0_1px_0_oklch(1_0_0/0.3)]", p)} />
        ))}
        <PalcoContador>
          <strong ref={numRef} className="num-hiper block text-[5.5rem] font-extrabold leading-[0.9] tracking-tighter text-ciano tabular-nums md:text-[9rem]">
            <NumeroContando texto={card.numero} ativo={ativo} />
          </strong>
        </PalcoContador>
        <p className="mx-auto mt-5 max-w-[46ch] text-pretty text-lg leading-relaxed md:text-xl">{card.texto}</p>
        <p className="mt-4 text-xs text-muted-foreground">Fonte: {card.fonte}</p>
      </div>
    </section>
  );
}
