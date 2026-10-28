import { useEffect, useState } from "react";

/** Conta de 0 até `valor` com ease-out. Respeita "reduzir movimento". */
export function useContagem(valor: number, duracaoMs = 1600) {
  const [atual, setAtual] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setAtual(valor);
      return;
    }
    let raf = 0;
    const inicio = performance.now();
    const passo = (agora: number) => {
      const t = Math.min(1, (agora - inicio) / duracaoMs);
      setAtual(valor * (1 - (1 - t) ** 3));
      if (t < 1) raf = requestAnimationFrame(passo);
    };
    raf = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf);
  }, [valor, duracaoMs]);
  return atual;
}

export function Contagem({ valor, formatar, className }: { valor: number; formatar: (n: number) => string; className?: string }) {
  const atual = useContagem(valor);
  return <span className={className}>{formatar(atual)}</span>;
}
