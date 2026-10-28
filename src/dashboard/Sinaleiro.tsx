import { motion } from "framer-motion";
import type { Nivel } from "@/domain/calc";
import { cn } from "@/lib/utils";
import { useReduz } from "./movimento";

const ORDEM: Nivel[] = ["err", "warn", "ok"];
const COR: Record<Nivel, string> = { ok: "var(--ok)", warn: "var(--warn)", err: "var(--err)" };
const NOME: Record<Nivel, string> = { ok: "verde", warn: "amarelo", err: "vermelho" };

/** Sinaleiro industrial de três lâmpadas; só a do nível acende. O texto ao lado garante que a cor nunca fala sozinha. */
export function Sinaleiro({ k, texto, rotulo, horizontal = false, className }: {
  k: Nivel; texto: string; rotulo: string; horizontal?: boolean; className?: string;
}) {
  const reduz = useReduz();
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        role="img"
        aria-label={`${rotulo}: sinal ${NOME[k]}`}
        className={cn(
          "relative flex shrink-0 gap-1.5 rounded-full border border-white/10 bg-ink/90 p-1.5 shadow-[inset_0_2px_4px_rgb(0_0_0/0.6)]",
          horizontal ? "flex-row" : "flex-col",
        )}
      >
        {ORDEM.map((n) => {
          const aceso = n === k;
          return (
            <span key={n} className="relative block size-3.5 rounded-full" style={{ background: COR[n], opacity: aceso ? 1 : 0.16 }}>
              {aceso && (
                <motion.span
                  className="absolute inset-0 rounded-full"
                  style={{ boxShadow: `0 0 10px 1px ${COR[n]}`, background: "radial-gradient(circle at 35% 30%, rgb(255 255 255 / 0.55), transparent 55%)" }}
                  animate={reduz ? undefined : { opacity: [1, 0.55, 1] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
            </span>
          );
        })}
      </div>
      <p className="text-sm font-semibold leading-snug text-offwhite">
        <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{rotulo}</span>
        {texto}
      </p>
    </div>
  );
}
