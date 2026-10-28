# Questionário Maestro · v2 "A Fábrica de Peças" — Especificação

- **Data:** 23/10/2026 · **Status:** aprovado pelo Marcelo · **Branch:** `feat/fabrica`
- **Substitui** a camada visual da v1 (telas passo a passo). **Mantém** sem mudança: `src/domain/*` (conta idêntica ao original), `src/data/*` (envio ao n8n, fila local), `src/audio/*` (trilha e efeitos), `n8n/*`, a planilha e o deploy.

## Por que mudou
O Marcelo achou a v1 com cara de formulário: pouca brincadeira, pouca iconografia, efeitos tímidos, progresso pouco visível, logo apagado, fundo animado só no fim, e resultado sem impacto. Pediu: landing page lúdica, gamificação clara, mais recursos do 21st e resultado em dashboard.

## Conceito
A página inteira é uma **linha de produção** percorrida com rolagem. Cada pergunta é uma **estação** com alegoria visual. As respostas viram **peças** (e-mail, post, push, WhatsApp) que andam numa **esteira fixa no rodapé**, empurradas pelo robozinho, até o logo do Maestro no fim.

## Estrutura (rolagem vertical, uma seção de altura ~100dvh por estação)
0. **Portão:** logo do Maestro grande e animado (monta-se peça por peça), título com palavra girando, botão **"Ligar a fábrica"** (liga o som — exigência do navegador). Fundo dos dados convergindo (`FluxoConvergente`) **fixo em toda a página**.
1. **Recepção:** setor = grade de 16 cards com ícone (lucide); faturamento = 5 "galpões" de tamanho crescente.
2. **Estações da operação** (7): quem (time/agência/ambos), peças/mês (pilha de peças cai no cesto proporcional à faixa), custo (etiqueta de preço balançando com a faixa), horas (relógio gira), % montagem (engrenagem + barra criação×montagem), dias de fila (fila de peças paradas no sinal vermelho, cresce com a faixa), sem fila (pilhas ×1/×2/×3/×5).
3. **Portaria da marca** (4): mãos (ícones de mãos em quantidade), trava (cadeado/checklist/olho/porta aberta), já escapou (peça fugindo com alerta), IA (braço robótico).
4. **Painéis "Você sabia?"** (os 4 cards da v1) como letreiros entre as fases, número contando.
5. **Cofre:** formulário de contato (mesma validação e aviso LGPD da v1, campo-isca). Ao enviar, a porta do cofre abre (substitui a tela "calculando").
6. **Painel de controle = DASHBOARD** (ver abaixo).
7. **Expedição:** manifesto (vídeo atual) abrindo do desfoque, logo do Maestro, botão "Quero a sessão", "Refazer".

Textos das perguntas, opções e valores: os mesmos de `src/domain/steps.ts`. Reações do robô: as de `src/domain/conteudo.ts` (podem aparecer como balão sobre a esteira).

## Gamificação
- Estações **trancadas** (desfoque + cadeado) até responder a anterior; ao responder: som, peça entra na esteira, rolagem suave automática para a próxima.
- Contador "Estação N de 12" e % na esteira.
- Conquistas (toast) ao fim de cada fase: "Recepção concluída", "Operação mapeada! 🏆", "Marca auditada! 🛡️".

## Esteira (fixa no rodapé, destaque)
- Faixa de largura total, altura ~64px desktop / ~52px celular, fundo da marca, textura de esteira rolando (CSS), 12 marcas de estação, **% grande**, robozinho (imagem `/robo.png` recortada) **andando** até a posição atual (balanço de caminhada), peças empilhadas atrás dele, **logo do Maestro no fim** como destino.
- `body` com espaço inferior para a esteira não cobrir conteúdo; respeita safe-area do iPhone.

## Dashboard do resultado
Componente isolado `src/dashboard/PainelResultado.tsx`, props idênticas às da `TelaResultado` da v1: `{ r: Resultado; campos: CamposAjuste; aoAjustar(c); aoContinuar(); tag: string }`.
- **KPIs** com contador animado: valor em jogo/mês (teto, destaque), piso, custo/peça, custo/hora, horas de montagem/mês, pessoas equivalentes.
- **Gráficos** (SVG + framer-motion, sem biblioteca pesada; seguir a skill `dataviz`):
  1. Rosca: custo da estrutura dividido em montagem (piso) × criação (custo − piso).
  2. Cascata: piso + custo das peças que faltam (custoGap) = teto.
  3. Barras: valor em jogo (teto) × mensalidade do Composer (preco), com o "N×" (`relacao(r)`).
  4. Velocímetro: score de marca 0–100 com zonas (baixa <35, média <60, alta).
  5. Linha da fila: dias de fila do usuário sobre a régua com marcas em 6 e 11 dias úteis.
- Faróis como sinaleiros industriais; veredicto como **carimbo** animado; **confete** quando `verdict(r).k === "ok"`.
- Todos os textos de leitura da v1 continuam (verdict, explainValor, explainMarca, spot, flagText, tempoText, filaText, eqText, contas) em blocos legíveis; ajuste dos números (`AjusteNumeros`) continua e o dashboard reage na hora.
- Respeita "reduzir movimento" (números aparecem direto, sem confete).

## Requisitos que não podem regredir
- Conta: `calcular`, `entradasDe`, `readings` intocados; os 1019 testes continuam passando.
- Envio: `desbloqueio` uma vez, `atualizacao` (vídeo, sessão, ajustes), isca, UUID com fallback — mesma lógica do `App.tsx` da v1.
- Som: começa no clique; níveis por fase; silencia no vídeo; botão de mudo visível.
- Robô 3D (Spline) só no desktop, com o selo cortado; imagem no celular.
- Celular primeiro; sem rolagem lateral; Lighthouse mobile ≥ 85 como meta.
- OG/metatags e vídeo: os atuais.

## Recursos
- 21st.dev: componentes já usados + buscar via MCP Magic (`mcp__magic__search`) contador de números, confete, texto com brilho, faixa rolante, card com inclinação 3D. Se o MCP não servir, implementar equivalente leve (ex.: `canvas-confetti`).
- Animação: GSAP + ScrollTrigger (rolagem), framer-motion (microinterações), princípios da skill motion-design; crivo da skill animate.
- Ícones: lucide-react. Sem imagem gerada por IA.
