import { useEffect, useState } from 'react';
import { PainelResultado } from '@/dashboard/PainelResultado';
import { carregarDiagnostico, type DiagnosticoSalvo } from '@/data/acesso';
import { depsDoNavegador, enviar, linhaAtualizacao, reenviarPendentes } from '@/data/lead';
import { calcular } from '@/domain/calc';
import { ajustesDeCampos, camposIniciais, entradasDe, type CamposAjuste } from '@/domain/entradas';
import { Expedicao } from '@/fabrica/Expedicao';
import { LogoMontado } from '@/fabrica/marca';

export function ResultadoPorEmail({ token }: { token: string | null }) {
  const [dados, setDados] = useState<DiagnosticoSalvo | null>(null);
  const [campos, setCampos] = useState<CamposAjuste | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);
  useEffect(() => { void reenviarPendentes(depsDoNavegador()); }, []);
  useEffect(() => {
    if (!token) { setErro('Este link está incompleto. Abra o link recebido no seu e-mail.'); return; }
    const ctrl = new AbortController();
    setErro(null);
    carregarDiagnostico(token, ctrl.signal).then(d => {
      setCampos(camposIniciais(entradasDe(d.respostas)));
      setDados(d);
    }).catch(e => { if (!ctrl.signal.aborted) setErro(e instanceof Error && e.name !== 'TypeError' ? e.message : 'Não conseguimos carregar seu diagnóstico. Confira a conexão e tente novamente.'); });
    return () => ctrl.abort();
  }, [token, tentativa]);
  const atualizar = (m: Parameters<typeof linhaAtualizacao>[1]) => {
    if (dados) void enviar({ evento: 'atualizacao', linha: linhaAtualizacao(dados.id, m) }, depsDoNavegador());
  };
  return <main className="mx-auto max-w-6xl px-5 py-10 md:px-8">
    <a href="/" aria-label="Maestro — início" className="inline-block w-48"><LogoMontado /></a>
    {erro ? <section className="py-20" aria-live="polite">
      <h1 className="text-3xl font-extrabold">Não foi possível abrir o diagnóstico</h1>
      <p role="alert" className="mt-4 max-w-xl text-muted-foreground">{erro}</p>
      {token && <button onClick={() => setTentativa(x => x + 1)} className="mt-6 rounded-xl bg-ciano px-5 py-3 font-bold text-ink">Tentar novamente</button>}
      <a href="/" className="ml-5 inline-block py-3 text-ciano underline underline-offset-4">Responder novamente</a>
    </section> : !dados || !campos ? <p role="status" className="py-20">Carregando seu diagnóstico…</p> : <>
      <h1 className="mb-10 mt-10 break-words text-3xl font-extrabold">Seu diagnóstico, {dados.contato.nome.split(' ')[0]}</h1>
      <PainelResultado r={calcular(entradasDe(dados.respostas, ajustesDeCampos(campos)))} campos={campos} aoAjustar={setCampos}
        aoContinuar={() => { atualizar({ ajustes: ajustesDeCampos(campos) }); document.getElementById('expedicao')?.scrollIntoView({ behavior: 'smooth' }); }}
        tag={`${dados.setor} · ${dados.fat}`} respostas={dados.respostas} />
      <Expedicao id="expedicao" indice={0} aoAssistir={videoPct => atualizar({ videoPct })}
        aoPedirSessao={() => atualizar({ pediuSessao: true, ajustes: ajustesDeCampos(campos) })} aoTocarVideo={() => {}} />
    </>}
  </main>;
}
