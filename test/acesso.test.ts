import { afterEach, describe, expect, it, vi } from 'vitest';
import { solicitarAcesso, carregarDiagnostico, tokenDaUrl } from '../src/data/acesso';
afterEach(() => vi.unstubAllGlobals());
describe('acesso por e-mail', () => {
  it('aceita somente o token completo no fragmento da URL', () => {
    expect(tokenDaUrl('#resultado=' + 'a'.repeat(64))).toBe('a'.repeat(64));
    for (const hash of ['', '#resultado=../../arquivo', '#resultado=abc', '#resultado=' + 'g'.repeat(64)]) expect(tokenDaUrl(hash)).toBeNull();
  });
  it('não considera erro HTTP como acesso enviado', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ erro: 'Tente novamente.' }), { status: 503 })));
    await expect(solicitarAcesso({ id: 'x', contato: { nome: 'Teste', email: 'teste@example.com', empresa: 'Teste', cargo: 'Teste', whatsapp: '' }, respostas: {}, setor: 'Varejo', fat: '', isca: false })).rejects.toThrow('Tente novamente.');
  });
  it('solicitação aceita não recebe token nem resultados', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{"ok":true}', { status: 202 })));
    await expect(solicitarAcesso({ id: 'x', contato: { nome: 'Teste', email: 'teste@example.com', empresa: 'Teste', cargo: 'Teste', whatsapp: '' }, respostas: {}, setor: 'Varejo', fat: '', isca: false })).resolves.toBeUndefined();
  });
  it('carrega resultado com token em cabeçalho, sem expô-lo no caminho HTTP', async () => {
    const f = vi.fn().mockResolvedValue(new Response('{"id":"teste"}'));
    vi.stubGlobal('fetch', f);
    await carregarDiagnostico('a'.repeat(64));
    expect(f.mock.calls[0][0]).toBe('/api/index.php?acao=resultado');
    expect(f.mock.calls[0][1].headers['X-Resultado-Token']).toBe('a'.repeat(64));
  });
});
