import { motion } from "framer-motion";
import { useRef } from "react";
import type { Resultado } from "@/domain/calc";
import { brl } from "@/domain/format";
import { cascata } from "./dados";
import { Legenda, TabelaSr } from "./Cartao";
import { SERIE, transicao, useLargura, useReduz, useVisto } from "./movimento";

const ALT = 232, TOPO = 30, BASE_X = 40, LARG_BARRA = 24, RAIO = 4;

/** Barra vertical com ponta arredondada (4px) e base reta, animando entre valores. */
function BarraV({ x, yBase, yTopo, cor, visto, atraso, chave }: { x: number; yBase: number; yTopo: number; cor: string; visto: boolean; atraso: number; chave: string }) {
  const reduz = useReduz();
  const h = Math.max(0, yBase - yTopo);
  const pe = Math.min(RAIO, h);
  const t = transicao(reduz, atraso);
  return (
    <g data-barra={chave}>
      <motion.rect x={x} width={LARG_BARRA} rx={RAIO} fill={cor}
        initial={reduz ? false : { y: yBase, height: 0 }}
        animate={visto ? { y: yTopo, height: h } : { y: yBase, height: 0 }} transition={t} />
      <motion.rect x={x} width={LARG_BARRA} fill={cor}
        initial={reduz ? false : { y: yBase, height: 0 }}
        animate={visto ? { y: yBase - pe, height: pe } : { y: yBase, height: 0 }} transition={t} />
    </g>
  );
}

/** Cascata: piso + peças que faltam = valor em jogo. */
export function GraficoCascata({ r }: { r: Resultado }) {
  const caixa = useRef<HTMLDivElement>(null);
  const w = useLargura(caixa);
  const visto = useVisto(caixa);
  const reduz = useReduz();
  const { passos, max } = cascata(r);
  const [piso, gap, teto] = passos;

  const y0 = ALT - BASE_X;
  const esc = (v: number) => y0 - (v / max) * (y0 - TOPO);
  const col = w / 3;
  const xc = (i: number) => col * i + col / 2;
  const xb = (i: number) => xc(i) - LARG_BARRA / 2;
  const fade = (d: number) => ({ initial: reduz ? false : { opacity: 0 }, animate: { opacity: visto ? 1 : 0 }, transition: transicao(reduz, d, 0.4) });

  const temGap = gap.valor > 0;
  const rotulos = [
    { i: 0, v: brl(piso.valor), y: esc(piso.topo) },
    { i: 1, v: temGap ? "+ " + brl(gap.valor) : "R$ 0", y: temGap ? esc(gap.topo) : esc(gap.base) },
    { i: 2, v: brl(teto.valor), y: esc(teto.topo) },
  ];
  const nomes = ["Piso", "Peças que faltam", "Em jogo"];
  const titulo = `Cascata: piso de ${brl(piso.valor)} mais ${brl(gap.valor)} das peças que faltam somam ${brl(teto.valor)} em jogo por mês.`;

  return (
    <figure className="grid gap-3">
      <Legenda itens={[{ cor: SERIE.s1, rotulo: "Montagem que já existe (piso)" }, { cor: SERIE.s2, rotulo: "Custo das peças que faltam" }]} />
      <div ref={caixa} className="w-full">
        <svg width={w} height={ALT} role="img" aria-label={titulo} className="block overflow-visible">
          <title>{titulo}</title>
          <line x1={0} x2={w} y1={y0 + 0.5} y2={y0 + 0.5} stroke="rgb(255 255 255 / 0.14)" strokeWidth={1} />
          {/* conectores entre os degraus */}
          <motion.line {...fade(0.5)} x1={xb(0) + LARG_BARRA} x2={xb(1)} y1={esc(piso.topo) + 0.5} y2={esc(piso.topo) + 0.5} stroke="rgb(255 255 255 / 0.22)" strokeWidth={1} />
          <motion.line {...fade(0.7)} x1={xb(1) + LARG_BARRA} x2={xb(2)} y1={esc(gap.topo) + 0.5} y2={esc(gap.topo) + 0.5} stroke="rgb(255 255 255 / 0.22)" strokeWidth={1} />

          <BarraV chave="piso" x={xb(0)} yBase={y0} yTopo={esc(piso.topo)} cor={SERIE.s1} visto={visto} atraso={0} />
          <BarraV chave="gap" x={xb(1)} yBase={esc(gap.base)} yTopo={esc(gap.topo)} cor={SERIE.s2} visto={visto} atraso={0.12} />
          {/* total empilhado: mesma composição, separada por 2px de superfície */}
          {temGap ? (
            <>
              <motion.rect x={xb(2)} width={LARG_BARRA} fill={SERIE.s1}
                initial={reduz ? false : { y: y0, height: 0 }}
                animate={visto ? { y: esc(piso.topo), height: y0 - esc(piso.topo) } : { y: y0, height: 0 }} transition={transicao(reduz, 0.24)} />
              <BarraV chave="teto" x={xb(2)} yBase={esc(piso.topo) - 2} yTopo={esc(teto.topo)} cor={SERIE.s2} visto={visto} atraso={0.32} />
            </>
          ) : (
            <BarraV chave="teto" x={xb(2)} yBase={y0} yTopo={esc(teto.topo)} cor={SERIE.s1} visto={visto} atraso={0.24} />
          )}

          {rotulos.map((l) => (
            <motion.text key={l.i} {...fade(0.55 + l.i * 0.1)} x={xc(l.i)} y={l.y - 10} textAnchor="middle"
              className="fill-offwhite text-[13px] font-bold tabular-nums">{l.v}</motion.text>
          ))}
          {nomes.map((n, i) => (
            <text key={n} x={xc(i)} y={y0 + 22} textAnchor="middle" className="fill-muted-foreground text-xs">{n}</text>
          ))}
        </svg>
      </div>
      <TabelaSr legenda="Composição do valor em jogo por mês" linhas={[["Piso", brl(piso.valor)], ["Peças que faltam", brl(gap.valor)], ["Em jogo", brl(teto.valor)]]} />
    </figure>
  );
}
