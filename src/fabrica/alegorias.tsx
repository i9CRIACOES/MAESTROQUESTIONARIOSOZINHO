import { useEffect, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle, Ban, Bot, Building2, Check, PowerOff, Rocket, X, CalendarDays, ClipboardCheck, Cog, DoorOpen, Eye, HelpCircle, Lock, Tag, UserCheck, UserRound, Users,
} from "lucide-react";
import type { StepId } from "@/domain/steps";
import { PERGUNTA_POR_ID } from "@/domain/steps";
import { cn } from "@/lib/utils";
import { PECAS } from "./Esteira";

const EASE = [0.23, 1, 0.32, 1] as const;
type Props = { i: number | undefined; aoEscolher?: (i: number) => void };

/** Peça pequena (os mesmos ícones da esteira). */
function Peca({ n, className, mini = false }: { n: number; className?: string; mini?: boolean }) {
  const { Icone, cor } = PECAS[n % PECAS.length];
  return (
    <span className={cn("grid place-items-center rounded-md border border-white/15 bg-navy shadow-[0_2px_4px_oklch(0.05_0.03_265/0.6)]", mini ? "size-4 rounded-[4px] md:size-6 md:rounded-md" : "size-6 md:size-8", cor, className)}>
      <Icone className={mini ? "size-2.5 md:size-3.5" : "size-3.5 md:size-5"} strokeWidth={2.2} />
    </span>
  );
}

function Legenda({ children }: { children: ReactNode }) {
  return <p className="absolute inset-x-3 bottom-2.5 text-center text-xs font-semibold text-muted-foreground md:bottom-4 md:text-sm">{children}</p>;
}

const valor = (id: StepId, i: number | undefined) => (i === undefined ? undefined : PERGUNTA_POR_ID[id].opcoes[i]?.valor);

// 1 · Quem: a casa, a agência, ou as duas ligadas.
function Quem({ i }: Props) {
  const casa = i === 0 || i === 2;
  const agencia = i === 1 || i === 2;
  const Zona = ({ on, Icone, nome }: { on: boolean; Icone: typeof Users; nome: string }) => (
    <motion.div
      animate={{ opacity: on ? 1 : 0.35, transform: on ? "scale(1.06)" : "scale(1)" }}
      transition={{ duration: 0.35, ease: EASE }}
      className={cn("grid place-items-center gap-2 rounded-2xl border p-4 md:p-6", on ? "border-ciano/60 bg-ciano/10 text-ciano" : "border-white/10 text-muted-foreground")}
    >
      <Icone className="size-9 md:size-14" strokeWidth={1.6} />
      <span className="text-xs font-bold md:text-sm">{nome}</span>
    </motion.div>
  );
  return (
    <div className="flex items-center gap-3 md:gap-5">
      <Zona on={casa} Icone={Users} nome="Time da casa" />
      <motion.span
        className="h-0.5 w-8 origin-left rounded-full bg-ciano md:w-14"
        animate={{ transform: i === 2 ? "scaleX(1)" : "scaleX(0)", opacity: i === 2 ? 1 : 0 }}
        transition={{ duration: 0.4, ease: EASE }}
      />
      <Zona on={agencia} Icone={Building2} nome="Agência" />
    </div>
  );
}

// 2 · Peças por mês: a pilha cai no cesto, proporcional à faixa.
const PILHA = [12, 24, 40, 60, 84]; // mais peças, mesma ordem de grandeza entre as faixas
function Pecas({ i }: Props) {
  const n = i === undefined ? 0 : PILHA[i];
  return (
    <div className="flex flex-col items-center">
      <div className="flex h-32 w-64 flex-wrap-reverse content-start items-end justify-center gap-0.5 overflow-hidden px-1 md:h-64 md:w-[30rem] md:gap-1" key={i ?? "vazio"}>
        {Array.from({ length: n }).map((_, k) => (
          <motion.span
            key={k}
            initial={{ opacity: 0, transform: "translateY(-120px) rotate(-30deg)" }}
            animate={{ opacity: 1, transform: "translateY(0px) rotate(0deg)" }}
            transition={{ type: "spring", duration: 0.6, bounce: 0.25, delay: k * 0.012 }}
          >
            <Peca n={k} mini />
          </motion.span>
        ))}
        {n === 0 && <HelpCircle className="mb-6 size-10 text-white/25" />}
      </div>
      {/* O cesto. */}
      <div className="h-3 w-[17rem] rounded-b-2xl border-x-4 border-b-4 border-ciano/50 md:w-[32rem]" />
    </div>
  );
}

// 3 · Custo: a etiqueta balança mais (e cresce) quanto maior a faixa.
function Custo({ i }: Props) {
  const amp = i === undefined ? 3 : 6 + i * 4;
  const op = i === undefined ? null : PERGUNTA_POR_ID.custo.opcoes[i];
  return (
    <div className="flex flex-col items-center">
      <span className="size-3 rounded-full bg-white/40" />
      <motion.div
        key={i ?? "vazio"}
        style={{ transformOrigin: "50% 0%" }}
        initial={{ rotate: amp }}
        animate={{ rotate: [amp, -amp, amp * 0.6, -amp * 0.35, amp * 0.15, 0] }}
        transition={{ duration: 1.8, ease: "easeInOut" }}
        className="flex flex-col items-center"
      >
        <span className="h-8 w-px bg-white/40 md:h-12" />
        <motion.div
          animate={{ transform: `scale(${1 + (i ?? 0) * 0.07})` }}
          transition={{ duration: 0.4, ease: EASE }}
          className={cn("flex items-center gap-2 rounded-xl rounded-l-[2rem] border-2 py-3 pl-5 pr-4 shadow-[0_8px_16px_-6px_oklch(0.05_0.03_265/0.8)]", op ? "border-warn bg-warn text-ink" : "border-white/20 bg-navy text-muted-foreground")}
        >
          <Tag className="size-5 md:size-6" strokeWidth={2.2} />
          <span className="text-base font-extrabold md:text-xl">{op ? op.rotulo : "R$ ?"}</span>
        </motion.div>
      </motion.div>
    </div>
  );
}

// 4 · Horas: relógio que se enche a cada toque. Cada fatia é uma faixa de horas; mais cheio, mais tempo.
const HORAS_CURTO = ["1–2 h", "3–5 h", "6–10 h", "11–20 h", "20 h+"];

function Horas({ i, aoEscolher }: Props) {
  const total = HORAS_CURTO.length;
  const [sob, setSob] = useState<number | null>(null); // fatia sob o mouse
  const mostra = sob ?? i;
  const cheio = mostra === undefined ? 0 : (mostra + 1) / total;
  /** Fatia pelo ângulo do ponteiro, a partir das 12h no sentido horário. */
  const fatia = (e: { clientX: number; clientY: number; currentTarget: Element }) => {
    const b = e.currentTarget.getBoundingClientRect();
    const ang = (Math.atan2(e.clientX - (b.left + b.width / 2), -(e.clientY - (b.top + b.height / 2))) * 180) / Math.PI;
    return Math.min(total - 1, Math.floor(((ang + 360) % 360) / (360 / total)));
  };
  return (
    <div className="flex flex-col items-center gap-2">
      <motion.button
        type="button"
        tabIndex={-1}
        onPointerMove={(e) => { if (e.pointerType === "mouse") setSob(fatia(e)); }}
        onPointerLeave={() => setSob(null)}
        onClick={(e) => { setSob(null); aoEscolher?.(fatia(e)); }}
        whileTap={{ scale: 0.97 }}
        className="relative cursor-pointer touch-manipulation rounded-full outline-none"
        aria-label="Encher o relógio"
      >
        <svg viewBox="0 0 120 120" className="size-36 md:size-60">
          <circle cx="60" cy="60" r="54" fill="oklch(0.16 0.05 265)" stroke="oklch(0.82 0.15 210 / 0.5)" strokeWidth="3" />
          {/* O enchimento: um traço tão grosso quanto o raio vira fatia de pizza. */}
          <motion.circle
            cx="60" cy="60" r="25" fill="none" stroke={sob !== null ? "oklch(0.82 0.15 210 / 0.4)" : "oklch(0.82 0.15 210 / 0.7)"} strokeWidth="50"
            style={{ rotate: -90, transformOrigin: "60px 60px" }}
            initial={false}
            animate={{ pathLength: cheio }}
            transition={{ duration: 0.35, ease: EASE }}
          />
          {Array.from({ length: total }).map((_, k) => (
            <line key={k} x1="60" y1="60" x2="60" y2="7" stroke="oklch(0.16 0.05 265)" strokeWidth="1.5" transform={`rotate(${(k * 360) / total} 60 60)`} />
          ))}
          {Array.from({ length: 12 }).map((_, k) => (
            <line key={`m${k}`} x1="60" y1="8" x2="60" y2={k % 3 === 0 ? 16 : 13} stroke="oklch(0.93 0.02 280 / 0.7)" strokeWidth={k % 3 === 0 ? 3 : 1.5} transform={`rotate(${k * 30} 60 60)`} />
          ))}
          <circle cx="60" cy="60" r="18" fill="oklch(0.13 0.045 265)" />
          <text x="60" y="64" textAnchor="middle" className="fill-offwhite text-[11px] font-extrabold">
            {mostra === undefined ? "0 h" : HORAS_CURTO[mostra]}
          </text>
        </svg>
      </motion.button>
      <p className={cn("text-xs font-bold uppercase tracking-wider text-ciano md:text-sm", i === undefined && "animate-pulse")}>
        {i === undefined ? "Encha o relógio: clique na fatia" : `Escolhido: ${HORAS_CURTO[i]} por peça`}
      </p>
    </div>
  );
}

// 5 · Montagem: a engrenagem e a barra criação × montagem.
function Mont({ i }: Props) {
  const m = valor("mont", i) ?? 0.5;
  const pct = Math.round(m * 100);
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-4 px-4">
      <Cog className="girar size-16 text-ciano md:size-24" strokeWidth={1.4} style={{ animationDuration: `${8 - m * 6}s` }} />
      <div className={cn("w-full transition-opacity duration-300", i === undefined && "opacity-40")}>
        <div className="flex h-5 w-full overflow-hidden rounded-full bg-[oklch(0.62_0.2_300)] ring-1 ring-white/10">
          <motion.div className="h-full w-full origin-left bg-ciano" animate={{ transform: `scaleX(${m})` }} transition={{ duration: 0.6, ease: EASE }} />
        </div>
        <div className="mt-2 flex justify-between text-xs font-bold md:text-sm">
          <span className="text-ciano">Montagem {pct}%</span>
          <span className="text-[oklch(0.8_0.13_300)]">Criação {100 - pct}%</span>
        </div>
      </div>
    </div>
  );
}

// 6 · Dias de fila: um calendário de dias úteis que se enche até a peça ir ao ar.
const DIAS_QUADROS = [2, 4, 8, 15, 25];
const SEMANA = ["S", "T", "Q", "Q", "S"];
function Dias({ i }: Props) {
  const n = i === undefined ? 0 : DIAS_QUADROS[i];
  return (
    <div className="w-60 rounded-xl border border-white/12 bg-navy p-2.5 md:w-72 md:p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-offwhite/80">
          <CalendarDays className="size-4 text-warn" strokeWidth={2.2} /> Dias úteis na fila
        </span>
        <span className="text-sm font-black tabular-nums text-warn">{n || "–"}</span>
      </div>
      <div className="grid grid-cols-5 gap-1" key={i ?? "vazio"}>
        {SEMANA.map((d, k) => <span key={`d${k}`} className="text-center text-[9px] font-bold text-white/40">{d}</span>)}
        {Array.from({ length: 25 }).map((_, k) => {
          const cheio = k < n;
          const ultimo = k === n - 1;
          return (
            <motion.span
              key={k}
              initial={false}
              animate={cheio ? { backgroundColor: "oklch(0.8 0.16 75 / 0.85)", color: "oklch(0.15 0.04 265)" } : { backgroundColor: "oklch(1 0 0 / 0.04)", color: "oklch(1 0 0 / 0.3)" }}
              transition={{ duration: 0.2, delay: cheio ? k * 0.06 : 0 }}
              className="grid h-5 place-items-center rounded-[4px] text-[9px] font-bold tabular-nums md:aspect-square md:h-auto md:text-[10px]"
            >
              {ultimo ? (
                <motion.span initial={{ opacity: 0, transform: "scale(0.4)" }} animate={{ opacity: 1, transform: "scale(1)" }} transition={{ type: "spring", duration: 0.4, bounce: 0.4, delay: k * 0.06 + 0.2 }}>
                  <Rocket className="size-3 md:size-3.5" strokeWidth={2.6} />
                </motion.span>
              ) : k + 1}
            </motion.span>
          );
        })}
      </div>
    </div>
  );
}

// 7 · Teto: pilhas ×1, ×2, ×3, ×5, cada uma com 18 peças.
function Mult({ i }: Props) {
  const n = valor("mult", i) ?? 1;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-end gap-1.5 md:gap-2.5" key={i ?? "vazio"}>
        {Array.from({ length: n }).map((_, s) => (
          <motion.div
            key={s}
            className="grid grid-cols-3 gap-0.5"
            initial={{ opacity: 0, transform: "translateY(24px)" }}
            animate={{ opacity: i === undefined ? 0.35 : 1, transform: "translateY(0px)" }}
            transition={{ duration: 0.45, delay: s * 0.07, ease: EASE }}
          >
            {Array.from({ length: 18 }).map((_, k) => <Peca key={k} n={s + k} mini />)}
          </motion.div>
        ))}
      </div>
      <strong className="text-3xl font-extrabold text-ciano tabular-nums md:text-5xl">×{n}</strong>
    </div>
  );
}

// 8 · Mãos: quantas pessoas publicam com o nome da marca (as amarelas têm a chave).
const MAOS = [4, 12, 30, 48];
function Maos({ i }: Props) {
  const n = i === undefined ? 0 : MAOS[i];
  const pequeno = n > 12;
  return (
    <div className={cn("flex max-w-[18rem] flex-wrap justify-center md:max-w-[30rem]", pequeno ? "gap-0.5 md:gap-1" : "gap-1.5 md:gap-2")} key={i ?? "vazio"}>
      {Array.from({ length: n }).map((_, k) => (
        <motion.span
          key={k}
          initial={{ opacity: 0, transform: "translateY(10px) scale(0.6)" }}
          animate={{ opacity: 1, transform: "translateY(0px) scale(1)" }}
          transition={{ type: "spring", duration: 0.45, bounce: 0.3, delay: k * 0.02 }}
        >
          <UserRound className={cn(pequeno ? "size-5 md:size-8" : "size-9 md:size-12", k % 3 === 0 ? "text-warn" : "text-offwhite/80")} strokeWidth={2} />
        </motion.span>
      ))}
      {n === 0 && <Users className="size-14 text-white/20" strokeWidth={1.4} />}
    </div>
  );
}

// 9 · Trava: cadeado, checklist, olho ou porta aberta.
const TRAVAS = [
  { Icone: Lock, cor: "text-ok border-ok/60 bg-ok/10" },
  { Icone: ClipboardCheck, cor: "text-warn border-warn/60 bg-warn/10" },
  { Icone: Eye, cor: "text-warn border-warn/60 bg-warn/10" },
  { Icone: DoorOpen, cor: "text-err border-err/60 bg-err/10" },
];
function Trava({ i }: Props) {
  return (
    <div className="grid grid-cols-4 gap-2 md:grid-cols-2 md:gap-4">
      {TRAVAS.map(({ Icone, cor }, k) => (
        <motion.span
          key={k}
          animate={{ opacity: i === undefined || i === k ? 1 : 0.25, transform: i === k ? "scale(1.12)" : "scale(1)" }}
          transition={{ duration: 0.3, ease: EASE }}
          className={cn("grid size-14 place-items-center rounded-2xl border md:size-24", i === k ? cor : "border-white/10 text-muted-foreground")}
        >
          <Icone className="size-7 md:size-11" strokeWidth={1.6} />
        </motion.span>
      ))}
    </div>
  );
}

// 10 · Já escapou: o checklist da marca se marca item por item e leva um carimbo.
const CHECKS = ["Logo certo", "Tom da marca", "Jurídico aprovou", "Campanha atual"];
const CARIMBO_FURO = [
  { t: "Escapou!", c: "border-err text-err" },
  { t: "Já escapou", c: "border-warn text-warn" },
  { t: "Aprovado", c: "border-ok text-ok" },
  { t: "Sem registro", c: "border-white/40 text-white/60" },
];
function Furo({ i }: Props) {
  const estado = (k: number): "ok" | "x" | "?" | "vazio" => {
    if (i === undefined) return "vazio";
    if (i === 3) return "?";
    if (i === 2) return "ok";
    if (i === 0) return k === 1 || k === 2 ? "x" : "ok";
    return k === 3 ? "x" : "ok";
  };
  return (
    <div className="relative w-60 md:w-72" key={i ?? "vazio"}>
      <div className="rounded-xl border border-white/12 bg-navy p-3 md:p-4">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Checklist da marca</p>
        <ul className="space-y-1.5">
          {CHECKS.map((c, k) => {
            const st = estado(k);
            return (
              <li key={c} className="flex items-center gap-2 text-sm font-semibold md:text-base">
                <motion.span
                  initial={{ opacity: 0, transform: "scale(0.5)" }}
                  animate={{ opacity: 1, transform: "scale(1)" }}
                  transition={{ duration: 0.25, delay: 0.15 + k * 0.3, ease: EASE }}
                  className={cn(
                    "grid size-5 shrink-0 place-items-center rounded-[5px] border-2",
                    st === "ok" && "border-ok bg-ok text-ink",
                    st === "x" && "border-err bg-err text-ink",
                    st === "?" && "border-white/30 text-white/60",
                    st === "vazio" && "border-white/25",
                  )}
                >
                  {st === "ok" && <Check className="size-3.5" strokeWidth={3.2} />}
                  {st === "x" && <X className="size-3.5" strokeWidth={3.2} />}
                  {st === "?" && <span className="text-[11px] font-black">?</span>}
                </motion.span>
                <span className={cn(st === "x" && "text-err line-through decoration-2", st === "vazio" && "text-white/60")}>{c}</span>
              </li>
            );
          })}
        </ul>
      </div>
      {i !== undefined && (
        <motion.span
          initial={{ opacity: 0, transform: "rotate(-14deg) scale(1.6)" }}
          animate={{ opacity: 1, transform: "rotate(-14deg) scale(1)" }}
          transition={{ type: "spring", duration: 0.45, bounce: 0.35, delay: 1.4 }}
          className={cn("absolute -bottom-4 -right-3 rounded-lg border-[3px] bg-ink/90 px-2.5 py-1 text-sm font-black uppercase tracking-wider md:text-base", CARIMBO_FURO[i].c)}
        >
          {CARIMBO_FURO[i].t}
        </motion.span>
      )}
    </div>
  );
}

// 11 · IA: o chip de IA solta peças numa esteira até a marca. Liberada: tudo passa, com alerta.
// Caso a caso: umas passam, outras são barradas. Revisão humana: param no checkpoint. Não usa: chip desligado.
const IA_LEGENDA = ["Sem filtro: tudo vai ao ar", "Às vezes passa, às vezes não", "Uma pessoa confere cada peça", "IA desligada"];
function Ia({ i }: Props) {
  const desligada = i === 3;
  const pecaAnim = (k: number) => {
    if (i === 0) return { animate: { x: [0, 150] }, transition: { duration: 1.4, repeat: Infinity, ease: "linear" as const, delay: k * 0.47 } };
    if (i === 1)
      return k % 2
        ? { animate: { x: [0, 70, 70], opacity: [1, 1, 0] }, transition: { duration: 1.8, repeat: Infinity, ease: "easeOut" as const, delay: k * 0.6, times: [0, 0.5, 1] } }
        : { animate: { x: [0, 150] }, transition: { duration: 1.8, repeat: Infinity, ease: "linear" as const, delay: k * 0.6 } };
    return { animate: { x: [0, 70, 70, 150] }, transition: { duration: 2.7, repeat: Infinity, ease: "easeInOut" as const, delay: k * 0.9, times: [0, 0.35, 0.65, 1] } };
  };
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative h-24 w-64 md:[transform:scale(1.25)]" key={i ?? "vazio"}>
        <div className="absolute inset-x-12 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-white/10" />
        <div className={cn("absolute left-0 top-1/2 grid size-14 -translate-y-1/2 place-items-center rounded-2xl border-2 transition-colors duration-300", desligada ? "border-white/15 bg-white/5 text-white/30" : "border-[oklch(0.62_0.2_300)] bg-[oklch(0.62_0.2_300/0.18)] text-[oklch(0.8_0.13_300)]")}>
          <Bot className={cn("size-8", !desligada && "drop-shadow-[0_0_8px_oklch(0.62_0.2_300/0.8)]")} strokeWidth={2} />
          {desligada && <PowerOff className="absolute -right-1.5 -top-1.5 size-5 rounded-full bg-ink p-0.5 text-err" />}
        </div>
        {i !== undefined && i !== 3 && [0, 1, 2].map((k) => (
          <motion.div key={k} className="absolute left-14 top-1/2 -mt-3" initial={{ x: 0, opacity: 1 }} {...pecaAnim(k)}>
            <Peca n={k} className={cn(i === 0 && k === 1 && "ring-2 ring-err", i === 1 && k % 2 === 1 && "ring-2 ring-err")} />
          </motion.div>
        ))}
        {(i === 1 || i === 2) && (
          <span className={cn("absolute left-[8.6rem] top-0 grid size-7 place-items-center rounded-full", i === 2 ? "bg-ok text-ink" : "bg-warn text-ink")}>
            {i === 2 ? <UserCheck className="size-4" strokeWidth={2.6} /> : <Ban className="size-4" strokeWidth={2.6} />}
          </span>
        )}
        {i === 0 && <AlertTriangle className="absolute right-12 top-0 size-6 text-err" />}
        <div className="absolute right-0 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-xl border border-white/15 bg-navy">
          <Building2 className="size-6 text-offwhite/80" />
        </div>
      </div>
      <p className={cn("text-xs font-bold uppercase tracking-wider md:text-sm", i === undefined ? "text-white/40" : i === 0 ? "text-err" : i === 1 ? "text-warn" : i === 2 ? "text-ok" : "text-white/60")}>
        {i === undefined ? "Qual é a regra?" : IA_LEGENDA[i]}
      </p>
    </div>
  );
}

const ALEGORIAS: Record<StepId, (p: Props) => ReactNode> = {
  quem: Quem, pecas: Pecas, custo: Custo, horas: Horas, mont: Mont, dias: Dias, mult: Mult, maos: Maos, trava: Trava, furo: Furo, ia: Ia,
};

const LEGENDA: Partial<Record<StepId, (i: number) => string>> = {
  horas: (i) => `${PERGUNTA_POR_ID.horas.opcoes[i].rotulo} de gente por peça`,
  pecas: (i) => `${PERGUNTA_POR_ID.pecas.opcoes[i].rotulo} por mês`,
  maos: (i) => `${PERGUNTA_POR_ID.maos.opcoes[i].rotulo} com a chave da marca`,
};

/** Janela da máquina: a alegoria da estação, reagindo à opção escolhida. */
export function Alegoria({ id, i, aoEscolher }: { id: StepId; i: number | undefined; aoEscolher?: (i: number) => void }) {
  const A = ALEGORIAS[id];
  const legenda = id === "horas" ? undefined : i !== undefined ? LEGENDA[id]?.(i) : undefined;
  return (
    <div
      aria-hidden
      className="relative grid h-48 place-items-center overflow-hidden rounded-3xl border border-white/10 bg-[oklch(0.12_0.04_265/0.85)] shadow-[inset_0_1px_0_oklch(1_0_0/0.08),0_24px_48px_-24px_oklch(0.05_0.03_265)] md:h-[22rem]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(oklch(1_0_0/0.035)_1px,transparent_1px),linear-gradient(90deg,oklch(1_0_0/0.035)_1px,transparent_1px)] bg-[size:24px_24px]" />
      <div className={cn("relative", legenda && "-mt-6")}><A i={i} aoEscolher={aoEscolher} /></div>
      {legenda && <Legenda>{legenda}</Legenda>}
    </div>
  );
}
