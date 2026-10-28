<?php
declare(strict_types=1);
require __DIR__ . '/../server/diagnostico.php';
$schema = json_decode(file_get_contents(__DIR__ . '/../public/api/schema.json'), true);
$dir = sys_get_temp_dir() . '/maestro-test-' . bin2hex(random_bytes(8));
mkdir($dir, 0700);
function verificar(bool $v, string $nome): void { if (!$v) throw new RuntimeException($nome); echo 'PASS ' . $nome . PHP_EOL; }
try {
    $dados = ['id' => '12345678-1234-1234-1234-123456789012', 'contato' => ['nome' => 'Teste', 'email' => 'teste@example.com', 'empresa' => 'Teste', 'cargo' => 'Teste', 'whatsapp' => ''], 'setor' => $schema['setores'][0], 'fat' => $schema['faturamentos'][0], 'respostas' => array_fill_keys(array_keys($schema['opcoes']), 0)];
    verificar(validarDiagnostico($dados, $schema) === $dados, 'dados e opções válidos');
    foreach (['respostas', 'email', 'perfil'] as $caso) {
        $ruim = $dados;
        if ($caso === 'respostas') $ruim['respostas']['quem'] = 999;
        if ($caso === 'email') $ruim['contato']['email'] = "teste@example.com\r\nBcc: outro@example.com";
        if ($caso === 'perfil') $ruim['setor'] = 'inválido';
        $recusado = false; try { validarDiagnostico($ruim, $schema); } catch (InvalidArgumentException $e) { $recusado = true; }
        verificar($recusado, 'recusa ' . $caso);
    }
    $salvo = guardarDiagnostico($dir, $dados, 1000);
    verificar(lerDiagnostico($dir, $salvo['token'], 1001) === null, 'envio ainda não confirmado não libera resultado');
    $salvo['registro']['enviado'] = true;
    file_put_contents($salvo['arquivo'], json_encode($salvo['registro']));
    verificar(lerDiagnostico($dir, $salvo['token'], 1001) === $dados, 'token válido recupera resultado em outro acesso');
    verificar(lerDiagnostico($dir, str_repeat('a', 64), 1001) === null, 'token desconhecido é recusado');
    verificar(lerDiagnostico($dir, '../../config.php', 1001) === null, 'não permite caminho de arquivo no token');
    verificar(lerDiagnostico($dir, $salvo['token'], 1000 + 7 * 86400) === null, 'token expira em sete dias');
    verificar(!str_contains(basename($salvo['arquivo']), $salvo['token']), 'somente hash do token é guardado');
    verificar(limitarEnvio($dir, 'teste', 2, 60, 1000), 'primeira solicitação aceita');
    verificar(limitarEnvio($dir, 'teste', 2, 60, 1001), 'segunda solicitação aceita');
    verificar(!limitarEnvio($dir, 'teste', 2, 60, 1002), 'limite impede repetição');
    verificar(limitarEnvio($dir, 'teste', 2, 60, 1062), 'limite libera após a janela');
} finally { foreach (glob($dir . '/*.json') as $arquivo) unlink($arquivo); rmdir($dir); }
