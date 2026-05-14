<?php
// ================================================================
// ROBÉRIO DIÓGENES — api/analytics.php
// POST /api/analytics/pageview → registra visita única
// GET  /api/analytics/resumo  → resumo para o admin
// ================================================================
require_once __DIR__ . '/../middleware/resposta.php';
require_once __DIR__ . '/../config/banco.php';

class AnalyticsAPI {
    public function __construct(
        private array  $body,
        private string $acao,
        private string $id,
        private string $metodo
    ) {}

    public function handle(): void {
        match (true) {
            $this->metodo === 'POST' && $this->acao === 'pageview' => $this->registrarVisita(),
            $this->metodo === 'GET'  && $this->acao === 'resumo'   => $this->resumo(),
            default => resposta_erro('Ação inválida', 404)
        };
    }

    // ── POST /api/analytics/pageview ─────────────────────────────
    // Registra 1 visita única por fingerprint+página por dia
    private function registrarVisita(): void {
        $ip        = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
        $ua        = $_SERVER['HTTP_USER_AGENT'] ?? '';
        $pagina    = limpar($this->body['pagina'] ?? '/');
        $referrer  = substr(limpar($this->body['referrer'] ?? ''), 0, 500);
        $hoje      = date('Y-m-d');

        // Fingerprint: hash do IP + UA + data (anônimo e não rastreável individualmente)
        $fingerprint = hash('sha256', $ip . $ua . $hoje . JWT_SECRET);
        $ipHash      = hash_ip($ip);

        // Detecta dispositivo pelo User-Agent
        $dispositivo = 'desktop';
        $uaLower = strtolower($ua);
        if (str_contains($uaLower, 'bot') || str_contains($uaLower, 'crawler') || str_contains($uaLower, 'spider')) {
            $dispositivo = 'bot';
        } elseif (preg_match('/mobile|android|iphone|ipad/i', $ua)) {
            $dispositivo = preg_match('/ipad|tablet/i', $ua) ? 'tablet' : 'mobile';
        }

        // Ignora bots
        if ($dispositivo === 'bot') {
            resposta_ok(['registrado' => false]);
        }

        // INSERT IGNORE: se já existe fingerprint+página hoje, não faz nada
        Banco::query(
            "INSERT IGNORE INTO visitas (pagina, fingerprint, ip_hash, dispositivo, referrer, criado_em)
             VALUES (?, ?, ?, ?, ?, ?)",
            [$pagina, $fingerprint, $ipHash, $dispositivo, $referrer, $hoje]
        );

        resposta_ok(['registrado' => true]);
    }

    // ── GET /api/analytics/resumo ─────────────────────────────────
    // Apenas admin pode ver
    private function resumo(): void {
        // Verifica token admin via query string ou header
        $token = $_GET['token'] ?? null;
        if ($token) {
            $payload = jwt_validar($token);
            if (!$payload || empty($payload['admin'])) {
                resposta_erro('Acesso restrito.', 403);
            }
        } else {
            auth_admin_requerida();
        }

        $hoje     = date('Y-m-d');
        $semana   = date('Y-m-d', strtotime('-7 days'));
        $mes      = date('Y-m-d', strtotime('-30 days'));

        $dados = [
            'hoje'    => (int) Banco::um("SELECT COUNT(*) as c FROM visitas WHERE criado_em = ?",   [$hoje])['c'],
            'semana'  => (int) Banco::um("SELECT COUNT(*) as c FROM visitas WHERE criado_em >= ?", [$semana])['c'],
            'mes'     => (int) Banco::um("SELECT COUNT(*) as c FROM visitas WHERE criado_em >= ?", [$mes])['c'],
            'total'   => (int) Banco::um("SELECT COUNT(*) as c FROM visitas")['c'],

            // Visitas por página (top 10)
            'por_pagina' => Banco::todos(
                "SELECT pagina, COUNT(*) as visitas FROM visitas WHERE criado_em >= ?
                 GROUP BY pagina ORDER BY visitas DESC LIMIT 10",
                [$mes]
            ),

            // Visitas últimos 14 dias
            'por_dia' => Banco::todos(
                "SELECT criado_em as data, COUNT(*) as visitas FROM visitas
                 WHERE criado_em >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
                 GROUP BY criado_em ORDER BY criado_em ASC"
            ),

            // Por dispositivo
            'dispositivos' => Banco::todos(
                "SELECT dispositivo, COUNT(*) as total FROM visitas
                 WHERE criado_em >= ? GROUP BY dispositivo",
                [$mes]
            ),

            // Downloads
            'downloads_total' => (int) Banco::um("SELECT COUNT(*) as c FROM downloads")['c'],
            'downloads_mes'   => (int) Banco::um(
                "SELECT COUNT(*) as c FROM downloads WHERE criado_em >= ?",
                [date('Y-m-d H:i:s', strtotime('-30 days'))]
            )['c'],
        ];

        resposta_ok($dados);
    }
}
