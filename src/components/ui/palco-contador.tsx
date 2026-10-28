import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Halo ciano atrás do número que acompanha o mouse (desktop), como nos contadores do Arsenal. */
export function PalcoContador({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const media = window.matchMedia("(min-width: 1024px) and (hover: hover) and (prefers-reduced-motion: no-preference)");
    let frame = 0, x = 0, y = 0, tx = 0, ty = 0;
    const tick = () => {
      x += (tx - x) * 0.08; y += (ty - y) * 0.08;
      el.style.setProperty("--palco-x", `${x}px`); el.style.setProperty("--palco-y", `${y}px`);
      frame = Math.abs(tx - x) + Math.abs(ty - y) > 0.03 ? requestAnimationFrame(tick) : 0;
    };
    const mover = (e: PointerEvent) => {
      if (!media.matches) return;
      const b = el.getBoundingClientRect();
      tx = Math.max(-12, Math.min(12, ((e.clientX - b.left - b.width / 2) / (b.width / 2)) * 12));
      ty = Math.max(-12, Math.min(12, ((e.clientY - b.top - b.height / 2) / (b.height / 2)) * 12));
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const zerar = () => { tx = 0; ty = 0; if (!frame) frame = requestAnimationFrame(tick); };
    el.addEventListener("pointermove", mover); el.addEventListener("pointerleave", zerar);
    return () => { cancelAnimationFrame(frame); el.removeEventListener("pointermove", mover); el.removeEventListener("pointerleave", zerar); };
  }, []);
  return <div ref={ref} className={cn("palco-contador", className)}>{children}</div>;
}
