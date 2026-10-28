<?php
declare(strict_types=1);

function validarDiagnostico(array $v, array $schema): array {
    $c = $v['contato'] ?? null;
    if (!is_array($c)) throw new InvalidArgumentException('Informe os dados de contato.');
    $contato = [];
    foreach (['nome' => 120, 'email' => 254, 'empresa' => 120, 'cargo' => 120, 'whatsapp' => 30] as $k => $max) {
        if (!isset($c[$k]) || !is_string($c[$k]) || strlen($c[$k]) > $max * 4) throw new InvalidArgumentException('Confira os dados de contato.');
        $contato[$k] = trim($c[$k]);
    }
    $contato['email'] = strtolower($contato['email']);
    if (!filter_var($contato['email'], FILTER_VALIDATE_EMAIL) || preg_match('/[\r\n]/', $contato['email'])) throw new InvalidArgumentException('Informe um e-mail válido.');
    foreach (['nome', 'empresa', 'cargo'] as $k) if ($contato[$k] === '') throw new InvalidArgumentException('Preencha nome, empresa e cargo.');
    $contato['whatsapp'] = preg_replace('/\D/', '', $contato['whatsapp']);
    if ($contato['whatsapp'] !== '' && (strlen($contato['whatsapp']) < 10 || strlen($contato['whatsapp']) > 13)) throw new InvalidArgumentException('Confira o WhatsApp.');
    if (!in_array($v['setor'] ?? null, $schema['setores'], true) || !in_array($v['fat'] ?? null, $schema['faturamentos'], true)) throw new InvalidArgumentException('Selecione o perfil da empresa.');
    if (!is_array($v['respostas'] ?? null)) throw new InvalidArgumentException('Responda todas as 12 estações.');
    $respostas = [];
    foreach ($schema['opcoes'] as $id => $n) {
        $i = $v['respostas'][$id] ?? null;
        if (!is_int($i) || $i < 0 || $i >= $n) throw new InvalidArgumentException('Responda todas as 12 estações.');
        $respostas[$id] = $i;
    }
    $id = $v['id'] ?? '';
    if (!is_string($id) || !preg_match('/^[a-f0-9-]{36}$/iD', $id)) throw new InvalidArgumentException('Recarregue a página e tente novamente.');
    return ['id' => $id, 'contato' => $contato, 'setor' => $v['setor'], 'fat' => $v['fat'], 'respostas' => $respostas];
}

function guardarDiagnostico(string $dir, array $dados, int $agora): array {
    $token = bin2hex(random_bytes(32));
    $hash = hash('sha256', $token);
    $registro = ['dados' => $dados, 'expira' => $agora + 7 * 86400, 'enviado' => false];
    $arquivo = $dir . '/' . $hash . '.json';
    if (file_put_contents($arquivo, json_encode($registro, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE), LOCK_EX) === false) throw new RuntimeException('storage');
    chmod($arquivo, 0600);
    return ['token' => $token, 'arquivo' => $arquivo, 'registro' => $registro];
}

function lerDiagnostico(string $dir, string $token, int $agora): ?array {
    if (!preg_match('/^[a-f0-9]{64}$/D', $token)) return null;
    $arquivo = $dir . '/' . hash('sha256', $token) . '.json';
    if (!is_file($arquivo)) return null;
    $r = json_decode((string) file_get_contents($arquivo), true);
    if (!is_array($r) || !($r['enviado'] ?? false) || ($r['expira'] ?? 0) <= $agora) return null;
    return $r['dados'];
}

function limitarEnvio(string $dir, string $chave, int $max, int $janela, int $agora): bool {
    $f = fopen($dir . '/limite-' . hash('sha256', $chave) . '.json', 'c+');
    if (!$f || !flock($f, LOCK_EX)) throw new RuntimeException('rate limit storage');
    try {
        $tempos = json_decode(stream_get_contents($f) ?: '[]', true);
        $tempos = array_values(array_filter(is_array($tempos) ? $tempos : [], fn($t) => is_int($t) && $t > $agora - $janela));
        if (count($tempos) >= $max) return false;
        $tempos[] = $agora;
        ftruncate($f, 0); rewind($f);
        if (fwrite($f, json_encode($tempos)) === false) throw new RuntimeException('rate limit write');
        return true;
    } finally { flock($f, LOCK_UN); fclose($f); }
}
