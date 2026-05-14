<?php
// ================================================================
// ROBÉRIO DIÓGENES — middleware/resposta.php
// Funções para padronizar respostas JSON
// ================================================================

function resposta_ok(array|string $dados = [], int $codigo = 200): void {
    http_response_code($codigo);
    echo json_encode([
        'sucesso' => true,
        'dados'   => $dados,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function resposta_erro(string $mensagem, int $codigo = 400, array $extras = []): void {
    http_response_code($codigo);
    echo json_encode(array_merge([
        'sucesso'  => false,
        'mensagem' => $mensagem,
    ], $extras), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

// Valida campos obrigatórios no body da requisição
function validar_campos(array $body, array $campos): void {
    foreach ($campos as $campo) {
        if (empty($body[$campo])) {
            resposta_erro("O campo '{$campo}' é obrigatório.", 422);
        }
    }
}

// Sanitiza string removendo tags e espaços extras
function limpar(string $valor): string {
    return trim(strip_tags($valor));
}

// Valida e-mail
function email_valido(string $email): bool {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

// Gera token aleatório seguro
function gerar_token(int $bytes = 32): string {
    return bin2hex(random_bytes($bytes));
}

// Hash anônimo de IP (para analytics sem expor dado pessoal)
function hash_ip(string $ip): string {
    return hash('sha256', $ip . JWT_SECRET);
}
