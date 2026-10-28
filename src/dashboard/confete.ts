/** Confete de comemoração (caso fechado). Carrega a biblioteca só quando precisa e respeita "reduzir movimento". */
export async function soltarConfete(): Promise<void> {
  if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const { default: confetti } = await import("canvas-confetti");
  const base = {
    particleCount: 70, spread: 62, startVelocity: 52, ticks: 220, gravity: 1.05, scalar: 0.95,
    colors: ["#00ddf9", "#41d686", "#f7be2b", "#edeaf7", "#833af0"], disableForReducedMotion: true, zIndex: 60,
  };
  confetti({ ...base, angle: 62, origin: { x: 0, y: 0.7 } });
  confetti({ ...base, angle: 118, origin: { x: 1, y: 0.7 } });
}
