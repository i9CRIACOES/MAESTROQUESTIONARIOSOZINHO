/** Cabeçalho da planilha "RESPOSTAS VC SABIA MAESTRO". A mesma lista está no Code node do n8n (teste na Task 11). */
export const COLUNAS = [
  "Data/hora", "ID", "Nome", "E-mail", "Empresa", "Cargo", "WhatsApp", "Setor", "Faturamento",
  "Quem produz", "Peças/mês", "Custo da estrutura", "Horas/peça", "% montagem", "Dias de fila", "Peças sem fila",
  "Mãos que publicam", "O que trava", "Já escapou", "Posição sobre IA",
  "Custo/peça", "Custo/hora", "Horas de montagem/mês", "Piso", "Teto", "Recursos equivalentes",
  "Farol dinheiro", "Score marca", "Farol marca", "Veredicto",
  "Pediu sessão", "Vídeo assistido (%)", "Números ajustados", "Origem (?o=)", "UTMs", "Dispositivo",
] as const;

export type Coluna = (typeof COLUNAS)[number];
