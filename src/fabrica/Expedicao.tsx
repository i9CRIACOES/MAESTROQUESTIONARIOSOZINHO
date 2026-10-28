import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CalendarCheck, Check, RotateCcw } from "lucide-react";
import { PalcoDoRobo } from "@/components/robo/palco";
import { usePerto } from "./rolar";
import { LogoMontado } from "./marca";
import { TextoGigante } from "@/components/ui/parallax";
import { useMagnetico } from "@/components/ui/magnetico";

const MARCOS = [25, 50, 75, 100];
const EASE = [0.23, 1, 0.32, 1] as const;

/** Expedição: o manifesto sai do desfoque, o robô entrega, e o convite para a sessão. */
export function Expedicao({ id, indice, aoAssistir, aoPedirSessao, aoTocarVideo }: {
  id: string; indice: number; aoAssistir: (pct: number) => void; aoPedirSessao: () => void; aoTocarVideo: () => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const palco = useRef<HTMLDivElement>(null);
  const botaoSessao = useRef<HTMLButtonElement>(null);
  useMagnetico(botaoSessao);
  const perto = usePerto(palco, "200px");
  const [src, setSrc] = useState<string | null>(null);
  const [pediu, setPediu] = useState(false);
  const atingidos = useRef(new Set<number>());

  useEffect(() => {
    setSrc(window.matchMedia("(max-width: 767px)").matches ? "/video/manifesto-480.mp4" : "/video/manifesto-720.mp4");
  }, []);

  /** Reporta só o maior marco recém-atingido (uma chamada), mesmo que o usuário pule vários de uma vez. */
  const reportar = (pct: number) => {
    const novos = MARCOS.filter((m) => pct >= m && !atingidos.current.has(m));
    if (novos.length === 0) return;
    for (const m of novos) atingidos.current.add(m);
    aoAssistir(Math.max(...novos));
  };
  const progresso = () => {
    const v = video.current;
    if (!v || !v.duration) return;
    reportar(Math.floor((v.currentTime / v.duration) * 100));
  };

  return (
    <section id={id} data-indice={indice} aria-labelledby={`${id}-t`} className="relative isolate overflow-x-clip px-5 pb-0 pt-20 md:px-8 md:pt-28">
      {/* Fim cinematográfico: brilho que respira e a palavra gigante subindo com a rolagem. */}
      <div aria-hidden className="respirar pointer-events-none absolute left-1/2 top-2/3 -z-10 h-[60vh] w-[90vw] -translate-x-1/2 -translate-y-1/2 rounded-[50%] bg-[radial-gradient(circle,oklch(0.82_0.15_210/0.16)_0%,oklch(0.62_0.2_300/0.12)_40%,transparent_70%)] blur-[80px]" />
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:items-center md:gap-14">
        <div>
          <div ref={palco} className="relative mx-auto h-[30vh] max-h-72 md:h-[44vh] md:max-h-none">
            {perto && <PalcoDoRobo className="h-full" />}
          </div>
          <h2 id={`${id}-t`} className="mt-6 text-balance text-[2rem] font-extrabold leading-[1.05] tracking-tight md:text-5xl">
            Como o Maestro pode ajudar a sua empresa?
          </h2>
          <p className="mt-4 max-w-[44ch] text-pretty leading-relaxed text-muted-foreground md:text-lg">
            Você já viu o tamanho da fila. Agora veja como ela some.
          </p>
        </div>

        <div>
          <motion.div
            initial={{ opacity: 0, filter: "blur(16px)", transform: "scale(0.96)" }}
            whileInView={{ opacity: 1, filter: "blur(0px)", transform: "scale(1)" }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 1.1, ease: EASE }}
            className="overflow-hidden rounded-3xl border border-ciano/30 bg-[oklch(0.08_0.02_265)] shadow-[0_40px_80px_-32px_oklch(0.04_0.03_265)]"
          >
            {src && (
              <video
                ref={video}
                src={src}
                poster="/video/manifesto-poster.jpg"
                controls
                playsInline
                preload="metadata"
                onPlay={aoTocarVideo}
                onTimeUpdate={progresso}
                onEnded={() => reportar(100)}
                className="aspect-video w-full"
              />
            )}
          </motion.div>

          <div className="mt-6 rounded-3xl border border-white/12 bg-navy/80 p-6 md:p-7">
            <h3 className="text-xl font-extrabold">Quer a leitura completa, com o seu time na sala?</h3>
            <p className="mt-2 text-pretty leading-relaxed text-muted-foreground">
              Uma sessão de 45 minutos sobre os seus números: onde a fila se forma, quais peças ela come primeiro, quantas mãos hoje tocam a sua marca e o que mudaria de fato na sua régua. Sem apresentação de produto.
            </p>
            {pediu ? (
              <motion.p
                role="status"
                initial={{ opacity: 0, transform: "translateY(6px)" }}
                animate={{ opacity: 1, transform: "translateY(0px)" }}
                transition={{ duration: 0.3, ease: EASE }}
                className="mt-5 inline-flex items-center gap-2 font-semibold text-ok"
              >
                <Check className="size-5" strokeWidth={3} /> Recebido. Respondemos em até um dia útil.
              </motion.p>
            ) : (
              <button
                ref={botaoSessao}
                type="button"
                onClick={() => { setPediu(true); aoPedirSessao(); }}
                className="mt-5 inline-flex min-h-14 cursor-pointer items-center gap-2 rounded-2xl bg-ciano px-6 text-base font-extrabold text-ink shadow-[0_12px_28px_-12px_oklch(0.82_0.15_210/0.8)] transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.98]"
              >
                <CalendarCheck className="size-5" strokeWidth={2.4} />
                Quero a sessão
              </button>
            )}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 flex min-h-12 cursor-pointer items-center gap-2 text-sm text-muted-foreground underline-offset-4 hover:text-offwhite hover:underline"
            >
              <RotateCcw className="size-4" /> Refazer o diagnóstico
            </button>
          </div>
        </div>
      </div>

      <div className="relative mx-auto mt-20 flex max-w-6xl flex-col items-center gap-3 pb-10 text-center md:mt-28">
        <LogoMontado className="w-56 md:w-72" />
        <p className="text-sm text-muted-foreground">Fim da linha. Todas as peças entregues.</p>
      </div>
      <TextoGigante texto="MAESTRO" distancia={90} className="pointer-events-none -mx-5 -mb-[4vw] text-center text-[24vw] md:-mx-8" />
    </section>
  );
}
