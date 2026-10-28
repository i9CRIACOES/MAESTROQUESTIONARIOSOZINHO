import { workflow, node, trigger, expr } from '@n8n/workflow-sdk';

const COLS = ["Data/hora","ID","Nome","E-mail","Empresa","Cargo","WhatsApp","Setor","Faturamento","Quem produz","Peças/mês","Custo da estrutura","Horas/peça","% montagem","Dias de fila","Peças sem fila","Mãos que publicam","O que trava","Já escapou","Posição sobre IA","Custo/peça","Custo/hora","Horas de montagem/mês","Piso","Teto","Recursos equivalentes","Farol dinheiro","Score marca","Farol marca","Veredicto","Pediu sessão","Vídeo assistido (%)","Números ajustados","Origem (?o=)","UTMs","Dispositivo"];

const PLANILHA = 'CONFIGURE_SPREADSHEET_ID';
const CREDENCIAL = { googleSheetsOAuth2Api: { id: 'CONFIGURE_GOOGLE_SHEETS_CREDENTIAL', name: 'Google Sheets account' } };

const inicio = trigger({ type: 'n8n-nodes-base.manualTrigger', version: 1, config: { name: 'Rodar manutenção' } });

const cabecalho = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Escrever cabeçalho',
    parameters: {
      method: 'PUT',
      url: `https://sheets.googleapis.com/v4/spreadsheets/${PLANILHA}/values/P%C3%A1gina1!A1:AJ1?valueInputOption=RAW`,
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'googleSheetsOAuth2Api',
      sendBody: true,
      specifyBody: 'json',
      jsonBody: JSON.stringify({ values: [COLS] }),
    },
    credentials: CREDENCIAL,
  },
});

const lerTestes = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'Achar linhas de teste',
    parameters: {
      operation: 'read',
      documentId: { __rl: true, mode: 'id', value: PLANILHA },
      sheetName: { __rl: true, mode: 'name', value: 'Página1' },
      filtersUI: { values: [{ lookupColumn: 'Nome', lookupValue: 'TESTE E2E' }] },
    },
    credentials: CREDENCIAL,
  },
});

const ordenar = node({
  type: 'n8n-nodes-base.sort',
  version: 1,
  config: { name: 'De baixo para cima', parameters: { sortFieldsUi: { sortField: [{ fieldName: 'row_number', order: 'descending' }] } } },
});

const apagar = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'Apagar linha de teste',
    parameters: {
      operation: 'delete',
      documentId: { __rl: true, mode: 'id', value: PLANILHA },
      sheetName: { __rl: true, mode: 'name', value: 'Página1' },
      toDelete: 'rows',
      startIndex: expr('{{ $json.row_number }}'),
      numberToDelete: 1,
    },
    credentials: CREDENCIAL,
  },
});

export default workflow('vc-sabia-manutencao', 'VC SABIA MAESTRO · Manutenção')
  .add(inicio)
  .to(cabecalho)
  .to(lerTestes)
  .to(ordenar)
  .to(apagar);
