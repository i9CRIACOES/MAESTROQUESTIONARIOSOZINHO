import type { Nivel, Resultado } from "./calc";
import { brl, num, pct } from "./format";

export interface Veredicto { k: Nivel; lamp: string; t: string; b: string }

export function verdict(r: Resultado): Veredicto {
  const fk = r.f.k, alta = r.m.lvl === "alta";
  if (fk === "ok")
    return { k: "ok", lamp: "Caso fechado",
      t: "Os números fecham sozinhos. A conversa não é se vale, é quando começa.",
      b: "Há " + brl(r.teto) + " por mês em jogo na sua operação de conteúdo, o equivalente a " + num(r.recursos, 1) +
        " recurso" + (r.recursos > 1 ? "s" : "") + " alocado" + (r.recursos > 1 ? "s" : "") + ". O Composer custa " + brl(r.preco) +
        ". Nessa proporção, a decisão deixa de ser de orçamento e passa a ser de prioridade: quanto tempo você ainda vai levar para destravar as peças que não saem." };
  if (fk === "warn" && alta)
    return { k: "ok", lamp: "Vale a conversa",
      t: "O seu caso não se decide pelo custo. Se decide pelo risco.",
      b: "O valor em jogo — " + brl(r.teto) + " por mês contra " + brl(r.preco) +
        " de mensalidade — fica na faixa em que a conta precisa ser feita com o time. Mas a sua exposição de marca é alta: " +
        "hoje o que impede uma peça fora do padrão de ir ao ar é gente, não software. Empresa que trata marca com esse zelo normalmente não compra ferramenta de produção por preço. Compra por controle." };
  if (fk === "warn")
    return { k: "warn", lamp: "Meça antes de decidir",
      t: "Está na zona em que a resposta depende de um número que você ainda não tem.",
      b: "Com " + brl(r.teto) + " por mês em jogo contra " + brl(r.preco) + " de mensalidade, a relação é defensável mas não é óbvia. " +
        "Antes de decidir, meça onde vão de fato as " + num(r.horasMes, 0) + " horas que a sua estrutura gasta por mês. Se a montagem for maior do que você estimou, o caso muda de faixa. Se for menor, não muda." };
  if (alta)
    return { k: "warn", lamp: "Vale a conversa — por outro motivo",
      t: "Pelo dinheiro, não. Pela governança da sua marca, sim.",
      b: "A sua operação é enxuta demais para o Composer se pagar por economia: há " + brl(r.teto) +
        " por mês em jogo contra " + brl(r.preco) + " de mensalidade, abaixo do limiar em que vale mudar de processo. Mas a sua marca hoje é governada por pessoas, e isso não escala nem com mais revisão nem com mais política. " +
        "Se o seu problema é quem pode publicar em nome da marca, a conversa é essa — e não é sobre custo de peça." };
  return { k: "err", lamp: "Não é para você hoje",
    t: "Nem o custo nem o risco justificam essa conversa agora.",
    b: "Há " + brl(r.teto) + " por mês em jogo contra " + brl(r.preco) +
      " de mensalidade de entrada do Composer — abaixo do limiar em que vale mudar de processo — e a sua exposição de marca é " + r.m.lvl +
      ". Isso é uma boa notícia sobre a sua operação, não um problema. Em vez de produção, o ganho mais provável na sua escala está em custo de mídia e receita por disparo — que é outra conversa, e a gente também tem ela. Não marque uma sessão sobre Composer só para confirmar isto." };
}

export function explainValor(r: Resultado): string {
  return "São " + brl(r.piso) + " por mês que a sua estrutura já gasta hoje em montagem e versionamento — trabalho que existe quer você cresça ou não — mais " +
    brl(r.custoGap) + " que custaria produzir, com a estrutura atual, as " + num(r.gap, 0) +
    " peças a mais que você disse que faria. Isso não é economia prometida: é o tamanho do que está em disputa, ao seu próprio custo.";
}

export function explainMarca(r: Resultado): string {
  const p = r.marca >= 60 ? "A sua marca hoje é governada por gente. "
    : r.marca >= 35 ? "A sua marca hoje é governada por processo e por gente, em partes iguais. "
    : "A sua marca hoje está relativamente protegida por estrutura, não por vigilância. ";
  return p + "Revisão humana funciona até o volume dobrar — e aí ou o revisor vira gargalo, ou alguma coisa passa. " +
    "A pergunta que decide não é se o seu time é cuidadoso. É quantas peças por mês ele consegue olhar uma a uma sem virar fila.";
}

/** Bloco de destaque. `b` é HTML fixo (sem dado do usuário), seguro para dangerouslySetInnerHTML. */
export function spot(r: Resultado): { h: string; b: string } | null {
  if (r.iaProibida) return { h: "Você não usa IA generativa com o nome da marca.",
    b: "<p>É a decisão mais defensável do mercado em 2026, e quem a tomou normalmente tomou por um motivo concreto: nenhuma ferramenta generativa consegue garantir que a peça número mil saia dentro da marca. Pedir para confiar na IA não é resposta para isso.</p>" +
      "<p>A proposta do Composer é a oposta. O template é travado <strong>antes</strong> de a IA entrar, e a trava é de software, não de política: a imagem que não muda, o texto fixo, o link, o botão. A IA só preenche o que foi explicitamente liberado. Em e-mail a trava desce a esse nível de detalhe; em SMS, push, WhatsApp e redes, a trava de DNA de marca vale igual.</p>" +
      "<p>Não é \"confie na IA\". É \"a IA não alcança\".</p>" };
  if (r.marca >= 60) return { h: "O volume é o que vai quebrar a sua governança — não a má-fé.",
    b: "<p>O erro que custa caro quase nunca é o óbvio. É a peça que passou: a mão com seis dedos no banner, o logo esticado, o tom que não é o da marca na milésima variação. Revisão humana pega as primeiras. É o volume que decide quantas passam.</p>" +
      "<p>Com o controle apoiado em revisão humana, cada peça a mais é uma peça a mais para alguém olhar. É por isso que operações com marca forte acabam limitando o próprio volume sem nunca decidir isso formalmente: a governança vira o teto de produção.</p>" +
      "<p>Travar o template por software inverte a relação. O padrão deixa de depender de quem revisou e passa a depender do que o sistema permite gerar.</p>" };
  return null;
}

export function flagText(r: Resultado): string {
  if (r.custoHora < 40) return "Uma checagem nos seus próprios números: " + brl(r.custo) + " por mês divididos por " + num(r.horasMes, 0) +
    " horas de produção dão " + brl(r.custoHora) + " por hora. É baixo demais para uma estrutura de marketing no Brasil. Provavelmente há mais peças contadas do que a estrutura entrega, ou menos horas por peça do que elas levam. Vale refazer as perguntas 2 e 4.";
  if (r.custoHora > 600) return "Uma checagem nos seus próprios números: " + brl(r.custo) + " por mês divididos por " + num(r.horasMes, 0) +
    " horas de produção dão " + brl(r.custoHora) + " por hora. É alto para trabalho de produção. O mais provável é que essa estrutura faça muito além de produzir peças. Isolando só a produção, a leitura fica mais justa.";
  return "";
}

export function tempoText(r: Resultado): string {
  return "A sua operação consome " + num(r.horasMes, 0) + " horas de gente por mês para produzir " + num(r.pecas, 0) +
    " peças. Pela sua própria estimativa, " + num(r.horasMont, 0) + " dessas horas são montagem, versionamento e configuração — " +
    pct(r.mont) + " do total, o equivalente a " + num(r.pessoas, 1) + " pessoa" + (r.pessoas > 1 ? "s" : "") +
    " em tempo integral dedicada" + (r.pessoas > 1 ? "s" : "") + " a trabalho que não aparece em portfólio nenhum.";
}

export function filaText(r: Resultado): string {
  const d = r.dias;
  const t = "Da ideia aprovada ao ar passam " + num(d, 1) + " dias úteis. Essa é a sua janela mínima de reação: nenhuma oportunidade que apareça e morra em menos tempo do que isso é aproveitável pela sua operação. ";
  if (d >= 11) return t + "Com mais de duas semanas de fila, o calendário comercial decide por você — só entra no ar o que foi planejado com um mês de antecedência. Campanha de oportunidade, resposta a concorrente e teste em campanha viva ficam fora, por construção.";
  if (d >= 6) return t + "Com mais de uma semana, testar fica caro: cada variação custa uma passagem inteira pela fila, e é por isso que o teste sempre perde para a entrega.";
  return t + "A sua fila é curta para o padrão de mercado. Se o volume também não incomoda, o gargalo da sua operação está em outro lugar.";
}

export function eqText(r: Resultado): string {
  return "Visto por outro ângulo, sem nenhuma premissa: o Composer custa " + brl(r.preco) + " por mês e a sua estrutura de produção custa " +
    brl(r.custo) + ". Para empatar, ele precisa devolver " + pct(r.frac) + " da capacidade dessa estrutura — o equivalente a " +
    num(r.pecasEq, 1) + " peça" + (r.pecasEq > 1 ? "s" : "") + " ou " + num(r.horasEq, 0) + " horas por mês, sobre as " + num(r.horasMes, 0) +
    " que você já gasta. Compare esse número com as " + num(r.horasMont, 0) + " horas que hoje vão para montagem.";
}

// ---- Textos que no original ficam dentro de show() ----

export function pisoExp(r: Resultado): string {
  return pct(r.mont) + " da sua estrutura está em montagem e versionamento. Esse número não depende de você crescer.";
}

export function tetoExp(r: Resultado): string {
  return r.mult > 1
    ? "Inclui o custo de produzir as " + num(r.gap, 0) + " peças a mais que você disse que faria. Se a ambição não se concretizar, vale o piso."
    : "Você disse que manteria o volume de hoje. Sem gap de capacidade, teto e piso são o mesmo número.";
}

/** `html` é texto fixo + valores formatados (sem dado digitado pelo usuário). */
export function relacao(r: Resultado): { destaque: string; html: string } {
  const ratio = r.preco > 0 ? r.teto / r.preco : 0;
  if (ratio >= 1)
    return { destaque: num(ratio, 1) + "×",
      html: "é quanto o valor em jogo na sua operação é maior que a mensalidade do Maestro Composer, que começa em <strong>" +
        brl(r.preco) + " por mês</strong>. A conta não diz que você economiza isso: diz o tamanho do que está em disputa ao lado do que custa disputar." };
  return { destaque: brl(r.preco),
    html: "é a mensalidade de entrada do Maestro Composer. Na sua operação, o valor em jogo hoje é <strong>menor do que isso</strong> — é por esse motivo, e só por ele, que o primeiro farol está vermelho." };
}

export function contas(r: Resultado) {
  return {
    peca: brl(r.custo) + " ÷ " + num(r.pecas, 0) + " peças = " + brl(r.custoPeca) + " por peça",
    hora: brl(r.custo) + " ÷ (" + num(r.pecas, 0) + " × " + num(r.horas, 1) + " h) = " + brl(r.custoHora) + " por hora",
    piso: brl(r.custo) + " × " + pct(r.mont) + " = " + brl(r.piso) + " por mês",
    teto: brl(r.piso) + " + (" + num(r.gap, 0) + " × " + brl(r.custoPeca) + ") = " + brl(r.teto) + " por mês",
    rec: brl(r.teto) + " ÷ " + brl(r.rec) + " = " + num(r.recursos, 1) + " pessoa" + (r.recursos > 1 ? "s" : ""),
  };
}

export function recursoTexto(r: Resultado): string {
  return "Na régua de " + brl(r.rec) + " por recurso alocado, isso equivale a " + num(r.recursos, 1) +
    " pessoa" + (r.recursos > 1 ? "s" : "") + " dedicada" + (r.recursos > 1 ? "s" : "") + " em tempo integral. Ajuste esse valor abaixo se na sua empresa ele for outro.";
}

export function montagemRotulo(r: Resultado): string {
  return "horas por mês em montagem e versionamento — " + num(r.pessoas, 1) + " pessoa" + (r.pessoas > 1 ? "s" : "") + " em tempo integral";
}
