/**
 * Lógica do Code node "Validar e limpar" do workflow principal.
 * A função é injetada no n8n via sanitizar.toString(): não pode usar nada de fora dela, exceto COLS.
 * Testes em test/sanitizar.test.ts.
 */
export const COLS = ["Data/hora","ID","Nome","E-mail","Empresa","Cargo","WhatsApp","Setor","Faturamento","Quem produz","Peças/mês","Custo da estrutura","Horas/peça","% montagem","Dias de fila","Peças sem fila","Mãos que publicam","O que trava","Já escapou","Posição sobre IA","Custo/peça","Custo/hora","Horas de montagem/mês","Piso","Teto","Recursos equivalentes","Farol dinheiro","Score marca","Farol marca","Veredicto","Pediu sessão","Vídeo assistido (%)","Números ajustados","Origem (?o=)","UTMs","Dispositivo"];

export function sanitizar(body) {
  const rejeitar = { _acao: 'rejeitar' };
  const b = body && typeof body === 'object' ? body : {};
  if (b.site) return { _acao: 'ignorar' };
  const linha = b.linha && typeof b.linha === 'object' ? b.linha : null;
  if (!linha || !['desbloqueio', 'atualizacao'].includes(b.evento)) return rejeitar;

  const id = typeof linha['ID'] === 'string' ? linha['ID'].trim() : '';
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return rejeitar;

  // Texto: aparado, protegido contra fórmula de planilha (= + - @ TAB CR) e limitado a 500 caracteres.
  const texto = (v) => {
    const cru = String(v ?? '');
    let s = cru.trim();
    if (/^[=+\-@]/.test(s) || /^[\t\r]/.test(cru)) s = "'" + s;
    return s.slice(0, 500);
  };

  if (b.evento === 'atualizacao') {
    const out = {};
    const sessao = typeof linha['Pediu sessão'] === 'string' ? linha['Pediu sessão'].trim() : '';
    if (sessao === 'Sim' || sessao === 'Não') out['Pediu sessão'] = sessao;
    const video = linha['Vídeo assistido (%)'];
    if (typeof video === 'number' && isFinite(video) && video >= 0 && video <= 100) out['Vídeo assistido (%)'] = video;
    const ajustes = linha['Números ajustados'];
    if (typeof ajustes === 'string' && ajustes.trim()) out['Números ajustados'] = texto(ajustes);
    if (Object.keys(out).length === 0) return rejeitar;
    return { _acao: 'atualizar', ID: id, ...out };
  }

  const out = {};
  for (const [k, v] of Object.entries(linha)) {
    if (!COLS.includes(k) || k === 'ID' || k === 'WhatsApp' || k === 'Data/hora') continue;
    out[k] = typeof v === 'number' ? (isFinite(v) ? v : '') : texto(v);
  }
  if (!out['Nome'] || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(out['E-mail'] || ''))) return rejeitar;
  out['WhatsApp'] = String(linha['WhatsApp'] ?? '').replace(/\D/g, '').slice(0, 15);
  out['Data/hora'] = new Date().toISOString();
  return { _acao: 'gravar', ID: id, ...out };
}
