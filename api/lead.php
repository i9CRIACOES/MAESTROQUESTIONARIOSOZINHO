<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
function concluirLead(int $status): void { http_response_code($status); echo json_encode(['ok' => $status < 300]); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') concluirLead(405);
$privado = getenv('MAESTRO_PRIVATE_DIR') ?: dirname(__DIR__, 2) . '/.maestro-sozinho';
$config = is_file($privado . '/config.php') ? require $privado . '/config.php' : [];
if (!($config['habilitado'] ?? false)) concluirLead(503);
if (isset($_SERVER['HTTP_ORIGIN']) && $_SERVER['HTTP_ORIGIN'] !== rtrim($config['url'] ?? 'https://responda.aodigital.net.br', '/')) concluirLead(403);
if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== 0) concluirLead(415);
$raw = file_get_contents('php://input', false, null, 0, 16385);
if (strlen($raw) > 16384) concluirLead(413);
$v = json_decode($raw, true);
if (!is_array($v) || !in_array($v['evento'] ?? '', ['desbloqueio', 'atualizacao'], true) || !is_array($v['linha'] ?? null) || !preg_match('/^[a-f0-9-]{36}$/iD', (string) ($v['linha']['ID'] ?? ''))) concluirLead(422);
$v['linha']['QUESTIONARIO'] = 'responda';
$raw = json_encode($v, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
if (!function_exists('curl_init')) concluirLead(503);
$ch = curl_init('https://n8n.i9criacoes.com.br/webhook/vc-sabia-maestro');
curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => $raw, CURLOPT_HTTPHEADER => ['Content-Type: application/json'], CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 8, CURLOPT_CONNECTTIMEOUT => 3]);
curl_exec($ch);
$status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
concluirLead($status >= 200 && $status < 300 ? 200 : ($status >= 400 && $status < 500 ? $status : 503));
