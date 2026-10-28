import { workflow, node, trigger, switchCase, expr } from '@n8n/workflow-sdk';
import { sanitizar, COLS } from './sanitizar.mjs';

const PLANILHA = 'CONFIGURE_SPREADSHEET_ID';
const CREDENCIAL = { googleSheetsOAuth2Api: { id: 'CONFIGURE_GOOGLE_SHEETS_CREDENTIAL', name: 'Google Sheets account' } };

const entrada = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Entrada (POST)',
    parameters: {
      httpMethod: 'POST',
      path: 'vc-sabia-maestro',
      responseMode: 'responseNode',
      options: { allowedOrigins: 'https://questionario.aodigital.net.br,http://localhost:8080,http://localhost:4173' },
    },
  },
});

const validar = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Validar e limpar',
    parameters: {
      // A lógica (e os testes dela) mora em sanitizar.mjs; aqui só é injetada no Code node.
      jsCode: `const COLS = ${JSON.stringify(COLS)};
${sanitizar.toString()}
return [{ json: sanitizar($input.first().json.body || {}) }];`,
    },
  },
});

const regra = (valor) => ({
  outputKey: valor,
  conditions: {
    options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
    conditions: [{ leftValue: expr('{{ $json._acao }}'), operator: { type: 'string', operation: 'equals' }, rightValue: valor }],
    combinator: 'and',
  },
});

const rota = switchCase({
  version: 3.2,
  config: { name: 'Rota', parameters: { rules: { values: [regra('gravar'), regra('atualizar'), regra('ignorar'), regra('rejeitar')] } } },
});

const linhaFinal = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Linha final',
    parameters: { jsCode: "return $input.all().map((i) => { const { _acao, ...resto } = i.json; return { json: resto }; });" },
  },
});

const linhaFinalAtualizar = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Linha final (atualização)',
    parameters: { jsCode: "return $input.all().map((i) => { const { _acao, ...resto } = i.json; return { json: resto }; });" },
  },
});

const gravar = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'Gravar na planilha',
    parameters: {
      operation: 'appendOrUpdate',
      documentId: { __rl: true, mode: 'id', value: PLANILHA },
      sheetName: { __rl: true, mode: 'name', value: 'Página1' },
      columns: { mappingMode: 'autoMapInputData', value: {}, matchingColumns: ['ID'], schema: [] },
      options: { cellFormat: 'RAW' },
    },
    credentials: CREDENCIAL,
  },
});

const atualizar = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'Atualizar na planilha',
    alwaysOutputData: true, // ID desconhecido não pode deixar o webhook sem resposta
    parameters: {
      operation: 'update',
      documentId: { __rl: true, mode: 'id', value: PLANILHA },
      sheetName: { __rl: true, mode: 'name', value: 'Página1' },
      columns: { mappingMode: 'autoMapInputData', value: {}, matchingColumns: ['ID'], schema: [] },
      options: { cellFormat: 'RAW' },
    },
    credentials: CREDENCIAL,
  },
});

const responderOk = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: { name: 'Responder ok', parameters: { respondWith: 'json', responseBody: expr('{{ { "ok": true } }}') } },
});

const responderOkAtualizacao = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: { name: 'Responder ok (atualização)', parameters: { respondWith: 'json', responseBody: expr('{{ { "ok": true } }}') } },
});

const responderIgnorado = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: { name: 'Responder ok (ignorado)', parameters: { respondWith: 'json', responseBody: expr('{{ { "ok": true } }}') } },
});

const responderErro = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    name: 'Responder 400',
    parameters: { respondWith: 'json', responseBody: expr('{{ { "ok": false } }}'), options: { responseCode: 400 } },
  },
});

export default workflow('vc-sabia-maestro', 'VC SABIA MAESTRO · Questionário')
  .add(entrada)
  .to(validar)
  .to(rota
    .onCase(0, linhaFinal.to(gravar.to(responderOk)))
    .onCase(1, linhaFinalAtualizar.to(atualizar.to(responderOkAtualizacao)))
    .onCase(2, responderIgnorado)
    .onCase(3, responderErro));
