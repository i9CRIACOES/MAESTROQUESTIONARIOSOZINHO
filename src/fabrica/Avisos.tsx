import { AnimatePresence, motion } from "framer-motion";
import { ClipboardCheck, ShieldCheck, Trophy } from "lucide-react";
import type { Conquista } from "@/flow/quiz";

const EASE = [0.23, 1, 0.32, 1] as const;

const CONQUISTAS: Record<Conquista, { titulo: string; texto: string; Icone: typeof Trophy }> = {
  recepcao: { titulo: "Recepção concluída", texto: "Crachá emitido. A linha de produção está aberta.", Icone: ClipboardCheck },
  operacao: { titulo: "Operação mapeada!", texto: "Sete estações, sete peças. Agora, a marca.", Icone: Trophy },
  marca: { titulo: "Marca auditada!", texto: "Todas as peças na esteira. O cofre está liberado.", Icone: ShieldCheck },
};

/** Aviso de conquista ao fim de cada fase. Não rouba o foco (aria-live). */
export function AvisoConquista({ conquista }: { conquista: Conquista | null }) {
  const c = conquista ? CONQUISTAS[conquista] : null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[calc(var(--cabecalho-h)+var(--mapa-h)+env(safe-area-inset-top)+0.5rem)] z-50 flex justify-center px-4" role="status" aria-live="polite">
      <AnimatePresence>
        {c && (
          <motion.div
            key={conquista}
            initial={{ opacity: 0, transform: "translateY(-12px) scale(0.96)" }}
            animate={{ opacity: 1, transform: "translateY(0px) scale(1)" }}
            exit={{ opacity: 0, transform: "translateY(-8px) scale(0.98)" }}
            transition={{ duration: 0.3, ease: EASE }}
            className="flex items-center gap-3 rounded-2xl border border-warn/50 bg-[oklch(0.17_0.05_265/0.96)] py-3 pl-3 pr-5 shadow-[0_16px_40px_-12px_oklch(0.04_0.03_265)]"
          >
            <motion.span
              initial={{ transform: "rotate(-20deg) scale(0.8)" }}
              animate={{ transform: "rotate(0deg) scale(1)" }}
              transition={{ type: "spring", duration: 0.6, bounce: 0.35 }}
              className="grid size-11 shrink-0 place-items-center rounded-xl bg-warn text-ink"
            >
              <c.Icone className="size-6" strokeWidth={2.2} />
            </motion.span>
            <div>
              <p className="font-extrabold leading-tight">{c.titulo}</p>
              <p className="text-sm leading-snug text-muted-foreground">{c.texto}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Fala do robô dentro da estação, logo abaixo das opções (não flutua, não cobre nada). */
export function FalaDoRobo({ texto }: { texto: string | null }) {
  return (
    <div className="mt-4 min-h-14" role="status" aria-live="polite">
      <AnimatePresence mode="wait">
        {texto && (
          <motion.p
            key={texto}
            initial={{ opacity: 0, transform: "translateY(6px) scale(0.97)" }}
            animate={{ opacity: 1, transform: "translateY(0px) scale(1)" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="flex items-center gap-3 rounded-2xl border border-ciano/35 bg-[oklch(0.17_0.05_265/0.9)] py-2 pl-2 pr-4 text-sm font-medium text-offwhite md:text-base"
          >
            <span aria-hidden className="robo-mini block shrink-0 text-[36px]" />
            {texto}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
