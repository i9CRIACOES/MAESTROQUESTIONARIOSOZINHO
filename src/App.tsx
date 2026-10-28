import { Suspense, lazy, useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { MotionConfig } from "framer-motion";
import { som } from "@/audio/som";
import { FluxoConvergente } from "@/components/ui/fluxo-convergente";
import { depsDoNavegador, enviar, linhaAtualizacao, linhaDesbloqueio, reenviarPendentes } from "@/data/lead";
import { origemDoNavegador } from "@/data/origem";
import { solicitarAcesso } from "@/data/acesso";
import { calcular } from "@/domain/calc";
import { REACAO_PERFIL, REACOES, VOCE_SABIA } from "@/domain/conteudo";
import { ajustesDeCampos, camposIniciais, entradasDe, type CamposAjuste } from "@/domain/entradas";
import { verdict } from "@/domain/readings";
import { PERGUNTA_POR_ID, type StepId } from "@/domain/steps";
import {
  ESTACOES, ESTADO_INICIAL, SEQUENCIA, conquistaNova, estacaoFeita, idDaSecao, nivelDaSecao, numeroDaEstacao, progresso, quizReducer,
  respostasCompletas, respostasTravadas, secaoDesbloqueada, telaFeita, type Acao, type Conquista, type Contato, type Estado, type Estacao as EstacaoId,
} from "@/flow/quiz";
import { useEhDesktop } from "@/lib/useEhDesktop";
import { novoUuid } from "@/lib/uuid";
import { Alegoria } from "@/fabrica/alegorias";
import { AvisoConquista, FalaDoRobo } from "@/fabrica/Avisos";
import { Cabecalho } from "@/fabrica/Cabecalho";
import { Cofre } from "@/fabrica/Cofre";
import { Esteira } from "@/fabrica/Esteira";
import { Navegacao } from "@/fabrica/Navegacao";
import { TrilhoPassos } from "@/fabrica/MapaPassos";
import { Estacao, Opcoes } from "@/fabrica/Estacao";
import { Letreiro } from "@/fabrica/Letreiro";
import { Portao } from "@/fabrica/Portao";
import { Recepcao } from "@/fabrica/Recepcao";
import { rolarPara, useSecaoVisivel } from "@/fabrica/rolar";

// Painel e expedição só existem depois do cofre: ficam fora do pacote inicial.
const PainelResultado = lazy(() => import("@/dashboard/PainelResultado").then((m) => ({ default: m.PainelResultado })));
const Expedicao = lazy(() => import("@/fabrica/Expedicao").then((m) => ({ default: m.Expedicao })));

const TOTAL = ESTACOES.length;
/** Quanto dura a animação de cada passo (ms), para o celular só avançar depois que ela termina. */
const ANIMACAO_MS: Record<StepId, number> = {
  quem: 800, pecas: 1700, custo: 1000, horas: 600, mont: 800, dias: 2000, mult: 1000, maos: 1500, trava: 1000, furo: 1900, ia: 2700,
};
const INDICE_FINAL = SEQUENCIA.length - 1;
const ROTULO_FASE = { operacao: "A operação", marca: "A marca" } as const;

export default function App() {
  const [e, despachar] = useReducer(quizReducer, ESTADO_INICIAL);
  const [ligada, setLigada] = useState(false);
  const [previa, setPrevia] = useState<{ id: StepId; i: number } | null>(null);
  const [conquista, setConquista] = useState<Conquista | null>(null);
  const [campos, setCampos] = useState<CamposAjuste | null>(null);
  const [cofreAberto, setCofreAberto] = useState(false);
  const [painelPronto, setPainelPronto] = useState(false);
  const id = useMemo(() => novoUuid(), []);
  const desbloqueioEnviado = useRef(false);
  const iscaRef = useRef(false);
  const ajustesEnviadosRef = useRef<CamposAjuste | null>(null);
  const desktop = useEhDesktop();
  const visivel = useSecaoVisivel(painelPronto);
  const { feitos } = progresso(e);
  const travado = respostasTravadas(e);

  useEffect(() => {
    void reenviarPendentes(depsDoNavegador());
  }, []);

  // Trilha: o nível acompanha a seção que está no meio da tela (mesma régua da v1).
  useEffect(() => {
    som.definirNivel(nivelDaSecao(e, visivel));
  }, [visivel]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!conquista) return;
    const t = window.setTimeout(() => setConquista(null), 3600);
    return () => window.clearTimeout(t);
  }, [conquista]);

  // Assim que o cofre libera, baixa o painel e a expedição em segundo plano (a porta leva 2,6 s para abrir).
  const completas = respostasCompletas(e);
  useEffect(() => {
    if (!completas) return;
    void import("@/dashboard/PainelResultado");
    void import("@/fabrica/Expedicao");
  }, [completas]);

  const resultado = useMemo(() => {
    if (!respostasCompletas(e)) return null;
    return calcular(entradasDe(e.respostas, campos ? ajustesDeCampos(campos) : {}));
  }, [e, campos]);

  const atualizar = useCallback((m: Parameters<typeof linhaAtualizacao>[1]) => {
    void enviar({ evento: "atualizacao", linha: linhaAtualizacao(id, m) }, depsDoNavegador());
  }, [id]);

  /** Aplica uma resposta: som, reação e conquista. Devolve o estado novo (ou null se nada mudou). */
  const aplicar = (acao: Acao): Estado | null => {
    if (travado) return null;
    som.iniciar(); // dentro do clique: liga o som se a pessoa pulou o botão do portão
    const depois = quizReducer(e, acao);
    if (depois === e) return null;
    despachar(acao);
    som.tocar("selecao");
    const nova = conquistaNova(e, depois);
    if (nova) {
      setConquista(nova);
      window.setTimeout(() => som.tocar("fase"), 220);
    }
    return depois;
  };

  /** Na primeira resposta de uma estação, desce sozinho para a próxima seção depois que a animação da escolha aparece. */
  const avancarSeConcluiu = (s: EstacaoId, depois: Estado, atrasoMs: number) => {
    if (estacaoFeita(e, s) || !estacaoFeita(depois, s)) return;
    const indice = SEQUENCIA.findIndex((t) => (s === "perfil" ? t.tipo === "perfil" : t.tipo === "pergunta" && t.id === s));
    const proxima = SEQUENCIA[indice + 1];
    if (proxima) rolarPara(idDaSecao(proxima), atrasoMs);
  };

  const responder = (q: StepId) => (i: number) => {
    const depois = aplicar({ type: "responder", id: q, opcao: i });
    if (!depois) return;
    if (desktop) {
      avancarSeConcluiu(q, depois, 1600); // no desktop o mouse já mostrou a animação antes do clique
      return;
    }
    // Celular: sem mouse, a animação só aparece depois do toque. Mostra a janela e espera ela terminar.
    const janela = document.getElementById(`estacao-${q}-alegoria`)?.getBoundingClientRect();
    if (janela && (janela.top < 48 || janela.bottom > window.innerHeight * 0.75)) rolarPara(`estacao-${q}-alegoria`);
    avancarSeConcluiu(q, depois, ANIMACAO_MS[q] + 1800);
  };

  const mudarPerfil = (campo: "setor" | "fat", valor: string) => {
    const depois = aplicar({ type: "perfil", campo, valor });
    if (!depois) return;
    if (campo === "setor" && !e.setor && !depois.fat) rolarPara("recepcao-fat", 450); // 1 de 2 → 2 de 2
    avancarSeConcluiu("perfil", depois, 1000);
  };

  const ligar = () => {
    som.iniciar();
    som.tocar("fase");
    setLigada(true);
    som.definirNivel(Math.max(1, nivelDaSecao(e, visivel)));
    rolarPara("estacao-perfil", 450);
  };

  const enviarContato = async (c: Contato, isca: boolean) => {
    if (cofreAberto || !respostasCompletas(e)) return;
    await solicitarAcesso({ id, contato: c, respostas: e.respostas, setor: e.setor, fat: e.fat, isca });
    despachar({ type: "contato", contato: c });
    som.tocar("fase");
    setCofreAberto(true);
    const iniciais = camposIniciais(entradasDe(e.respostas));
    ajustesEnviadosRef.current = iniciais;
    setCampos(iniciais);
    iscaRef.current = isca;
    if (isca) return; // robô de spam: mostra o resultado, mas não grava nada
    if (desbloqueioEnviado.current) return; // envia no máximo uma vez por sessão
    desbloqueioEnviado.current = true;
    const r = calcular(entradasDe(e.respostas));
    void enviar(
      { evento: "desbloqueio", linha: linhaDesbloqueio({ id, agora: new Date(), contato: c, setor: e.setor, fat: e.fat, respostas: e.respostas, resultado: r, veredicto: verdict(r), origem: origemDoNavegador() }) },
      depsDoNavegador(),
    );
  };

  const abrirPainel = useCallback(() => {
    // O painel é liberado exclusivamente pela página acessada com o token do e-mail.
  }, []);

  /** Se a pessoa mexeu nos números, o lead recebe os ajustes (só quando o desbloqueio foi gravado, e só o que mudou). */
  const enviarAjustesSeMudou = useCallback(() => {
    const ultimo = ajustesEnviadosRef.current;
    if (!campos || !ultimo || iscaRef.current || !desbloqueioEnviado.current) return;
    if (!(Object.keys(ultimo) as (keyof CamposAjuste)[]).some((k) => campos[k] !== ultimo[k])) return;
    ajustesEnviadosRef.current = campos;
    atualizar({ ajustes: ajustesDeCampos(campos) });
  }, [campos, atualizar]);

  useEffect(() => {
    if (visivel === INDICE_FINAL) enviarAjustesSeMudou();
  }, [visivel]); // eslint-disable-line react-hooks/exhaustive-deps

  const continuarDoResultado = () => {
    enviarAjustesSeMudou();
    som.tocar("clique");
    rolarPara("expedicao");
  };

  const avisarLetreiro = useCallback(() => som.tocar("vocesabia"), []);

  const telaVisivel = SEQUENCIA[visivel];
  const feitas = ESTACOES.map((s) => estacaoFeita(e, s));
  const irParaEstacao = (i: number) => rolarPara(`estacao-${ESTACOES[i]}`);
  const navMostrar = !!telaVisivel && ["perfil", "pergunta", "vocesabia"].includes(telaVisivel.tipo);
  const navPronto = !!telaVisivel && telaFeita(e, telaVisivel);
  const proximaTela = SEQUENCIA[visivel + 1];
  const irPara = (i: number) => {
    som.iniciar();
    som.tocar("clique");
    rolarPara(idDaSecao(SEQUENCIA[i]));
  };
  const estacaoVisivel =
    telaVisivel?.tipo === "perfil" ? 1 : telaVisivel?.tipo === "pergunta" ? numeroDaEstacao(telaVisivel.id) : Math.min(feitos + 1, TOTAL);

  return (
    <MotionConfig reducedMotion="user">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-20 bg-[radial-gradient(60%_50%_at_85%_0%,oklch(0.55_0.25_295/0.16),transparent),radial-gradient(50%_45%_at_0%_100%,oklch(0.82_0.15_210/0.1),transparent)]" />
      <FluxoConvergente className="fixed inset-0 -z-10 opacity-45" />
      <Cabecalho noPortao={visivel === 0} estacao={estacaoVisivel} feitas={feitas} aoIr={irParaEstacao} />
      <TrilhoPassos mostrar={visivel > 0} feitas={feitas} atual={estacaoVisivel} aoIr={irParaEstacao} />

      <main className="pb-[calc(var(--esteira-h)+var(--nav-h)+env(safe-area-inset-bottom))] lg:pl-64">
        {SEQUENCIA.map((t, indice) => {
          const sid = idDaSecao(t);
          const aberta = secaoDesbloqueada(e, indice);
          switch (t.tipo) {
            case "intro":
              return <Portao key={sid} id={sid} indice={indice} ligada={ligada} aoLigar={ligar} desktop={desktop} />;
            case "perfil":
              return (
                <Estacao key={sid} id={sid} indice={indice} numero={1} total={TOTAL} setor="Recepção" titulo="Antes de tudo: onde a sua empresa joga?" desbloqueada={aberta}>
                  <Recepcao setor={e.setor} fat={e.fat} aoMudar={mudarPerfil} travado={travado} />
                  <FalaDoRobo texto={e.setor && e.fat ? REACAO_PERFIL : null} />
                </Estacao>
              );
            case "vocesabia":
              return <Letreiro key={sid} id={sid} indice={indice} card={VOCE_SABIA[t.card]} desbloqueado={aberta} aoAparecer={avisarLetreiro} />;
            case "pergunta": {
              const q = PERGUNTA_POR_ID[t.id];
              const n = numeroDaEstacao(t.id);
              return (
                <Estacao
                  key={sid} id={sid} indice={indice} numero={n} total={TOTAL} setor={ROTULO_FASE[q.fase]}
                  titulo={q.pergunta} ajuda={q.ajuda} desbloqueada={aberta} anterior={`a estação ${n - 1}`}
                  alegoria={<Alegoria id={t.id} i={previa?.id === t.id ? previa.i : e.respostas[t.id]} aoEscolher={responder(t.id)} />} lado={n % 2 ? "esq" : "dir"}
                >
                  <Opcoes
                    rotulo={q.pergunta} opcoes={q.opcoes.map((o) => o.rotulo)} escolhida={e.respostas[t.id]} aoEscolher={responder(t.id)} travado={travado}
                    aoPrever={(i) => setPrevia(i === null ? null : { id: t.id, i })}
                  />
                  <FalaDoRobo texto={e.respostas[t.id] !== undefined ? REACOES[t.id][e.respostas[t.id]!] : null} />
                </Estacao>
              );
            }
            case "contato":
              return (
                <Cofre
                  key={sid} id={sid} indice={indice} desbloqueado={aberta} aberto={cofreAberto} nome={e.contato?.nome}
                  aoEnviar={enviarContato} aoErro={() => som.tocar("erro")} aoAbrir={abrirPainel}
                />
              );
            case "calculando":
              return null; // acontece dentro do cofre
            case "resultado":
              return painelPronto && resultado && campos ? (
                <section key={sid} id={sid} data-indice={indice} aria-label="Painel de controle" className="px-5 py-20 md:px-8 md:py-24">
                  <div className="mx-auto max-w-6xl">
                    <Suspense fallback={<div className="min-h-[100dvh]" />}>
                      <PainelResultado r={resultado} campos={campos} aoAjustar={setCampos} aoContinuar={continuarDoResultado} tag={`${e.setor} · ${e.fat}`} respostas={e.respostas} />
                    </Suspense>
                  </div>
                </section>
              ) : null;
            case "final":
              return painelPronto ? (
                <Suspense key={sid} fallback={null}>
                <Expedicao
                  key={sid} id={sid} indice={indice}
                  aoTocarVideo={() => som.definirNivel(0)}
                  aoAssistir={(pct) => atualizar({ videoPct: pct })}
                  aoPedirSessao={() => atualizar({ pediuSessao: true, ajustes: campos ? ajustesDeCampos(campos) : undefined })}
                />
                </Suspense>
              ) : null;
          }
        })}
      </main>

      <AvisoConquista conquista={conquista} />
      <Navegacao
        mostrar={navMostrar}
        noPortao={visivel === 0}
        faltam={feitas.filter((f) => !f).length}
        podeVoltar={visivel > 1}
        podeAvancar={navPronto}
        rotuloProximo={proximaTela?.tipo === "contato" ? "Resultado" : "Próximo"}
        aoVoltar={() => irPara(visivel - 1)}
        aoAvancar={() => irPara(visivel + 1)}
      />
      <Esteira feitos={feitos} total={TOTAL} />
    </MotionConfig>
  );
}
