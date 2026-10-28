import type { Contato, Estado } from '@/flow/quiz';

export interface DiagnosticoSalvo {
  id: string;
  contato: Pick<Contato, 'nome' | 'empresa' | 'cargo'>;
  respostas: Estado['respostas'];
  setor: string;
  fat: string;
}

export async function solicitarAcesso(dados: { id: string; contato: Contato; respostas: Estado['respostas']; setor: string; fat: string; isca: boolean }): Promise<void> {
  const r = await fetch('/api/index.php?acao=solicitar', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dados), signal: AbortSignal.timeout(20000),
  });
  const v = await r.json();
  if (!r.ok || v.ok !== true) throw new Error(v.erro || 'Não conseguimos enviar seu acesso. Tente novamente.');
}

export async function carregarDiagnostico(token: string, signal?: AbortSignal): Promise<DiagnosticoSalvo> {
  const r = await fetch('/api/index.php?acao=resultado', { headers: { 'X-Resultado-Token': token }, cache: 'no-store', signal });
  const v = await r.json();
  if (!r.ok) throw new Error(v.erro || 'Não conseguimos abrir seu diagnóstico. Tente novamente.');
  return v;
}

export function tokenDaUrl(hash: string): string | null {
  const token = new URLSearchParams(hash.replace(/^#/, '')).get('resultado');
  return token && /^[a-f0-9]{64}$/.test(token) ? token : null;
}
