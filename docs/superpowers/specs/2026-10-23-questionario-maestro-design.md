# Questionário "Você Sabia?" · Maestro — Especificação de design

- **Data:** 23/10/2026
- **Status:** aprovado em conversa, aguardando revisão do documento
- **Endereço:** https://questionario.aodigital.net.br
- **Planilha de respostas:** "RESPOSTAS VC SABIA MAESTRO" (`1ecWjh-Sgsyu_QgSCv8Sx5bneQDZfav1HEwxgPAN-pZU`, aba Página1)
- **Base da conta:** diagnóstico "Custo da Fila" de https://www.maestro.com.ai/custo-da-fila (site do próprio cliente, "by always on"). Cópia da página e do script em `docs/referencia/custo-da-fila/`.

## 1. Objetivo

Transformar o diagnóstico "Custo da Fila" num jogo de perguntas com cara de alta tecnologia. A pessoa responde 12 telas curtas, deixa o contato, vê quanto dinheiro a fila de produção de conteúdo trava por mês na empresa dela e termina assistindo ao manifesto do Maestro.

Sucesso significa três coisas:
1. A conta dá exatamente o mesmo resultado do Custo da Fila original para as mesmas respostas.
2. Toda pessoa que chega ao resultado vira uma linha completa na planilha.
3. Funciona bem no celular e no desktop.

## 2. Fluxo de fases

| # | Fase | O que acontece |
|---|------|----------------|
| 0 | Entrada | Loader de pontos enquanto carrega. Tela com o robô do Maestro, título com palavra girando e botão "Começar". O clique liga a trilha e os efeitos sonoros. |
| 1 | Missão 0 · Quem é você | Setor e faturamento. |
| 2 | Fase 1 · A operação | 7 perguntas, uma por tela. |
| 3 | Você sabia? | Card com dado de mercado. Aparece entre fases (ver seção 4). |
| 4 | Fase 2 · A marca | 4 perguntas, uma por tela. |
| 5 | Desbloqueie sua leitura | Formulário de contato. Ao enviar, grava na planilha e libera o resultado. |
| 6 | O resultado | Loader "calculando", depois a conta contando, os dois faróis, o veredicto e os números por trás. Bônus opcional: ajustar os números. |
| 7 | Fase final | "Como o Maestro pode ajudar a sua empresa": o robô apresenta e o manifesto abre num player. Botão para pedir a sessão. |

Botão "Voltar" em todas as perguntas. A resposta escolhida fica marcada ao voltar.

**Barra de progresso:** um circuito com um nó por tela de pergunta (12 nós: perfil + 11 perguntas). A cada resposta a energia corre pelo fio e acende o próximo nó, com o percentual de "sincronização" ao lado. O robô acompanha o avanço. No celular vira uma linha fina no topo; no desktop ganha mais espaço.

## 3. Perguntas (texto novo, mesma matemática)

O tom foi reescrito para ficar mais leve. Os **valores numéricos de cada opção são idênticos ao original**, porque é deles que a conta sai. O rótulo entre parênteses é o `id` usado no código e na planilha.

### Missão 0 · Quem é você
- **Setor** (`setor`): "Em que setor a sua empresa joga?" — Varejo · E-commerce / marketplace · Moda e vestuário · Serviços financeiros e seguros · Saúde e bem-estar · Educação · Telecom · Indústria e bens de consumo · Energia e utilities · Turismo e hospedagem · Companhias aéreas · Mobilidade e locação (carros, bikes, patinetes) · Alimentos e bebidas · Tecnologia e SaaS · Agência de publicidade, marketing ou CRM · Outro
- **Faturamento** (`fat`): "E o faturamento anual, fica em que faixa?" — Até R$ 100 milhões · De R$ 100 a 500 milhões · De R$ 500 milhões a R$ 1 bilhão · De R$ 1 a 5 bilhões · Mais de R$ 5 bilhões

Setor e faturamento ficam na mesma tela. Só libera "Continuar" com os dois preenchidos.

### Fase 1 · A operação

1. **`quem`** — "Quem coloca as peças de pé hoje?"
   Ajuda: "Peça é cada e-mail, push, SMS, WhatsApp ou post que vai ao ar. Três versões do mesmo e-mail para três segmentos contam como três peças."
   Opções (valor): Time interno (1) · Agência (2) · Time interno e agência juntos (3)

2. **`pecas`** — "Quantas peças saem por mês?"
   Ajuda: "Conte cada variação separada. Quase sempre o número é maior do que o time imagina."
   Opções: Até 20 peças (12) · De 21 a 50 (35) · De 51 a 150 (95) · De 151 a 400 (260) · Mais de 400 (600)

3. **`custo`** — "Quanto custa por mês a turma que produz essas peças?"
   Ajuda: "Salários e encargos de quem põe a mão, mais o fee da agência. Só produção: sem mídia, sem time de dados, sem liderança."
   Opções: Até R$ 15 mil (10000) · De R$ 15 a 40 mil (26000) · De R$ 40 a 90 mil (62000) · De R$ 90 a 180 mil (130000) · De R$ 180 a 350 mil (250000) · Mais de R$ 350 mil (450000)

4. **`horas`** — "Uma única peça: quantas horas de gente ela consome, da ideia aprovada até o envio?"
   Ajuda: "Some todo mundo que encosta nela: briefing, texto, arte, montagem, revisão, aprovação e configuração."
   Opções: 1 a 2 horas (1.5) · De 3 a 5 horas (4) · De 6 a 10 horas (8) · De 11 a 20 horas (15) · Mais de 20 horas (25)

5. **`mont`** — "Desse tempo, quanto é montagem e quanto é criação de verdade?"
   Ajuda: "Montar o HTML, trocar a imagem por segmento, adaptar o texto para a quinta variação, configurar o disparo. A parte que ninguém coloca no portfólio."
   Opções: Quase tudo é criação, montagem fica em uns 20% (0.2) · Mais criação que montagem, uns 40% de montagem (0.4) · Mais montagem que criação, uns 60% (0.6) · Quase tudo é montagem, uns 80% (0.8)

6. **`dias`** — "Da ideia aprovada até a peça no ar, quantos dias úteis passam?"
   Ajuda: "Tempo de calendário, não de trabalho. A espera entre uma etapa e outra também conta."
   Opções: 1 a 2 dias (1.5) · De 3 a 5 dias (4) · De 6 a 10 dias (8) · De 11 a 20 dias (15) · Mais de 20 dias (25)

7. **`mult`** — "Se não existisse fila nem custo extra, quantas peças você soltaria por mês?"
   Ajuda: "Pense no que o calendário comercial pediria, não no que a estrutura de hoje aguenta."
   Opções: O mesmo que hoje (1) · Mais ou menos o dobro (2) · Umas três vezes mais (3) · Cinco vezes ou mais (5)

### Fase 2 · A marca

8. **`maos`** — "Quantas pessoas conseguem publicar algo com o nome da sua marca?"
   Ajuda: "Todo mundo com permissão técnica de publicar, dentro e fora de casa: agência, estagiário, time regional, franqueado."
   Opções (pontos): De 1 a 3 pessoas (10) · De 4 a 10 (25) · De 11 a 30 (35) · Mais de 30 (40)

9. **`trava`** — "O que de fato impede uma peça fora do padrão de ir ao ar?"
   Ajuda: "Não o que está escrito no manual. O que realmente segura a peça antes do disparo."
   Opções: Software: o template não deixa sair do padrão (0) · Checklist formal e revisão de uma pessoa (15) · O olho de alguém que conhece a marca (25) · Nada estruturado, a gente confia no time (30)

10. **`furo`** — "Alguma peça fora do padrão já escapou?"
    Ajuda: "Logo errado, tom fora da marca, promessa que o jurídico não aprovaria, imagem de campanha antiga."
    Opções: Sim, nos últimos 12 meses (20) · Sim, mas faz tempo (12) · Não que eu saiba (0) · Não saberíamos dizer (20)

11. **`ia`** — "E a IA generativa: qual é a regra real para ela criar peças com o nome da marca?"
    Ajuda: "A regra que vale no dia a dia, não a do comunicado interno."
    Opções: Liberada, o time usa como achar melhor (0) · Caso a caso, sem regra formal (5) · Só com revisão humana, peça por peça (10) · Não usamos IA generativa na comunicação da marca (10)

A última opção de `ia` (índice 3) marca `iaProibida = true`, que muda o destaque do resultado (seção 5.6).

### Reação do robô
Cada escolha gera uma frase curta do robô (até 60 caracteres), escrita na implementação. Regra: a frase comenta a escolha, nunca afirma um número que não saiu das respostas e nunca julga a pessoa.

## 4. Cards "Você sabia?"

Quatro cards, com os dados de mercado que já estão no Custo da Fila (fonte sempre visível no card):

| Onde aparece | Dado | Fonte |
|---|---|---|
| Depois da Missão 0 | 89% dizem que o criativo decide a performance, mas só 3,6% otimizam o criativo de fato. | EMARKETER com Perion, abr/2026 |
| Depois da pergunta 4 | 78% dos profissionais de marketing precisam de mais conteúdo personalizado do que conseguem produzir. | Salesforce, State of Marketing 2026 |
| Entre a Fase 1 e a Fase 2 | 72,1% esperam a performance cair para mexer no criativo. | EMARKETER com Perion, abr/2026 |
| Antes do contato | Menos de 10% dos ativos criativos são testados antes de ir ao ar; criativo validado antes do lançamento está associado a +46% de receita. | EMARKETER com Toluna, mai/2026 |

O card não conta como pergunta na barra. Botão "Continuar" ou avanço por toque.

## 5. A conta

Implementada como função pura em TypeScript, sem dependência de tela. Tem que reproduzir o `calc()` original.

### 5.1 Constantes (configuráveis em um arquivo só)
- `PRECO` = 6000 (mensalidade de entrada do Maestro Composer, R$)
- `RECURSO` = 25000 (custo de 1 recurso alocado, R$/mês)

### 5.2 Entradas e limites
- `pecas = max(1, pecas)` · `custo = max(1, custo)` · `horas = max(0.25, horas)` · `mont = entre 0 e 1` · `mult = max(1, mult)` · `rec = rec > 0 ? rec : RECURSO` · `preco = preco > 0 ? preco : 0`

### 5.3 Fórmulas
- `custoPeca = custo / pecas`
- `horasMes = pecas × horas`
- `custoHora = custo / horasMes`
- `horasMont = horasMes × mont`
- `piso = custo × mont`
- `gap = pecas × (mult − 1)`
- `custoGap = gap × custoPeca`
- `teto = piso + custoGap`
- `recursos = teto / rec`
- `pessoas = horasMont / 168`
- `frac = preco / custo` · `pecasEq = preco / custoPeca` · `horasEq = preco / custoHora`

### 5.4 Farol 1 · O dinheiro
- `teto ≥ 25.000` → verde, "um recurso alocado ou mais"
- `teto ≥ 12.000` → amarelo, "perto de um recurso alocado"
- abaixo → vermelho, "abaixo do limiar de mudança"

### 5.5 Farol 2 · A marca
- `marca = maos + trava + furo + ia` (0 a 100)
- `≥ 60` exposição alta · `≥ 35` média · abaixo baixa

### 5.6 Veredicto (nesta ordem)
1. Farol 1 verde → **Caso fechado**
2. Farol 1 amarelo e marca alta → **Vale a conversa** (decide pelo risco)
3. Farol 1 amarelo → **Meça antes de decidir**
4. Marca alta → **Vale a conversa, por outro motivo** (governança)
5. Senão → **Não é para você hoje**

Destaque extra: `iaProibida` → bloco "a IA não alcança"; senão, `marca ≥ 60` → bloco "o volume quebra a governança".

Alerta de consistência: `custoHora < 40` ou `custoHora > 600` mostra o aviso de "números estranhos, refaça as perguntas 2 e 4".

Textos de fila: `dias ≥ 11` e `dias ≥ 6` têm frases próprias; abaixo disso, "fila curta".

### 5.7 Textos do resultado
Veredictos, explicações dos faróis, tempo, fila, ponto de equilíbrio e alerta de consistência **mantêm o conteúdo do original** (em `docs/referencia/custo-da-fila/calc.js`). Ajuste de tom só onde quebrar o clima do jogo, sem mudar número nem promessa. Valores em reais no formato `R$ 12.345`; abaixo de R$ 10 com duas casas.

### 5.8 Bônus: ajuste os números
Campos editáveis que recalculam na hora: peças/mês (mín. 1, passo 1) · custo mensal (mín. 1.000, passo 1.000) · horas por peça (mín. 0,25, passo 0,25) · montagem % (0 a 100, passo 5) · dias de fila (mín. 0,5, passo 0,5) · multiplicador (1 a 20, passo 0,5) · custo de 1 recurso (mín. 1.000, passo 1.000) · mensalidade do Composer (mín. 0, passo 500). Começam com os valores das respostas.

## 6. Contato (Desbloqueie sua leitura)

- Campos: **Nome**, **E-mail corporativo**, **Empresa**, **Cargo** (obrigatórios) e **WhatsApp** (opcional).
- Validação no navegador e de novo no n8n: e-mail válido, tamanho máximo por campo, WhatsApp guardado só com dígitos.
- Campo-isca escondido contra robô de spam.
- Teclado certo no celular (`type=email`, `inputmode=tel`) e `autocomplete` nos campos.
- **Aviso LGPD** logo abaixo do botão: "Usamos seus dados para enviar este diagnóstico e entrar em contato sobre ele. Nada é compartilhado com terceiros." Sem caixa de aceite.

## 7. Dados

### 7.1 Caminho
Navegador → `POST https://n8n.i9criacoes.com.br/webhook/vc-sabia-maestro` → workflow novo na pasta **ALWAYS ON** do n8n → Google Sheets → resposta `{ok:true}`.

O webhook só aceita origem `https://questionario.aodigital.net.br` (e `localhost` durante o desenvolvimento).

### 7.2 Eventos
Cada pessoa recebe um ID (UUID gerado no navegador).
- **`desbloqueio`** — acrescenta a linha completa.
- **`atualizacao`** — atualiza a linha com o mesmo ID: pediu a sessão, quanto do vídeo assistiu, números ajustados nos sliders.

### 7.3 Colunas (linha 1 da planilha, criada pelo workflow)
`Data/hora` · `ID` · `Nome` · `E-mail` · `Empresa` · `Cargo` · `WhatsApp` · `Setor` · `Faturamento` · `Quem produz` · `Peças/mês` · `Custo da estrutura` · `Horas/peça` · `% montagem` · `Dias de fila` · `Peças sem fila` · `Mãos que publicam` · `O que trava` · `Já escapou` · `Posição sobre IA` · `Custo/peça` · `Custo/hora` · `Horas de montagem/mês` · `Piso` · `Teto` · `Recursos equivalentes` · `Farol dinheiro` · `Score marca` · `Farol marca` · `Veredicto` · `Pediu sessão` · `Vídeo assistido (%)` · `Números ajustados` · `Origem (?o=)` · `UTMs` · `Dispositivo`

Respostas vão como o texto da opção escolhida. Valores calculados vão como número.

### 7.4 Falha no envio
Tenta de novo uma vez. Se falhar, a pessoa vê o resultado assim mesmo e o envio fica guardado no navegador para reenviar na próxima visita.

## 8. Visual

- Identidade do Maestro: fundo navy quase preto, superfícies navy, texto off-white, **acento ciano `#00D4FF`**. Violeta do robô só como brilho secundário. Fonte Plus Jakarta Sans. Logo Maestro + "by always on".
- Componentes do 21st.dev e onde entram:
  - **DotLoader** — carregamento da página e "calculando" antes do resultado.
  - **Animated hero** — título da entrada: "Quanto custa a peça que o seu time **não faz / atrasa / refaz / esquece**?"
  - **Interactive hover button** — botões principais.
  - **Glow card** — opções de resposta; o brilho segue mouse ou dedo.
  - **Gateway flow** — fundo do contato e da revelação do resultado.
  - **Scroll-locked video hero** — não usado como componente (trava o scroll e briga com o toque). Só o efeito de desfoque para foco no vídeo final.
- Robô: cena Spline `https://prod.spline.design/PyzDhpQ9E5f1E3MT/scene.splinecode`, reaproveitando `interactive-3d-robot.tsx` e `deferred-robot.tsx` do projeto Maestro.
- Movimento: kinetic type no título, stagger nas opções, pop in na escolha, glow pulse no nó da barra, count up nos valores, desfoque para foco no vídeo. Só `transform` e `opacity`, curvas ease-out, tudo desligado com "reduzir movimento" do aparelho.

## 9. Som

- Tudo gerado por código (Web Audio API). Nenhum arquivo de áudio.
- **Trilha:** pad suave com arpejo leve, em loop, que ganha uma camada a cada fase.
- **Efeitos:** clique, seleção de opção, troca de fase, card "Você sabia?", revelação do resultado.
- Começa no clique de "Começar". Botão de mudo sempre visível, com a preferência guardada. Volume baixo por padrão.

## 10. Celular e desktop

- Celular primeiro. Uma pergunta por tela, cards de opção com área de toque de pelo menos 48 px, altura com `100dvh`, respeito à área segura do iPhone.
- Desktop: duas colunas (robô à esquerda, pergunta à direita).
- Robô: Spline interativo no desktop. No celular só na entrada e no final, e só se o aparelho aguentar (memória, conexão, modo economia). Fora disso, imagem do robô com micro-animação. Nas reações, robô pequeno no canto.
- Gateway flow: cerca de 30 linhas no celular e 80 no desktop; pausa quando a aba perde o foco.

## 11. Vídeo final

- Origem: `Maestro_Manifesto_v2.mp4` no Drive (170 MB).
- Converter para H.264 em 720p (desktop) e 480p (celular), áudio AAC, com imagem de capa. Meta de peso: até 15 MB a versão 720p.
- Toca dentro da página (`playsinline`), com controles, sem autoplay com som. Mede o percentual assistido para a planilha.

## 12. Imagem de compartilhamento

- 1200 × 630, montada por código (HTML renderizado em PNG) com o logo real do Maestro e a imagem do robô enviada pelo Marcelo. Nada gerado por IA.
- Título na imagem: "Você sabe quanto custa cada peça que o seu time produz?"
- `og:title`: "Você sabe quanto custa cada peça que o seu time produz?"
- `og:description`: "Diagnóstico de 4 minutos: descubra quanto a fila de produção de conteúdo custa à sua empresa por mês, e quanto valor ela segura."
- Mesmas tags para Twitter/X e WhatsApp.

## 13. Desempenho

- Robô, vídeo, Gateway flow e bônus de ajuste carregam só quando chega a vez deles.
- Meta: entrada interativa em menos de 2,5 s em 4G; Lighthouse mobile 85 ou mais.

## 14. Testes e aceite

1. **Conta igual ao original:** script Playwright responde o Custo da Fila com um conjunto de combinações (todas as opções de cada pergunta pelo menos uma vez, mais os casos de borda dos faróis e do alerta de consistência), guarda os resultados num arquivo e a nossa função tem que bater com eles.
2. **Ponta a ponta:** Playwright joga o questionário inteiro em viewport de celular e de desktop, envia o contato, confere a linha na planilha e apaga a linha de teste.
3. **Visual:** capturas de tela de cada fase no celular e no desktop.
4. **Desempenho:** Lighthouse mobile.

## 15. Publicação

- Projeto em `~/Claude/CLAUDE CODE/questionario-maestro/`, git com branches.
- Subdomínio `questionario.aodigital.net.br` criado no Plesk, com SSL. Mexe em servidor e DNS, então só com confirmação do Marcelo na hora.
- Deploy automático pela skill `deploy-git-plesk` (git push publica). Alternativa: upload direto pelo Plesk.

## 16. Fora do escopo

- Envio para CRM (SharpSpring ou outro). O workflow já deixa o ponto preparado, mas não envia.
- Painel de leitura dos resultados. A planilha é o painel.
- Versão em outro idioma.

## 17. Riscos e pendências

- **DNS do aodigital.net.br:** confirmar onde está hospedado antes de criar o subdomínio.
- **Credencial do Google no n8n:** confirmar que a conta conectada tem acesso de edição à planilha nova.
- **Preço do Composer:** R$ 6.000 vem do site atual; se mudar, troca em um lugar só.
- **Cena Spline:** é a mesma da LP do Maestro; se ela for alterada lá, muda aqui também.
