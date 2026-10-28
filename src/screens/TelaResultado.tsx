import { Contagem } from "@/components/Contagem";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import type { Nivel, Resultado } from "@/domain/calc";
import type { CamposAjuste } from "@/domain/entradas";
import { brl, num } from "@/domain/format";
import * as L from "@/domain/readings";
import { cn } from "@/lib/utils";
import { AjusteNumeros } from "./AjusteNumeros";

const COR: Record<Nivel, string> = { ok: "text-ok", warn: "text-warn", err: "text-err" };
const LAMPADA: Record<Nivel, string> = { ok: "bg-ok", warn: "bg-warn", err: "bg-err" };

function Lampada({ k, texto }: { k: Nivel; texto: string }) {
  return (
    <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold">
      <span className={cn("size-2.5 rounded-full shadow-[0_0_12px_currentColor]", LAMPADA[k], COR[k])} />
      {texto}
    </p>
  );
}

const cartao = "rounded-2xl border border-border bg-navy/70 p-5 md:p-6";

export function TelaResultado({ r, campos, aoAjustar, aoContinuar, tag }: {
  r: Resultado; campos: CamposAjuste; aoAjustar: (c: CamposAjuste) => void; aoContinuar: () => void; tag: string;
}) {
  const v = L.verdict(r);
  const rel = L.relacao(r);
  const destaque = L.spot(r);
  const c = L.contas(r);
  const alerta = L.flagText(r);

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ciano">A leitura · {tag}</p>
        <h2 className="mt-2 text-2xl font-extrabold md:text-3xl">O custo da sua fila</h2>
      </div>

      <section className={cn(cartao, "border-l-4", v.k === "ok" ? "border-l-ok" : v.k === "warn" ? "border-l-warn" : "border-l-err")}>
        <Lampada k={v.k} texto={v.lamp} />
        <h3 className="mt-2 text-xl font-extrabold md:text-2xl">{v.t}</h3>
        <p className="mt-3 text-muted-foreground">{v.b}</p>
      </section>

      <section className={cartao}>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Farol 1 · O dinheiro</p>
        <p className="mt-1 text-sm text-muted-foreground">Valor em jogo por mês na sua operação de conteúdo</p>
        <Contagem valor={r.teto} formatar={brl} className={cn("mt-2 block text-5xl font-extrabold tracking-tight md:text-6xl", COR[r.f.k])} />
        <Lampada k={r.f.k} texto={r.f.t} />
        <p className="mt-3 text-muted-foreground">{L.explainValor(r)}</p>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-border p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Piso · já acontece hoje</p>
            <p className="mt-1 text-2xl font-bold">{brl(r.piso)}</p>
            <p className="mt-1 text-sm text-muted-foreground">{L.pisoExp(r)}</p>
          </div>
          <div className="rounded-xl border border-border p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Teto · com a sua ambição declarada</p>
            <p className="mt-1 text-2xl font-bold">{brl(r.teto)}</p>
            <p className="mt-1 text-sm text-muted-foreground">{L.tetoExp(r)}</p>
          </div>
        </div>
        <div className="mt-4 rounded-xl bg-ciano/10 p-4">
          <p className="text-3xl font-extrabold text-ciano">{rel.destaque}</p>
          <p className="mt-1 text-sm" dangerouslySetInnerHTML={{ __html: rel.html }} />
          <p className="mt-2 text-sm text-muted-foreground">{L.recursoTexto(r)}</p>
        </div>
      </section>

      <section className={cartao}>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Farol 2 · A marca</p>
        <p className="mt-1 text-sm text-muted-foreground">Exposição da sua marca na produção de conteúdo</p>
        <p className={cn("mt-2 text-5xl font-extrabold", COR[r.m.k])}>{r.marca}/100</p>
        <div className="mt-3 h-2 rounded-full bg-border">
          <div className="h-2 rounded-full bg-gradient-to-r from-ok via-warn to-err transition-[width] duration-700" style={{ width: `${r.marca}%` }} />
        </div>
        <div className="mt-1 flex justify-between text-[11px] text-muted-foreground"><span>Travada por software</span><span>Governada por gente</span></div>
        <Lampada k={r.m.k} texto={r.m.t} />
        <p className="mt-3 text-muted-foreground">{L.explainMarca(r)}</p>
      </section>

      {destaque && (
        <section className={cn(cartao, "border-violeta/40")}>
          <h3 className="text-lg font-extrabold">{destaque.h}</h3>
          <div className="mt-2 grid gap-2 text-muted-foreground [&_strong]:text-offwhite" dangerouslySetInnerHTML={{ __html: destaque.b }} />
        </section>
      )}

      <section className={cartao}>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Os números por trás</p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <div><p className="text-2xl font-bold">{brl(r.custoPeca)}</p><p className="text-sm text-muted-foreground">custo real de uma peça hoje</p></div>
          <div><p className="text-2xl font-bold">{brl(r.custoHora)}</p><p className="text-sm text-muted-foreground">custo de uma hora de produção</p></div>
          <div><p className="text-2xl font-bold">{num(r.horasMont, 0)} h</p><p className="text-sm text-muted-foreground">{L.montagemRotulo(r)}</p></div>
        </div>
        {alerta && <p role="note" className="mt-4 rounded-xl border border-warn/40 bg-warn/10 p-3 text-sm">{alerta}</p>}
        <p className="mt-4 text-muted-foreground">{L.tempoText(r)}</p>
        <p className="mt-3 text-muted-foreground">{L.filaText(r)}</p>
        <p className="mt-3 text-muted-foreground">{L.eqText(r)}</p>
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-semibold text-ciano">Como esta conta é feita</summary>
          <ul className="mt-2 grid gap-1 text-sm text-muted-foreground">
            <li>{c.peca}</li><li>{c.hora}</li><li>{c.piso}</li><li>{c.teto}</li><li>{c.rec}</li>
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">Nenhum número desta página é estimativa nossa. Todos saem das suas respostas.</p>
        </details>
      </section>

      <AjusteNumeros campos={campos} aoMudar={aoAjustar} />

      <div className="flex justify-end">
        <InteractiveHoverButton text="E o Maestro?" onClick={aoContinuar} className="w-48 border-ciano/40 py-3 text-base" />
      </div>
    </div>
  );
}
