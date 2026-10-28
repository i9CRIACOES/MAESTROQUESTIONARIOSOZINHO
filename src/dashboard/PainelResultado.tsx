import { motion } from "framer-motion";
import { ArrowRight, TriangleAlert } from "lucide-react";
import { useEffect, useRef } from "react";
import type { Nivel, Resultado } from "@/domain/calc";
import type { CamposAjuste, Respostas } from "@/domain/entradas";
import * as L from "@/domain/readings";
import { cn } from "@/lib/utils";
import { AjusteNumeros } from "./AjusteNumeros";
import { Carimbo } from "./Carimbo";
import { Cartao } from "./Cartao";
import { soltarConfete } from "./confete";
import { kpis } from "./dados";
import { GraficoBarras } from "./GraficoBarras";
import { GraficoCascata } from "./GraficoCascata";
import { GraficoRosca } from "./GraficoRosca";
import { KpiHero, KpiTile } from "./Kpi";
import { EASE, useReduz } from "./movimento";
import { ReguaFila } from "./ReguaFila";
import { Sinaleiro } from "./Sinaleiro";
import { PainelMarca } from "./PainelMarca";

const TINTA: Record<Nivel, string> = {
  ok: "from-ok/[0.10]", warn: "from-warn/[0.10]", err: "from-err/[0.10]",
};

const texto = "text-[15px] leading-relaxed text-muted-foreground md:text-base";

/** Painel de controle do resultado. Substitui a TelaResultado da v1 com as mesmas props. */
export function PainelResultado({ r, campos, aoAjustar, aoContinuar, tag, respostas }: {
  r: Resultado; campos: CamposAjuste; aoAjustar: (c: CamposAjuste) => void; aoContinuar: () => void; tag: string; respostas: Respostas;
}) {
  const reduz = useReduz();
  const v = L.verdict(r);
  const destaque = L.spot(r);
  const c = L.contas(r);
  const alerta = L.flagText(r);
  const k = kpis(r);
  const [hero, ...tiles] = k;

  const confeteSolto = useRef(false);
  useEffect(() => {
    if (v.k !== "ok" || confeteSolto.current) return;
    const t = window.setTimeout(() => {
      confeteSolto.current = true; // marca só ao disparar: o StrictMode desmonta e remonta o efeito
      void soltarConfete();
    }, 700);
    return () => window.clearTimeout(t);
  }, [v.k]);

  return (
    <div className="grid w-full min-w-0 gap-4 md:gap-5 lg:grid-cols-12">
      <header className="lg:col-span-12">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-ciano">
          <span className="relative flex size-2" aria-hidden>
            {!reduz && <span className="absolute inline-flex size-full animate-ping rounded-full bg-ciano/60" />}
            <span className="relative inline-flex size-2 rounded-full bg-ciano" />
          </span>
          Painel de controle · {tag}
        </p>
        <h2 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight text-offwhite md:text-4xl">O custo da sua fila</h2>
      </header>

      {/* Veredicto + valor em jogo */}
      <Cartao className={cn("bg-gradient-to-br to-transparent to-60% lg:col-span-7", TINTA[v.k])}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">O veredicto</p>
        <div className="mt-4">
          <Carimbo k={v.k} texto={v.lamp} />
        </div>
        <h3 className="mt-5 text-xl font-extrabold leading-snug text-offwhite md:text-2xl">{v.t}</h3>
        <p className={cn("mt-3 max-w-[62ch]", texto)}>{v.b}</p>
      </Cartao>

      <Cartao className="flex flex-col justify-between gap-6 lg:col-span-5" atraso={0.08}>
        <KpiHero kpi={hero} />
        <Sinaleiro k={r.f.k} rotulo="Farol 1 · O dinheiro" texto={r.f.t} />
        <p className="text-sm leading-relaxed text-muted-foreground">{L.recursoTexto(r)}</p>
      </Cartao>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5 lg:col-span-12">
        {tiles.map((t, i) => (
          <KpiTile key={t.chave} kpi={t} indice={i} className={i === tiles.length - 1 ? "col-span-2 md:col-span-1" : undefined} />
        ))}
      </div>

      <Cartao id="p-cascata" codigo="Painel 02 · Composição" titulo="De onde sai o valor em jogo" className="lg:col-span-7">
        <GraficoCascata r={r} />
        <p className={cn("mt-5", texto)}>{L.explainValor(r)}</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-white/[0.08] bg-ink/40 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Piso · já acontece hoje</p>
            <p className="mt-1.5 text-sm leading-relaxed text-offwhite/85">{L.pisoExp(r)}</p>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-ink/40 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Teto · com a sua ambição</p>
            <p className="mt-1.5 text-sm leading-relaxed text-offwhite/85">{L.tetoExp(r)}</p>
          </div>
        </div>
      </Cartao>

      <Cartao id="p-barras" codigo="Painel 03 · Proporção" titulo="Valor em jogo × mensalidade do Composer" className="flex flex-col lg:col-span-5" atraso={0.08}>
        <GraficoBarras r={r} />
      </Cartao>

      <Cartao id="p-rosca" codigo="Painel 04 · Natureza do trabalho" titulo="Para onde vai o custo da estrutura" className="lg:col-span-5">
        <GraficoRosca r={r} />
        <p className={cn("mt-5", texto)}>{L.tempoText(r)}</p>
      </Cartao>

      <Cartao id="p-fila" codigo="Painel 05 · Fila" titulo="Da ideia aprovada ao ar" className="lg:col-span-7" atraso={0.08}>
        <ReguaFila r={r} />
        <p className={cn("mt-5", texto)}>{L.filaText(r)}</p>
      </Cartao>

      <Cartao id="p-marca" codigo="Painel 06 · Farol 2 · A marca" titulo="Exposição da sua marca na produção de conteúdo"
        className={destaque ? "lg:col-span-5" : "lg:col-span-12"}>
        <div className={cn("grid gap-6", !destaque && "lg:grid-cols-2 lg:items-center")}>
          <PainelMarca r={r} respostas={respostas} />
          <div className="grid gap-4">
            <Sinaleiro k={r.m.k} rotulo="Farol 2 · A marca" texto={r.m.t} />
            <p className={texto}>{L.explainMarca(r)}</p>
          </div>
        </div>
      </Cartao>

      {destaque && (
        <Cartao className="border-violeta/35 bg-gradient-to-br from-violeta/[0.12] to-navy/75 to-50% lg:col-span-7" atraso={0.08}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Ponto de atenção</p>
          <h3 className="mt-2 text-xl font-extrabold leading-snug text-offwhite">{destaque.h}</h3>
          <div className={cn("mt-3 grid gap-3 [&_strong]:text-offwhite", texto)} dangerouslySetInnerHTML={{ __html: destaque.b }} />
        </Cartao>
      )}

      <Cartao id="p-empate" codigo="Painel 07 · Ponto de empate" titulo="O mesmo número, sem nenhuma premissa" className="lg:col-span-12">
        <p className={cn("max-w-[75ch]", texto)}>{L.eqText(r)}</p>
        {alerta && (
          <p role="note" className="mt-4 flex max-w-[75ch] gap-3 rounded-xl border border-warn/40 bg-warn/10 p-4 text-sm leading-relaxed text-offwhite">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden />
            <span>{alerta}</span>
          </p>
        )}
        <details className="group mt-5 rounded-xl border border-white/[0.08] bg-ink/40">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-ciano outline-none focus-visible:ring-2 focus-visible:ring-ciano [&::-webkit-details-marker]:hidden">
            Como esta conta é feita
            <ArrowRight className="size-4 transition-transform duration-200 group-open:rotate-90" aria-hidden />
          </summary>
          <ul className="grid gap-2 px-4 pb-4 text-sm text-muted-foreground tabular-nums">
            {[c.peca, c.hora, c.piso, c.teto, c.rec].map((linha) => (
              <li key={linha} className="border-t border-white/[0.06] pt-2 first:border-t-0 first:pt-0">{linha}</li>
            ))}
          </ul>
          <p className="px-4 pb-4 text-xs text-muted-foreground">Nenhum número desta página é estimativa nossa. Todos saem das suas respostas.</p>
        </details>
      </Cartao>

      <div className="lg:col-span-12">
        <AjusteNumeros campos={campos} aoMudar={aoAjustar} />
      </div>

      <div className="flex justify-stretch sm:justify-end lg:col-span-12">
        <motion.button
          type="button"
          onClick={aoContinuar}
          whileHover={reduz ? undefined : { y: -1 }}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.16, ease: EASE }}
          className="group inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-ciano px-7 text-base font-bold text-ink shadow-[0_12px_32px_-12px_var(--ciano)] outline-none focus-visible:ring-2 focus-visible:ring-offwhite focus-visible:ring-offset-2 focus-visible:ring-offset-ink sm:w-auto"
        >
          E o Maestro?
          <ArrowRight className="size-5 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
        </motion.button>
      </div>
    </div>
  );
}
