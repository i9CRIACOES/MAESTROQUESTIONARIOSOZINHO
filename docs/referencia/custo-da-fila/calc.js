
(function(){
  "use strict";
  var PRECO = 6000, RECURSO = 25000;

  /* Tag de origem por onda: use /custo-da-fila?o=cmp-nc, ?o=ent-c, ?o=miar-nc etc. */
  var ORIGEM = (function(){
    try { return (new URLSearchParams(location.search).get('o') || '').slice(0, 40); }
    catch(e){ return ''; }
  })();

  var STEPS = [
    {id:'quem', g:'A operação', eyebrow:'01 · Estrutura',
     q:'Quem produz as peças de comunicação da sua empresa hoje?',
     help:'Peça é cada e-mail, push, SMS, WhatsApp ou post que vai ao ar. Três versões do mesmo e-mail para três segmentos contam como três peças.',
     opts:[[1,'Time interno'],[2,'Agência'],[3,'Time interno e agência juntos']]},
    {id:'pecas', g:'A operação', eyebrow:'02 · Volume',
     q:'Quantas peças a sua empresa publica por mês?',
     help:'Conte cada variação separadamente. Na maioria das operações esse número é bem maior do que o time imagina.',
     opts:[[12,'Até 20 peças'],[35,'De 21 a 50'],[95,'De 51 a 150'],[260,'De 151 a 400'],[600,'Mais de 400']]},
    {id:'custo', g:'A operação', eyebrow:'03 · Custo',
     q:'Quanto custa por mês a estrutura que produz essas peças?',
     help:'Salários e encargos de quem põe a mão, mais o fee da agência. Só produção: não inclua mídia, nem o time de dados, nem a liderança.',
     opts:[[10000,'Até R$ 15 mil'],[26000,'De R$ 15 a 40 mil'],[62000,'De R$ 40 a 90 mil'],[130000,'De R$ 90 a 180 mil'],[250000,'De R$ 180 a 350 mil'],[450000,'Mais de R$ 350 mil']]},
    {id:'horas', g:'A operação', eyebrow:'04 · Esforço',
     q:'Quantas horas de gente uma única peça consome, da ideia aprovada até o envio?',
     help:'Some todo mundo que encosta: briefing, texto, arte, montagem, revisão, aprovação e configuração na ferramenta.',
     opts:[[1.5,'1 a 2 horas'],[4,'De 3 a 5 horas'],[8,'De 6 a 10 horas'],[15,'De 11 a 20 horas'],[25,'Mais de 20 horas']]},
    {id:'mont', g:'A operação', eyebrow:'05 · Natureza do trabalho',
     q:'Desse tempo, quanto é montagem, versionamento e configuração — e quanto é estratégia e criação original?',
     help:'Montar o HTML, trocar a imagem por segmento, adaptar o texto para a quinta variação, configurar o disparo. É a parte que ninguém coloca no portfólio.',
     opts:[[0.2,'A maior parte é criação — montagem é cerca de 20%'],[0.4,'Mais criação que montagem — cerca de 40% é montagem'],[0.6,'Mais montagem que criação — cerca de 60%'],[0.8,'Quase tudo é montagem — cerca de 80%']]},
    {id:'dias', g:'A operação', eyebrow:'06 · Fila',
     q:'Da ideia aprovada até a peça no ar, quantos dias úteis passam?',
     help:'Tempo de calendário, não de trabalho. A espera entre as etapas conta.',
     opts:[[1.5,'1 a 2 dias'],[4,'De 3 a 5 dias'],[8,'De 6 a 10 dias'],[15,'De 11 a 20 dias'],[25,'Mais de 20 dias']]},
    {id:'mult', g:'A operação', eyebrow:'07 · Teto',
     q:'Se não houvesse fila nem custo adicional, quantas peças você publicaria por mês?',
     help:'A pergunta é sobre o que o calendário comercial pediria — não sobre o que a estrutura de hoje aguenta.',
     opts:[[1,'O mesmo que hoje'],[2,'Cerca do dobro'],[3,'Cerca de três vezes mais'],[5,'Cinco vezes ou mais']]},

    {id:'maos', g:'A marca', eyebrow:'08 · Exposição',
     q:'Quantas pessoas podem colocar no ar uma peça com o nome da sua marca?',
     help:'Conte todo mundo com a permissão técnica de publicar, dentro e fora de casa. Agência, estagiário, time regional, franqueado.',
     opts:[[10,'De 1 a 3 pessoas'],[25,'De 4 a 10'],[35,'De 11 a 30'],[40,'Mais de 30']]},
    {id:'trava', g:'A marca', eyebrow:'09 · Controle',
     q:'O que impede hoje que uma peça fora do padrão da marca vá ao ar?',
     help:'Não o que está escrito no manual — o que de fato trava a peça antes do disparo.',
     opts:[[0,'Software: o template não permite sair do padrão'],[15,'Checklist formal mais revisão de uma pessoa'],[25,'A revisão de alguém que conhece a marca'],[30,'Nada estruturado — confiamos no time']]},
    {id:'furo', g:'A marca', eyebrow:'10 · Histórico',
     q:'Alguma peça fora do padrão de marca já foi ao ar?',
     help:'Logo errado, tom fora da marca, promessa que o jurídico não aprovaria, imagem de campanha antiga.',
     opts:[[20,'Sim, nos últimos 12 meses'],[12,'Sim, mas faz tempo'],[0,'Não que eu saiba'],[20,'Não saberíamos dizer']]},
    {id:'ia', g:'A marca', eyebrow:'11 · Posição sobre IA',
     q:'Qual é hoje a posição da empresa sobre IA generativa produzir peças com o nome da marca?',
     help:'A posição real, não a do comunicado interno.',
     opts:[[0,'Liberado — o time usa como achar melhor'],[5,'Caso a caso, sem regra formal'],[10,'Só com revisão humana peça a peça'],[10,'Não usamos IA generativa na comunicação da marca']]}
  ];

  var S = {}, i = 0;
  function $(id){ return document.getElementById(id); }
  function brl(n){
    if(!isFinite(n)) return '—';
    if(n < 10) return 'R$ ' + n.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
    return 'R$ ' + Math.round(n).toLocaleString('pt-BR');
  }
  function pct(n){ return (n*100).toLocaleString('pt-BR',{maximumFractionDigits:n<0.1?1:0}) + '%'; }
  function num(n,d){ return n.toLocaleString('pt-BR',{maximumFractionDigits:d===undefined?1:d}); }
  function trimField(v, max){ return String(v || '').trim().slice(0, max); }
  function isValidEmail(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

  function ratioSummary(r){
    var ratio = r.preco > 0 ? r.teto / r.preco : 0;
    if(ratio >= 1){
      return num(ratio, 1) + '× teto vs Composer (' + brl(r.teto) + ' / ' + brl(r.preco) + ')';
    }
    return 'Teto ' + brl(r.teto) + ' abaixo da mensalidade Composer (' + brl(r.preco) + ')';
  }

  function buildContactMessage(r){
    var v = verdict(r);
    var lines = [
      'Lead · Diagnóstico Custo da Fila (/custo-da-fila)',
      ORIGEM ? 'Origem campanha (?o=): ' + ORIGEM : null,
      'Perfil: ' + ($('setor').value || '—') + ' · ' + ($('fat').value || '—'),
      '',
      'Veredicto: ' + v.lamp + ' — ' + v.t,
      'Relação Composer: ' + ratioSummary(r),
      '',
      'Farol operação (' + r.f.k + '): ' + r.f.t,
      'Teto: ' + brl(r.teto) + ' · Piso: ' + brl(r.piso) + ' · Recursos eq.: ' + num(r.recursos, 1),
      'Farol marca (' + r.m.lvl + '): ' + r.marca + '/100 — ' + r.m.t,
      '',
      'Peças/mês: ' + num(r.pecas, 0) + ' · Estrutura: ' + brl(r.custo) + '/mês',
      'Horas/peça: ' + num(r.horas, 1) + ' · Montagem: ' + pct(r.mont) + ' · Fila: ' + num(r.dias, 1) + ' du',
      'Ambição: ' + num(r.mult, 1) + 'x · Equilíbrio ~' + pct(r.frac) + ' da estrutura',
      'Custo/peça: ' + brl(r.custoPeca) + ' · Horas montagem/mês: ' + num(r.horasMont, 0),
      '',
      'Sliders: peças=' + $('t-pecas').value + ', custo=' + $('t-custo').value +
        ', horas=' + $('t-horas').value + ', mont%=' + $('t-mont').value +
        ', dias=' + $('t-dias').value + ', mult=' + $('t-mult').value +
        ', recurso=' + $('t-rec').value + ', composer=' + $('t-preco').value,
      'URL: ' + location.href
    ];
    return lines.filter(function(line){ return line !== null; }).join('\n').slice(0, 2000);
  }

  function calc(s){
    var preco = s.preco > 0 ? s.preco : 0;
    var rec   = s.rec > 0 ? s.rec : RECURSO;
    var pecas = Math.max(1, s.pecas);
    var custo = Math.max(1, s.custo);
    var horas = Math.max(0.25, s.horas);
    var mont  = Math.min(1, Math.max(0, s.mont));
    var mult  = Math.max(1, s.mult);

    var custoPeca = custo / pecas;
    var horasMes  = pecas * horas;
    var custoHora = custo / horasMes;
    var horasMont = horasMes * mont;
    var piso      = custo * mont;
    var gap       = pecas * (mult - 1);
    var custoGap  = gap * custoPeca;
    var teto      = piso + custoGap;
    var recursos  = teto / rec;
    var pessoas   = horasMont / 168;
    var frac      = preco / custo;
    var pecasEq   = preco / custoPeca;
    var horasEq   = preco / custoHora;

    var f;
    if(teto >= 25000)      f = {k:'ok',   t:'Verde — um recurso alocado ou mais', b:2};
    else if(teto >= 12000) f = {k:'warn', t:'Amarelo — perto de um recurso alocado', b:1};
    else                   f = {k:'err',  t:'Vermelho — abaixo do limiar de mudança', b:0};

    var marca = (s.maos||0) + (s.trava||0) + (s.furo||0) + (s.ia||0);
    var m;
    if(marca >= 60)      m = {k:'err',  t:'Exposição alta', lvl:'alta'};
    else if(marca >= 35) m = {k:'warn', t:'Exposição média', lvl:'média'};
    else                 m = {k:'ok',   t:'Exposição baixa', lvl:'baixa'};

    return {preco:preco,rec:rec,pecas:pecas,custo:custo,horas:horas,mont:mont,mult:mult,dias:s.dias,
      custoPeca:custoPeca,horasMes:horasMes,custoHora:custoHora,horasMont:horasMont,pessoas:pessoas,
      piso:piso,gap:gap,custoGap:custoGap,teto:teto,recursos:recursos,frac:frac,pecasEq:pecasEq,horasEq:horasEq,
      f:f,marca:marca,m:m,iaProibida:(s.iaLabel === 3)};
  }

  function verdict(r){
    var fk = r.f.k, alta = (r.m.lvl === 'alta');
    if(fk === 'ok')
      return {k:'ok', lamp:'Caso fechado',
        t:'Os números fecham sozinhos. A conversa não é se vale, é quando começa.',
        b:'Há ' + brl(r.teto) + ' por mês em jogo na sua operação de conteúdo, o equivalente a ' + num(r.recursos,1) +
          ' recurso' + (r.recursos>1?'s':'') + ' alocado' + (r.recursos>1?'s':'') + '. O Composer custa ' + brl(r.preco) +
          '. Nessa proporção, a decisão deixa de ser de orçamento e passa a ser de prioridade: quanto tempo você ainda vai levar para destravar as peças que não saem.'};
    if(fk === 'warn' && alta)
      return {k:'ok', lamp:'Vale a conversa',
        t:'O seu caso não se decide pelo custo. Se decide pelo risco.',
        b:'O valor em jogo — ' + brl(r.teto) + ' por mês contra ' + brl(r.preco) +
          ' de mensalidade — fica na faixa em que a conta precisa ser feita com o time. Mas a sua exposição de marca é alta: ' +
          'hoje o que impede uma peça fora do padrão de ir ao ar é gente, não software. Empresa que trata marca com esse zelo normalmente não compra ferramenta de produção por preço. Compra por controle.'};
    if(fk === 'warn')
      return {k:'warn', lamp:'Meça antes de decidir',
        t:'Está na zona em que a resposta depende de um número que você ainda não tem.',
        b:'Com ' + brl(r.teto) + ' por mês em jogo contra ' + brl(r.preco) + ' de mensalidade, a relação é defensável mas não é óbvia. ' +
          'Antes de decidir, meça onde vão de fato as ' + num(r.horasMes,0) + ' horas que a sua estrutura gasta por mês. Se a montagem for maior do que você estimou, o caso muda de faixa. Se for menor, não muda.'};
    if(alta)
      return {k:'warn', lamp:'Vale a conversa — por outro motivo',
        t:'Pelo dinheiro, não. Pela governança da sua marca, sim.',
        b:'A sua operação é enxuta demais para o Composer se pagar por economia: há ' + brl(r.teto) +
          ' por mês em jogo contra ' + brl(r.preco) + ' de mensalidade, abaixo do limiar em que vale mudar de processo. Mas a sua marca hoje é governada por pessoas, e isso não escala nem com mais revisão nem com mais política. ' +
          'Se o seu problema é quem pode publicar em nome da marca, a conversa é essa — e não é sobre custo de peça.'};
    return {k:'err', lamp:'Não é para você hoje',
      t:'Nem o custo nem o risco justificam essa conversa agora.',
      b:'Há ' + brl(r.teto) + ' por mês em jogo contra ' + brl(r.preco) +
        ' de mensalidade de entrada do Composer — abaixo do limiar em que vale mudar de processo — e a sua exposição de marca é ' + r.m.lvl +
        '. Isso é uma boa notícia sobre a sua operação, não um problema. Em vez de produção, o ganho mais provável na sua escala está em custo de mídia e receita por disparo — que é outra conversa, e a gente também tem ela. Não marque uma sessão sobre Composer só para confirmar isto.'};
  }

  function explainValor(r){
    return 'São ' + brl(r.piso) + ' por mês que a sua estrutura já gasta hoje em montagem e versionamento — trabalho que existe quer você cresça ou não — mais ' +
      brl(r.custoGap) + ' que custaria produzir, com a estrutura atual, as ' + num(r.gap,0) +
      ' peças a mais que você disse que faria. Isso não é economia prometida: é o tamanho do que está em disputa, ao seu próprio custo.';
  }
  function explainMarca(r){
    var p = r.marca >= 60 ? 'A sua marca hoje é governada por gente. '
          : r.marca >= 35 ? 'A sua marca hoje é governada por processo e por gente, em partes iguais. '
          : 'A sua marca hoje está relativamente protegida por estrutura, não por vigilância. ';
    return p + 'Revisão humana funciona até o volume dobrar — e aí ou o revisor vira gargalo, ou alguma coisa passa. ' +
      'A pergunta que decide não é se o seu time é cuidadoso. É quantas peças por mês ele consegue olhar uma a uma sem virar fila.';
  }
  function spot(r){
    if(r.iaProibida) return {h:'Você não usa IA generativa com o nome da marca.',
      b:'<p>É a decisão mais defensável do mercado em 2026, e quem a tomou normalmente tomou por um motivo concreto: nenhuma ferramenta generativa consegue garantir que a peça número mil saia dentro da marca. Pedir para confiar na IA não é resposta para isso.</p>' +
        '<p>A proposta do Composer é a oposta. O template é travado <strong>antes</strong> de a IA entrar, e a trava é de software, não de política: a imagem que não muda, o texto fixo, o link, o botão. A IA só preenche o que foi explicitamente liberado. Em e-mail a trava desce a esse nível de detalhe; em SMS, push, WhatsApp e redes, a trava de DNA de marca vale igual.</p>' +
        '<p>Não é "confie na IA". É "a IA não alcança".</p>'};
    if(r.marca >= 60) return {h:'O volume é o que vai quebrar a sua governança — não a má-fé.',
      b:'<p>O erro que custa caro quase nunca é o óbvio. É a peça que passou: a mão com seis dedos no banner, o logo esticado, o tom que não é o da marca na milésima variação. Revisão humana pega as primeiras. É o volume que decide quantas passam.</p>' +
        '<p>Com o controle apoiado em revisão humana, cada peça a mais é uma peça a mais para alguém olhar. É por isso que operações com marca forte acabam limitando o próprio volume sem nunca decidir isso formalmente: a governança vira o teto de produção.</p>' +
        '<p>Travar o template por software inverte a relação. O padrão deixa de depender de quem revisou e passa a depender do que o sistema permite gerar.</p>'};
    return null;
  }
  function flagText(r){
    if(r.custoHora < 40) return 'Uma checagem nos seus próprios números: ' + brl(r.custo) + ' por mês divididos por ' + num(r.horasMes,0) +
      ' horas de produção dão ' + brl(r.custoHora) + ' por hora. É baixo demais para uma estrutura de marketing no Brasil. Provavelmente há mais peças contadas do que a estrutura entrega, ou menos horas por peça do que elas levam. Vale refazer as perguntas 2 e 4.';
    if(r.custoHora > 600) return 'Uma checagem nos seus próprios números: ' + brl(r.custo) + ' por mês divididos por ' + num(r.horasMes,0) +
      ' horas de produção dão ' + brl(r.custoHora) + ' por hora. É alto para trabalho de produção. O mais provável é que essa estrutura faça muito além de produzir peças. Isolando só a produção, a leitura fica mais justa.';
    return '';
  }
  function tempoText(r){
    return 'A sua operação consome ' + num(r.horasMes,0) + ' horas de gente por mês para produzir ' + num(r.pecas,0) +
      ' peças. Pela sua própria estimativa, ' + num(r.horasMont,0) + ' dessas horas são montagem, versionamento e configuração — ' +
      pct(r.mont) + ' do total, o equivalente a ' + num(r.pessoas,1) + ' pessoa' + (r.pessoas>1?'s':'') +
      ' em tempo integral dedicada' + (r.pessoas>1?'s':'') + ' a trabalho que não aparece em portfólio nenhum.';
  }
  function filaText(r){
    var d = r.dias;
    var t = 'Da ideia aprovada ao ar passam ' + num(d,1) + ' dias úteis. Essa é a sua janela mínima de reação: nenhuma oportunidade que apareça e morra em menos tempo do que isso é aproveitável pela sua operação. ';
    if(d >= 11) return t + 'Com mais de duas semanas de fila, o calendário comercial decide por você — só entra no ar o que foi planejado com um mês de antecedência. Campanha de oportunidade, resposta a concorrente e teste em campanha viva ficam fora, por construção.';
    if(d >= 6)  return t + 'Com mais de uma semana, testar fica caro: cada variação custa uma passagem inteira pela fila, e é por isso que o teste sempre perde para a entrega.';
    return t + 'A sua fila é curta para o padrão de mercado. Se o volume também não incomoda, o gargalo da sua operação está em outro lugar.';
  }
  function eqText(r){
    return 'Visto por outro ângulo, sem nenhuma premissa: o Composer custa ' + brl(r.preco) + ' por mês e a sua estrutura de produção custa ' +
      brl(r.custo) + '. Para empatar, ele precisa devolver ' + pct(r.frac) + ' da capacidade dessa estrutura — o equivalente a ' +
      num(r.pecasEq,1) + ' peça' + (r.pecasEq>1?'s':'') + ' ou ' + num(r.horasEq,0) + ' horas por mês, sobre as ' + num(r.horasMes,0) +
      ' que você já gasta. Compare esse número com as ' + num(r.horasMont,0) + ' horas que hoje vão para montagem.';
  }

  function render(){
    var st = STEPS[i];
    $('eyebrow').textContent = st.eyebrow + ' · ' + st.g;
    $('qtext').textContent = st.q;
    $('qhelp').textContent = st.help;
    $('counter').textContent = 'Pergunta ' + (i+1) + ' de ' + STEPS.length;
    $('bar').style.width = (i / STEPS.length * 100) + '%';
    $('back').disabled = (i === 0);
    var opts = $('opts');
    // Setor e faturamento aparecem SÓ na primeira tela.
    $('profile').hidden = (i !== 0);
    $('next').textContent = (i === STEPS.length - 1) ? 'Ver o meu resultado' : 'Continuar';
    opts.innerHTML = '';
    st.opts.forEach(function(o, idx){
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'opt';
      b.setAttribute('aria-pressed', String(S[st.id + 'Label'] === idx));
      b.innerHTML = '<i></i><span></span>';
      b.querySelector('span').textContent = o[1];
      b.addEventListener('click', function(){
        S[st.id] = o[0]; S[st.id + 'Label'] = idx;
        Array.prototype.forEach.call(opts.children, function(c){ c.setAttribute('aria-pressed','false'); });
        b.setAttribute('aria-pressed','true');
        gate();
      });
      opts.appendChild(b);
    });
    gate();
    $('quiz').scrollIntoView({block:'start', behavior:'smooth'});
  }
  function gate(){
    var ok = S[STEPS[i].id] !== undefined;
    if(i === 0) ok = ok && !!$('setor').value && !!$('fat').value;
    $('next').disabled = !ok;
  }

  function show(r){
    $('r-valor').textContent = brl(r.teto);
    $('r-valor').className = 'bignum c-' + r.f.k;
    $('r-lamp').className = 'lamp l-' + r.f.k;
    $('r-lamp-t').textContent = r.f.t;
    $('r-valor-exp').textContent = explainValor(r);
    $('r-piso').textContent = brl(r.piso);
    $('r-piso-exp').textContent = pct(r.mont) + ' da sua estrutura está em montagem e versionamento. Esse número não depende de você crescer.';
    $('r-teto').textContent = brl(r.teto);
    $('r-teto-exp').textContent = r.mult > 1
      ? 'Inclui o custo de produzir as ' + num(r.gap,0) + ' peças a mais que você disse que faria. Se a ambição não se concretizar, vale o piso.'
      : 'Você disse que manteria o volume de hoje. Sem gap de capacidade, teto e piso são o mesmo número.';
    var ratio = r.preco > 0 ? r.teto / r.preco : 0;
    if(ratio >= 1){
      $('r-ratio').textContent = num(ratio,1) + '×';
      $('r-ratio-exp').innerHTML = 'é quanto o valor em jogo na sua operação é maior que a mensalidade do Maestro Composer, que começa em <strong>' +
        brl(r.preco) + ' por mês</strong>. A conta não diz que você economiza isso: diz o tamanho do que está em disputa ao lado do que custa disputar.';
    } else {
      $('r-ratio').textContent = brl(r.preco);
      $('r-ratio-exp').innerHTML = 'é a mensalidade de entrada do Maestro Composer. Na sua operação, o valor em jogo hoje é <strong>menor do que isso</strong> — é por esse motivo, e só por ele, que o primeiro farol está vermelho.';
    }
    $('c-peca').textContent = brl(r.custo) + ' ÷ ' + num(r.pecas,0) + ' peças = ' + brl(r.custoPeca) + ' por peça';
    $('c-hora').textContent = brl(r.custo) + ' ÷ (' + num(r.pecas,0) + ' × ' + num(r.horas,1) + ' h) = ' + brl(r.custoHora) + ' por hora';
    $('c-piso').textContent = brl(r.custo) + ' × ' + pct(r.mont) + ' = ' + brl(r.piso) + ' por mês';
    $('c-teto').textContent = brl(r.piso) + ' + (' + num(r.gap,0) + ' × ' + brl(r.custoPeca) + ') = ' + brl(r.teto) + ' por mês';
    $('c-rec').textContent = brl(r.teto) + ' ÷ ' + brl(r.rec) + ' = ' + num(r.recursos,1) + ' pessoa' + (r.recursos>1?'s':'');
    $('r-recurso').textContent = 'Na régua de ' + brl(r.rec) + ' por recurso alocado, isso equivale a ' + num(r.recursos,1) +
      ' pessoa' + (r.recursos>1?'s':'') + ' dedicada' + (r.recursos>1?'s':'') + ' em tempo integral. Ajuste esse valor abaixo se na sua empresa ele for outro.';

    $('r-marca').textContent = r.marca + '/100';
    $('r-marca').className = 'bignum c-' + r.m.k;
    $('r-mlamp').className = 'lamp l-' + r.m.k;
    $('r-mlamp-t').textContent = r.m.t;
    $('r-meter').style.width = r.marca + '%';
    $('r-marca-exp').textContent = explainMarca(r);

    var sp = spot(r);
    $('r-spot').hidden = !sp;
    if(sp){ $('r-spot-h').textContent = sp.h; $('r-spot-b').innerHTML = sp.b; }

    var v = verdict(r);
    $('r-verdict').className = 'verdict vd-' + v.k;
    $('r-vlamp').className = 'lamp l-' + v.k;
    $('r-vlamp-t').textContent = v.lamp;
    $('r-vtitle').textContent = v.t;
    $('r-vbody').textContent = v.b;

    $('r-peca').textContent = brl(r.custoPeca);
    $('r-hora').textContent = brl(r.custoHora);
    $('r-mont').textContent = num(r.horasMont,0) + ' h';
    $('r-mont-lab').textContent = 'horas por mês em montagem e versionamento — ' + num(r.pessoas,1) + ' pessoa' + (r.pessoas>1?'s':'') + ' em tempo integral';

    var fl = flagText(r);
    $('r-flag').hidden = !fl; $('r-flag').textContent = fl;
    $('r-tempo-txt').textContent = tempoText(r);
    $('r-fila-txt').textContent  = filaText(r);
    $('r-eq-txt').textContent    = eqText(r);
  }

  function readTune(){
    var s = {
      pecas: parseFloat($('t-pecas').value) || 1,
      custo: parseFloat($('t-custo').value) || 1,
      horas: parseFloat($('t-horas').value) || 0.25,
      mont: (parseFloat($('t-mont').value) || 0) / 100,
      dias:  parseFloat($('t-dias').value)  || 0.5,
      mult:  parseFloat($('t-mult').value)  || 1,
      rec:   parseFloat($('t-rec').value)   || RECURSO,
      preco: parseFloat($('t-preco').value) || 0,
      maos:S.maos, trava:S.trava, furo:S.furo, ia:S.ia, iaLabel:S.iaLabel
    };
    return calc(s);
  }

  function finish(){
    S.preco = PRECO; S.rec = RECURSO;
    $('t-pecas').value = S.pecas; $('t-custo').value = S.custo; $('t-horas').value = S.horas;
    $('t-mont').value = Math.round(S.mont * 100); $('t-dias').value = S.dias; $('t-mult').value = S.mult;
    $('t-rec').value = S.rec; $('t-preco').value = S.preco;
    show(calc(S));
    $('quiz').hidden = true; $('result').hidden = false;
    $('tag').textContent = ($('setor').value || '') + ' · ' + ($('fat').value || '');
    $('result').scrollIntoView({block:'start', behavior:'smooth'});
  }

  $('start').addEventListener('click', function(){ $('hero').hidden = true; $('quiz').hidden = false; render(); });
  $('next').addEventListener('click', function(){ if(i === STEPS.length - 1){ finish(); } else { i++; render(); } });
  $('back').addEventListener('click', function(){ if(i > 0){ i--; render(); } });
  $('setor').addEventListener('change', gate);
  $('fat').addEventListener('change', gate);
  ['t-pecas','t-custo','t-horas','t-mont','t-dias','t-mult','t-rec','t-preco'].forEach(function(id){
    $(id).addEventListener('input', function(){ show(readTune()); });
  });
  $('send').addEventListener('click', function(e){
    e.preventDefault();
    var errEl = $('lead-err');
    errEl.hidden = true;
    errEl.textContent = '';

    var nome = trimField($('l-nome').value, 120);
    var empresa = trimField($('l-empresa').value, 120);
    var email = trimField($('l-email').value, 254).toLowerCase();
    var cargo = trimField($('l-cargo').value, 120);

    if(!nome){ errEl.textContent = 'Informe seu nome.'; errEl.hidden = false; $('l-nome').focus(); return; }
    if(!empresa){ errEl.textContent = 'Informe a empresa.'; errEl.hidden = false; $('l-empresa').focus(); return; }
    if(!email || !isValidEmail(email)){ errEl.textContent = 'Informe um e-mail corporativo válido.'; errEl.hidden = false; $('l-email').focus(); return; }
    if(!cargo){ errEl.textContent = 'Informe seu cargo.'; errEl.hidden = false; $('l-cargo').focus(); return; }

    var btn = $('send');
    btn.disabled = true;
    btn.textContent = 'Enviando…';

    var r = readTune();
    var payload = {
      nome: nome,
      email: email,
      empresa: empresa,
      cargo: cargo,
      assunto: 'Sessão 45 min · Custo da Fila · Maestro Composer',
      mensagem: buildContactMessage(r)
    };

    fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function(res){
        return res.json().catch(function(){ return {}; }).then(function(data){
          if(!res.ok){
            throw new Error(data.error || 'Não foi possível enviar sua mensagem.');
          }
          $('sent').hidden = false;
          $('lead').hidden = true;
          btn.hidden = true;
        });
      })
      .catch(function(err){
        errEl.textContent = err.message || 'Não foi possível enviar. Tente novamente em instantes.';
        errEl.hidden = false;
        btn.disabled = false;
        btn.textContent = 'Quero a sessão';
      });
  });
  $('again').addEventListener('click', function(){
    S = {}; i = 0; $('result').hidden = true; $('hero').hidden = false;
    $('tag').textContent = 'Diagnóstico de produção e governança';
    $('lead').hidden = false;
    $('sent').hidden = true;
    $('send').hidden = false;
    $('send').disabled = false;
    $('send').textContent = 'Quero a sessão';
    $('lead-err').hidden = true;
    window.scrollTo({top:0, behavior:'smooth'});
  });
})();
