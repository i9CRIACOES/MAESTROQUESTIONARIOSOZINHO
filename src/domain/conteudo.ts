import type { StepId } from "./steps";

export interface CardVoceSabia { numero: string; texto: string; fonte: string }

export const VOCE_SABIA: CardVoceSabia[] = [
  { numero: "3,6%", texto: "89% dizem que o criativo decide a performance. Só 3,6% otimizam o criativo de fato. A distância entre os dois números é a fila.", fonte: "EMARKETER com Perion · abril de 2026" },
  { numero: "78%", texto: "dos profissionais de marketing precisam de mais conteúdo personalizado do que conseguem produzir. Capacidade de produção é hoje o primeiro obstáculo da personalização.", fonte: "Salesforce, State of Marketing 2026 · 4.450 respondentes" },
  { numero: "72,1%", texto: "esperam a performance cair para mexer no criativo. Não por escolha: trocar o criativo custa uma nova passagem pela fila.", fonte: "EMARKETER com Perion · abril de 2026" },
  { numero: "<10%", texto: "dos ativos criativos são testados antes de ir ao ar. Criativo validado antes do lançamento está associado a +46% de receita.", fonte: "EMARKETER com Toluna · maio de 2026" },
];

export const REACAO_PERFIL = "Perfil montado. Agora vamos à operação.";

export const REACOES: Record<StepId, string[]> = {
  quem: ["Time da casa. Conhece a marca de cor.", "Agência no comando. Anotado.", "Casa e agência juntas. Mais mãos no jogo."],
  pecas: ["Operação enxuta. Vamos ver o custo.", "Volume em ritmo de cruzeiro.", "Volume de gente grande.", "Isso já é uma fábrica de peças.", "Mais de 400. A fila vira assunto sério."],
  custo: ["Estrutura leve. Anotado.", "Estrutura média. Anotado.", "Investimento considerável.", "Estrutura robusta.", "Estrutura de alto calibre.", "Operação de peso. Vamos à conta."],
  horas: ["Rápido. A peça sai em poucas horas.", "Ritmo comum de mercado.", "Quase um dia útil por peça.", "Mais de um dia de gente por peça.", "Cada peça vira um pequeno projeto."],
  mont: ["Time focado em criar. Bom sinal.", "Equilíbrio entre criar e montar.", "A montagem já come a maior parte.", "Quase tudo é montagem. Anotei."],
  dias: ["Fila curtíssima. Raro de ver.", "Quase uma semana de espera.", "Mais de uma semana na fila.", "Duas semanas ou mais esperando.", "Um mês de fila. Anotado."],
  mult: ["O volume de hoje dá conta. Anotado.", "O dobro. A ambição entrou na conta.", "Três vezes mais. Bastante peça parada.", "Cinco vezes ou mais. Muita peça na fila."],
  maos: ["Poucas mãos. Controle mais fácil.", "Um grupo pequeno publica.", "Já é bastante gente com acesso.", "Mais de 30 mãos na sua marca."],
  trava: ["Trava de software. Bem protegido.", "Processo formal, apoiado numa pessoa.", "O olho humano segura a marca.", "Confiança no time. Anotado."],
  furo: ["Aconteceu há pouco. Registrado.", "Já passou, mas aconteceu.", "Nenhum que você saiba.", "Sem visibilidade. Isso também conta."],
  ia: ["IA liberada. Anotado.", "Caso a caso, sem regra fixa.", "Revisão humana em cada peça.", "Sem IA na marca. Decisão firme."],
};
