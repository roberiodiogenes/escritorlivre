<?php
// ================================================================
// ROBÉRIO DIÓGENES — middleware/auth.php
// Autenticação JWT simples sem biblioteca externa
// Compatível com PHP 7.4+ (HostGator compartilhado)
// ================================================================

require_once __DIR__ . '/../middleware/resposta.php';

// ── GERAÇÃO DE JWT ────────────────────────────────────────────────
function jwt_gerar(array $payload): string {
    $header  = base64url_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $payload['iat'] = time();
    $payload['exp'] = time() + JWT_EXPIRACAO;
    $corpo   = base64url_encode(json_encode($payload));
    $assinatura = base64url_encode(hash_hmac('sha256', "$header.$corpo", JWT_SECRET, true));
    return "$header.$corpo.$assinatura";
}

// ── VALIDAÇÃO DE JWT ──────────────────────────────────────────────
function jwt_validar(string $token): ?array {
    $partes = explode('.', $token);
    if (count($partes) !== 3) return null;

    [$header, $corpo, $assinatura] = $partes;

    // Verifica assinatura
    $assinaturaEsperada = base64url_encode(
        hash_hmac('sha256', "$header.$corpo", JWT_SECRET, true)
    );
    if (!hash_equals($assinaturaEsperada, $assinatura)) return null;

    // Decodifica payload
    $payload = json_decode(base64url_decode($corpo), true);
    if (!$payload) return null;

    // Verifica expiração
    if (isset($payload['exp']) && $payload['exp'] < time()) return null;

    return $payload;
}

// ── EXTRAI TOKEN DO HEADER ────────────────────────────────────────
function jwt_do_header(): ?string {
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (preg_match('/Bearer\s+(.+)/i', $header, $m)) {
        return $m[1];
    }
    // Tenta via cookie também (para o front-end web)
    return $_COOKIE['rd_token'] ?? null;
}

// ── MIDDLEWARE: ROTA PROTEGIDA (LEITOR) ──────────────────────────
function auth_requerida(): array {
    $token = jwt_do_header();
    if (!$token) {
        resposta_erro('Autenticação necessária.', 401);
    }
    $payload = jwt_validar($token);
    if (!$payload || empty($payload['leitor_id'])) {
        resposta_erro('Token inválido ou expirado.', 401);
    }
    return $payload;
}

// ── MIDDLEWARE: ROTA PROTEGIDA (ADMIN) ───────────────────────────
function auth_admin_requerida(): array {
    $payload = auth_requerida();
    if (empty($payload['admin'])) {
        resposta_erro('Acesso restrito.', 403);
    }
    return $payload;
}

// ── AUXILIARES BASE64 URL-SAFE ────────────────────────────────────
function base64url_encode(string $data): string {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64url_decode(string $data): string {
    return base64_decode(strtr($data, '-_', '+/'));
}
