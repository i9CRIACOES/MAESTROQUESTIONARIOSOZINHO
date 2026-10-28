import { useEffect, type RefObject } from "react";

/** Botão magnético (ideia do motion-footer do 21st, sem GSAP): segue o mouse de leve e volta com mola.
 *  Só em desktop com mouse e sem "reduzir movimento". */
export function useMagnetico(ref: RefObject<HTMLElement | null>, forca = 0.3) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const media = window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    if (!media.matches) return;
    const mover = (e: PointerEvent) => {
      const b = el.getBoundingClientRect();
      const x = (e.clientX - b.left - b.width / 2) * forca;
      const y = (e.clientY - b.top - b.height / 2) * forca;
      el.style.transition = "transform 120ms cubic-bezier(0.23,1,0.32,1)";
      el.style.transform = `translate(${x}px, ${y}px) scale(1.04)`;
    };
    const soltar = () => {
      el.style.transition = "transform 700ms cubic-bezier(0.34,1.56,0.64,1)";
      el.style.transform = "";
    };
    el.addEventListener("pointermove", mover);
    el.addEventListener("pointerleave", soltar);
    return () => { el.removeEventListener("pointermove", mover); el.removeEventListener("pointerleave", soltar); };
  }, [ref, forca]);
}
