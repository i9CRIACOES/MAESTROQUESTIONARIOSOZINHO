# Maestro — responda sozinho

Mesmas 12 estações do questionário acompanhado. Ao concluir, o participante recebe por e-mail um link privado, válido por sete dias, para consultar e ajustar seu diagnóstico. O formulário nunca retorna o token nem o resultado.

## Desenvolvimento e verificação

Node 22 e PHP 8.0 ou superior. Execute `npm ci`, `npm test`, `npm run build` e `php test/api.php`. `node scripts/testar-api.mjs` testa HTTP e captura o e-mail em SMTP local sem transmissão externa (configure PHP_BINARY no Windows se necessário).

## Publicação

GitHub Actions valida e gera a branch `deploy`. No Plesk, conecte o repositório público, selecione `deploy` e publique em `responda.aodigital.net.br`. A raiz deve conter index.html, assets/ e api/. Não publique a raiz do código-fonte. Requer PHP e cURL ativos.

Copie `server/config.example.php` para um diretório privado fora da raiz do site. Configure `MAESTRO_PRIVATE_DIR` com esse caminho absoluto. O padrão é o diretório pai da raiz do site mais `/.maestro-sozinho`. Dê permissão de escrita somente ao usuário PHP; nunca torne esse diretório acessível por HTTP. Configure URL HTTPS e um remetente autorizado no transporte de e-mail do servidor. Mantenha habilitado=false até verificar a entrega real; depois ative e teste o fluxo completo com um destinatário autorizado.

O proxy api/lead.php preserva a integração existente de leads. Verifique recebimento no fluxo e na planilha. Um status positivo de mail() confirma aceite pelo transporte, não entrega na caixa do destinatário.

Os links usam token de 256 bits no fragmento da URL e arquivos identificados por hash. Respostas e contatos ficam somente no diretório privado; cabeçalhos evitam cache. Registros expirados e limites antigos devem ser removidos periodicamente conforme política de retenção da operação.

## Atualizar e reverter

O webhook GitHub → Plesk acompanha a branch deploy. Após cada publicação, confira Actions, commit de deploy no Plesk e version.json na URL (contém somente o SHA de origem). Para reverter, reverta o commit em main e aguarde o build; a persistência privada permanece fora do deploy. Não altere o site acompanhado existente.
