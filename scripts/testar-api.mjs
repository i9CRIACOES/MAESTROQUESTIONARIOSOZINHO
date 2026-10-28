import net from 'node:net';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';

// SMTP local captura e-mail sem transmitir dados a terceiros.
let mensagem = '';
const smtp = net.createServer(socket => {
  socket.write('220 localhost SMTP ready\r\n');
  let buffer = '', data = false;
  socket.on('data', chunk => {
    buffer += chunk.toString();
    while (buffer.includes('\r\n')) {
      const i = buffer.indexOf('\r\n');
      const linha = buffer.slice(0, i); buffer = buffer.slice(i + 2);
      if (data) {
        if (linha === '.') { data = false; socket.write('250 queued\r\n'); }
        else mensagem += linha + '\n';
      } else if (/^DATA/i.test(linha)) { data = true; socket.write('354 end with dot\r\n'); }
      else if (/^QUIT/i.test(linha)) { socket.end('221 goodbye\r\n'); }
      else socket.write('250 OK\r\n');
    }
  });
});
await new Promise(r => smtp.listen(1025, '127.0.0.1', r));
const privado = path.resolve('.maestro-sozinho');
mkdirSync(privado, { recursive: true });
writeFileSync(path.join(privado, 'config.php'), "<?php return ['habilitado'=>true,'url'=>'http://127.0.0.1:4180','remetente'=>'teste@example.invalid'];");
const php = process.env.PHP_BINARY || 'C:/wamp64/bin/php/php8.3.14/php.exe';
const servidor = spawn(php, ['-d', 'SMTP=127.0.0.1', '-d', 'smtp_port=1025', '-S', '127.0.0.1:4180', '-t', 'dist'], { env: { ...process.env, MAESTRO_PRIVATE_DIR: privado }, stdio: ['ignore','ignore','pipe'] });
let falhas = ''; servidor.stderr.on('data', d => { falhas += d; });
const base = 'http://127.0.0.1:4180/api/index.php';
try {
  for (let i = 0; i < 30; i++) {
    try { await fetch(base); break; } catch { await new Promise(r => setTimeout(r, 100)); }
  }
  const schema = JSON.parse(readFileSync('public/api/schema.json'));
  const dados = { id: '12345678-1234-1234-1234-123456789012', contato: { nome: 'Teste Local', email: 'teste@example.invalid', empresa: 'Teste', cargo: 'Teste', whatsapp: '' }, setor: schema.setores[0], fat: schema.faturamentos[0], respostas: Object.fromEntries(Object.keys(schema.opcoes).map(k => [k, 0])), isca: false };
  const enviar = (v, origem = 'http://127.0.0.1:4180') => fetch(base + '?acao=solicitar', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origem }, body: JSON.stringify(v) });
  assert.equal((await enviar({ ...dados, respostas: [] })).status, 422);
  assert.equal((await enviar(dados, 'https://outro.example')).status, 403);
  const pedido = await enviar(dados);
  assert.equal(pedido.status, 202, await pedido.clone().text());
  assert.deepEqual(await pedido.json(), { ok: true });
  const token = mensagem.match(/#resultado=([a-f0-9]{64})/)?.[1];
  assert.ok(token, 'e-mail deve conter link do resultado');
  assert.equal((await fetch(base + '?acao=resultado')).status, 404);
  assert.equal((await fetch(base + '?acao=resultado', { headers: { 'X-Resultado-Token': 'a'.repeat(64) } })).status, 404);
  const resultado = await fetch(base + '?acao=resultado', { headers: { 'X-Resultado-Token': token } });
  assert.equal(resultado.status, 200);
  const v = await resultado.json();
  assert.deepEqual(v.respostas, dados.respostas);
  assert.equal(v.contato.email, undefined);
  assert.equal(v.contato.whatsapp, undefined);
  assert.match(resultado.headers.get('cache-control'), /no-store/);
  writeFileSync(path.join(privado, 'teste-link.txt'), 'http://127.0.0.1:4180/#resultado=' + token);
  console.log('PASS API HTTP: validação, origem, e-mail local, ausência de resultado no POST, token obrigatório, resultado recuperado e dados de contato reduzidos.');
  if (process.argv.includes('--serve')) {
    console.log('Servidor local disponível em http://127.0.0.1:4180 para inspeção visual.');
    await new Promise(() => {});
  }
} catch (e) { console.error(falhas); throw e; }
finally { servidor.kill(); smtp.close(); }
