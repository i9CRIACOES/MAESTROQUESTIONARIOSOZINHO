import { motion } from "framer-motion";
import { BadgeCheck, CircleAlert, CircleSlash } from "lucide-react";
import type { Nivel } from "@/domain/calc";
import { useReduz } from "./movimento";

const COR: Record<Nivel, string> = { ok: "var(--ok)", warn: "var(--warn)", err: "var(--err)" };
const ICONE = { ok: BadgeCheck, warn: CircleAlert, err: CircleSlash } as const;

/** Textura de tinta falhada do carimbo (ruído SVG usado como máscara). */
const TINTA =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='7'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.2 1.75'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

/** Carimbo do veredicto: desce rápido, bate e assenta torto, como carimbo de verdade. */
export function Carimbo({ k, texto }: { k: Nivel; texto: string }) {
  const reduz = useReduz();
  const Icone = ICONE[k];
  return (
    <motion.div
      key={texto}
      initial={reduz ? false : { scale: 2.3, rotate: -16, opacity: 0 }}
      animate={{ scale: 1, rotate: -5, opacity: 1 }}
      transition={reduz ? { duration: 0 } : { type: "spring", stiffness: 560, damping: 26, mass: 0.9, delay: 0.35 }}
      className="inline-flex origin-center select-none"
      style={{ color: COR[k] }}
    >
      <span
        className="inline-flex items-center gap-2 rounded-lg border-[3px] border-current px-3.5 py-2 text-sm font-extrabold uppercase leading-none tracking-[0.14em] outline outline-1 outline-offset-[3px] outline-current md:text-base"
        style={{ maskImage: TINTA, WebkitMaskImage: TINTA, maskSize: "160px", WebkitMaskSize: "160px" }}
      >
        <Icone className="size-[1.15em]" strokeWidth={2.5} aria-hidden />
        {texto}
      </span>
    </motion.div>
  );
}
