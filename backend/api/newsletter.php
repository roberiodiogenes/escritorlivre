<?php
// ================================================================
// ROBÉRIO DIÓGENES — api/newsletter.php
// POST /api/newsletter/inscrever   → cadastra e envia confirmação
// GET  /api/newsletter/confirmar/:token → ativa inscrição
// GET  /api/newsletter/cancelar/:token  → cancela inscrição
// ================================================================

require_once __DIR__ . '/../middleware/resposta.php';
require_once __DIR__ . '/../middleware/rate_limit.php';
require_once __DIR__ . '/../services/email.php';
require_once __DIR__ . '/../config/banco.php';

class NewsletterAPI {
    public function __construct(
        private array  $body,
        private string $acao,
        private string $id,
        private string $metodo
    ) {}

    public function handle(): void {
        match (true) {
            $this->metodo === 'POST' && $this->acao === 'inscrever'       => $this->inscrever(),
            $this->metodo === 'GET'  && $this->acao === 'confirmar'       => $this->confirmar(),
            $this->metodo === 'GET'  && $this->acao === 'cancelar'        => $this->cancelar(),
            $this->metodo === 'GET'  && $this->acao === ''                => $this->inscrever(),
            default => resposta_erro('Ação inválida', 404)
        };
    }

    // ── POST /api/newsletter/inscrever ────────────────────────────
    private function inscrever(): void {
        if ($this->metodo !== 'POST') {
            resposta_erro('Método não permitido', 405);
        }

        // Anti-spam
        rate_limit('newsletter', RATE_LIMITE_NEWSLETTER, RATE_LIMITE_JANELA);

        // Validação
        validar_campos($this->body, ['email']);
        $email  = strtolower(limpar($this->body['email']));
        $nome   = limpar($this->body['nome'] ?? 'Leitor');
        $origem = limpar($this->body['origem'] ?? 'site');

        if (!email_valido($email)) {
            resposta_erro('E-mail inválido.');
        }

        // Verifica se já existe
        $existente = Banco::um(
            "SELECT id, status FROM newsletter WHERE email = ?",
            [$email]
        );

        if ($existente) {
            if ($existente['status'] === 'ativo') {
                // Já inscrito — não é erro, apenas informa
                resposta_ok(['ja_inscrito' => true], 200);
            }
            if ($existente['status'] === 'cancelado') {
                // Reativa com novo token
                $token = gerar_token();
                Banco::query(
                    "UPDATE newsletter SET status='pendente', nome=?, token_confirmacao=?, criado_em=NOW() WHERE email=?",
                    [$nome, $token, $email]
                );
                EmailService::newsletterConfirmacao($email, $nome, $token);
                resposta_ok(['mensagem' => 'Enviamos um e-mail de confirmação para ' . $email]);
            }
            // Já pendente — reenvia confirmação
            $token = gerar_token();
            Banco::query(
                "UPDATE newsletter SET token_confirmacao=? WHERE email=?",
                [$token, $email]
            );
            EmailService::newsletterConfirmacao($email, $nome, $token);
            resposta_ok(['mensagem' => 'E-mail de confirmação reenviado para ' . $email]);
        }

        // Novo cadastro
        $token           = gerar_token();
        $tokenCancelamento = gerar_token();

        Banco::query(
            "INSERT INTO newsletter (email, nome, status, token_confirmacao, token_cancelamento, origem)
             VALUES (?, ?, 'pendente', ?, ?, ?)",
            [$email, $nome, $token, $tokenCancelamento, $origem]
        );

        EmailService::newsletterConfirmacao($email, $nome, $token);

        resposta_ok([
            'mensagem' => "Perfeito! Enviamos um e-mail de confirmação para {$email}. Verifique sua caixa de entrada."
        ], 201);
    }

    // ── GET /api/newsletter/confirmar/:token ──────────────────────
    private function confirmar(): void {
        $token = $this->id;
        if (empty($token)) {
            resposta_erro('Token inválido.', 400);
        }

        $inscrito = Banco::um(
            "SELECT id, email, nome, status FROM newsletter WHERE token_confirmacao = ?",
            [$token]
        );

        if (!$inscrito) {
            // Redireciona para página de erro amigável
            header('Location: ' . SITE_URL . '/?newsletter=token-invalido');
            exit;
        }

        if ($inscrito['status'] === 'ativo') {
            header('Location: ' . SITE_URL . '/?newsletter=ja-confirmado');
            exit;
        }

        // Ativa inscrição
        Banco::query(
            "UPDATE newsletter SET status='ativo', confirmado_em=NOW(), token_confirmacao=NULL WHERE id=?",
            [$inscrito['id']]
        );

        // Verifica se há capítulo gratuito para entregar
        $capitulo = Banco::um(
            "SELECT c.id, c.titulo, c.arquivo_url, l.titulo as livro
             FROM capitulos c JOIN livros l ON l.id = c.livro_id
             WHERE c.ativo = 1 AND c.exige_email = 1 LIMIT 1"
        );

        if ($capitulo) {
            $urlDownload = SITE_URL . "/api/capitulo/download/{$capitulo['id']}?token=" .
                urlencode(gerar_token_download($capitulo['id'], $inscrito['email']));
            EmailService::capituloGratuito(
                $inscrito['email'],
                $inscrito['nome'],
                $capitulo['livro'],
                $urlDownload
            );
        }

        // Redireciona para página de sucesso no front-end
        header('Location: ' . SITE_URL . '/?newsletter=confirmado');
        exit;
    }

    // ── GET /api/newsletter/cancelar/:token ───────────────────────
    private function cancelar(): void {
        $token = $this->id;
        if (empty($token)) {
            resposta_erro('Token inválido.', 400);
        }

        $inscrito = Banco::um(
            "SELECT id FROM newsletter WHERE token_cancelamento = ?",
            [$token]
        );

        if (!$inscrito) {
            header('Location: ' . SITE_URL . '/?newsletter=token-invalido');
            exit;
        }

        Banco::query(
            "UPDATE newsletter SET status='cancelado' WHERE id=?",
            [$inscrito['id']]
        );

        header('Location: ' . SITE_URL . '/?newsletter=cancelado');
        exit;
    }
}

// ── Gera token de download assinado (expira em 48h) ──────────────
function gerar_token_download(int $capituloId, string $email): string {
    $expira  = time() + 172800; // 48 horas
    $payload = "{$capituloId}:{$email}:{$expira}";
    $hmac    = hash_hmac('sha256', $payload, JWT_SECRET);
    return base64_encode("{$payload}:{$hmac}");
}
