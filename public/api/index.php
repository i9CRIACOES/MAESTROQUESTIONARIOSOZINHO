<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');

function resposta(int $status, array $dados): void {
    http_response_code($status);
    echo json_encode($dados, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    exit;
}

try {
    umask(0077);
    $privado = getenv('MAESTRO_PRIVATE_DIR') ?: dirname(__DIR__, 2) . '/.maestro-sozinho';
    $config = is_file($privado . '/config.php') ? require $privado . '/config.php' : [];
    if (!is_array($config) || !($config['habilitado'] ?? false)) resposta(503, ['erro' => 'O envio está temporariamente indisponível. Tente novamente em alguns minutos.']);
    require __DIR__ . '/diagnostico.php';
    $schema = json_decode(file_get_contents(__DIR__ . '/schema.json'), true, 512, JSON_THROW_ON_ERROR);
    $dir = $privado . '/resultados';
    if (!is_dir($dir) && !mkdir($dir, 0700, true) && !is_dir($dir)) throw new RuntimeException('storage');
    $agora = time();
    $acao = $_GET['acao'] ?? '';

    if ($_SERVER['REQUEST_METHOD'] === 'GET' && $acao === 'resultado') {
        $token = $_SERVER['HTTP_X_RESULTADO_TOKEN'] ?? '';
        $dados = lerDiagnostico($dir, $token, $agora);
        if (!$dados) resposta(404, ['erro' => 'Este link é inválido ou expirou. Responda novamente para receber outro acesso.']);
        unset($dados['contato']['email'], $dados['contato']['whatsapp']);
        resposta(200, $dados);
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST' || $acao !== 'solicitar') resposta(405, ['erro' => 'Método não permitido.']);
    $origem = $_SERVER['HTTP_ORIGIN'] ?? '';
    $base = rtrim($config['url'] ?? 'https://responda.aodigital.net.br', '/');
    if ($origem !== '' && $origem !== $base) resposta(403, ['erro' => 'Origem não permitida.']);
    if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== 0) resposta(415, ['erro' => 'Formato inválido.']);
    if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 16384) resposta(413, ['erro' => 'Solicitação muito grande.']);
    $raw = file_get_contents('php://input', false, null, 0, 16385);
    if (strlen($raw) > 16384) resposta(413, ['erro' => 'Solicitação muito grande.']);
    $v = json_decode($raw, true, 32, JSON_THROW_ON_ERROR);
    if (!is_array($v)) resposta(400, ['erro' => 'Dados inválidos.']);
    $dados = validarDiagnostico($v, $schema);
    if (!empty($v['isca'])) resposta(202, ['ok' => true]);
    if (!limitarEnvio($dir, 'ip:' . ($_SERVER['REMOTE_ADDR'] ?? ''), 6, 3600, $agora) || !limitarEnvio($dir, 'email:' . $dados['contato']['email'], 3, 900, $agora)) resposta(429, ['erro' => 'Já recebemos suas solicitações. Aguarde alguns minutos e confira também o spam.']);
    $from = $config['remetente'] ?? '';
    if (!filter_var($from, FILTER_VALIDATE_EMAIL) || preg_match('/[\r\n]/', $from)) throw new RuntimeException('sender configuration');
    $salvo = guardarDiagnostico($dir, $dados, $agora);
    $url = $base . '/#resultado=' . $salvo['token'];
    $mensagem = "Olá!\n\nSeu diagnóstico Maestro está pronto. Acesse seus resultados pelo link abaixo:\n\n" . $url . "\n\nO link é pessoal e vale por 7 dias. Não o compartilhe.\nSe você não respondeu ao questionário, ignore esta mensagem.\n\nEquipe Maestro";
    $headers = ['From' => $from, 'MIME-Version' => '1.0', 'Content-Type' => 'text/plain; charset=UTF-8', 'Content-Transfer-Encoding' => '8bit'];
    $assunto = '=?UTF-8?B?' . base64_encode('Seu diagnóstico Maestro está pronto') . '?=';
    if (!mail($dados['contato']['email'], $assunto, $mensagem, $headers)) throw new RuntimeException('mail transport');
    $salvo['registro']['enviado'] = true;
    if (file_put_contents($salvo['arquivo'], json_encode($salvo['registro'], JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE), LOCK_EX) === false) throw new RuntimeException('storage activation');
    resposta(202, ['ok' => true]);
} catch (InvalidArgumentException $e) {
    resposta(422, ['erro' => $e->getMessage()]);
} catch (JsonException $e) {
    resposta(400, ['erro' => 'Dados inválidos. Recarregue a página e tente novamente.']);
} catch (Throwable $e) {
    error_log('Maestro sozinho: ' . get_class($e));
    resposta(503, ['erro' => 'Não conseguimos enviar seu acesso agora. Seus dados continuam no formulário; tente novamente.']);
}
