export type StepId = "quem" | "pecas" | "custo" | "horas" | "mont" | "dias" | "mult" | "maos" | "trava" | "furo" | "ia";
export type Fase = "operacao" | "marca";
export interface Opcao {
  valor: number;
  rotulo: string;
}
export interface Pergunta {
  id: StepId;
  fase: Fase;
  eyebrow: string;
  pergunta: string;
  ajuda: string;
  opcoes: Opcao[];
}

export const FASE_NOME: Record<Fase, string> = { operacao: "Fase 1 · A operação", marca: "Fase 2 · A marca" };

export const SETORES = [
  "Varejo",
  "E-commerce / marketplace",
  "Moda e vestuário",
  "Serviços financeiros e seguros",
  "Saúde e bem-estar",
  "Educação",
  "Telecom",
  "Indústria e bens de consumo",
  "Energia e utilities",
  "Turismo e hospedagem",
  "Companhias aéreas",
  "Mobilidade e locação (carros, bikes, patinetes)",
  "Alimentos e bebidas",
  "Tecnologia e SaaS",
  "Agência de publicidade, marketing ou CRM",
  "Outro",
];

export const FATURAMENTOS = [
  "Até R$ 100 milhões",
  "De R$ 100 a 500 milhões",
  "De R$ 500 milhões a R$ 1 bilhão",
  "De R$ 1 a 5 bilhões",
  "Mais de R$ 5 bilhões",
];

const o = (valor: number, rotulo: string): Opcao => ({ valor, rotulo });

export const PERGUNTAS: Pergunta[] = [
  {
    id: "quem", fase: "operacao", eyebrow: "01 · Estrutura",
    pergunta: "Quem coloca as peças de pé hoje?",
    ajuda: "Peça é cada e-mail, push, SMS, WhatsApp ou post que vai ao ar. Três versões do mesmo e-mail para três segmentos contam como três peças.",
    opcoes: [o(1, "Time interno"), o(2, "Agência"), o(3, "Time interno e agência juntos")],
  },
  {
    id: "pecas", fase: "operacao", eyebrow: "02 · Volume",
    pergunta: "Quantas peças saem por mês?",
    ajuda: "Conte cada variação separada. Quase sempre o número é maior do que o time imagina.",
    opcoes: [o(12, "Até 20 peças"), o(35, "De 21 a 50"), o(95, "De 51 a 150"), o(260, "De 151 a 400"), o(600, "Mais de 400")],
  },
  {
    id: "custo", fase: "operacao", eyebrow: "03 · Custo",
    pergunta: "Quanto custa por mês a turma que produz essas peças?",
    ajuda: "Salários e encargos de quem põe a mão, mais o fee da agência. Só produção: sem mídia, sem time de dados, sem liderança.",
    opcoes: [
      o(10000, "Até R$ 15 mil"), o(26000, "De R$ 15 a 40 mil"), o(62000, "De R$ 40 a 90 mil"),
      o(130000, "De R$ 90 a 180 mil"), o(250000, "De R$ 180 a 350 mil"), o(450000, "Mais de R$ 350 mil"),
    ],
  },
  {
    id: "horas", fase: "operacao", eyebrow: "04 · Esforço",
    pergunta: "Uma única peça: quantas horas de gente ela consome, da ideia aprovada até o envio?",
    ajuda: "Some todo mundo que encosta nela: briefing, texto, arte, montagem, revisão, aprovação e configuração.",
    opcoes: [o(1.5, "1 a 2 horas"), o(4, "De 3 a 5 horas"), o(8, "De 6 a 10 horas"), o(15, "De 11 a 20 horas"), o(25, "Mais de 20 horas")],
  },
  {
    id: "mont", fase: "operacao", eyebrow: "05 · Natureza do trabalho",
    pergunta: "Desse tempo, quanto é montagem e quanto é criação de verdade?",
    ajuda: "Montar o HTML, trocar a imagem por segmento, adaptar o texto para a quinta variação, configurar o disparo. A parte que ninguém coloca no portfólio.",
    opcoes: [
      o(0.2, "Quase tudo é criação, montagem fica em uns 20%"),
      o(0.4, "Mais criação que montagem, uns 40% de montagem"),
      o(0.6, "Mais montagem que criação, uns 60%"),
      o(0.8, "Quase tudo é montagem, uns 80%"),
    ],
  },
  {
    id: "dias", fase: "operacao", eyebrow: "06 · Fila",
    pergunta: "Da ideia aprovada até a peça no ar, quantos dias úteis passam?",
    ajuda: "Tempo de calendário, não de trabalho. A espera entre uma etapa e outra também conta.",
    opcoes: [o(1.5, "1 a 2 dias"), o(4, "De 3 a 5 dias"), o(8, "De 6 a 10 dias"), o(15, "De 11 a 20 dias"), o(25, "Mais de 20 dias")],
  },
  {
    id: "mult", fase: "operacao", eyebrow: "07 · Teto",
    pergunta: "Se não existisse fila nem custo extra, quantas peças você soltaria por mês?",
    ajuda: "Pense no que o calendário comercial pediria, não no que a estrutura de hoje aguenta.",
    opcoes: [o(1, "O mesmo que hoje"), o(2, "Mais ou menos o dobro"), o(3, "Umas três vezes mais"), o(5, "Cinco vezes ou mais")],
  },
  {
    id: "maos", fase: "marca", eyebrow: "08 · Exposição",
    pergunta: "Quantas pessoas conseguem publicar algo com o nome da sua marca?",
    ajuda: "Todo mundo com permissão técnica de publicar, dentro e fora de casa: agência, estagiário, time regional, franqueado.",
    opcoes: [o(10, "De 1 a 3 pessoas"), o(25, "De 4 a 10"), o(35, "De 11 a 30"), o(40, "Mais de 30")],
  },
  {
    id: "trava", fase: "marca", eyebrow: "09 · Controle",
    pergunta: "O que de fato impede uma peça fora do padrão de ir ao ar?",
    ajuda: "Não o que está escrito no manual. O que realmente segura a peça antes do disparo.",
    opcoes: [
      o(0, "Software: o template não deixa sair do padrão"),
      o(15, "Checklist formal e revisão de uma pessoa"),
      o(25, "O olho de alguém que conhece a marca"),
      o(30, "Nada estruturado, a gente confia no time"),
    ],
  },
  {
    id: "furo", fase: "marca", eyebrow: "10 · Histórico",
    pergunta: "Alguma peça fora do padrão já escapou?",
    ajuda: "Logo errado, tom fora da marca, promessa que o jurídico não aprovaria, imagem de campanha antiga.",
    opcoes: [o(20, "Sim, nos últimos 12 meses"), o(12, "Sim, mas faz tempo"), o(0, "Não que eu saiba"), o(20, "Não saberíamos dizer")],
  },
  {
    id: "ia", fase: "marca", eyebrow: "11 · Posição sobre IA",
    pergunta: "E a IA generativa: qual é a regra real para ela criar peças com o nome da marca?",
    ajuda: "A regra que vale no dia a dia, não a do comunicado interno.",
    opcoes: [
      o(0, "Liberada, o time usa como achar melhor"),
      o(5, "Caso a caso, sem regra formal"),
      o(10, "Só com revisão humana, peça por peça"),
      o(10, "Não usamos IA generativa na comunicação da marca"),
    ],
  },
];

export const PERGUNTA_POR_ID = Object.fromEntries(PERGUNTAS.map((p) => [p.id, p])) as Record<StepId, Pergunta>;
