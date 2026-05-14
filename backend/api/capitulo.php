<?php
// ================================================================
// ROBÉRIO DIÓGENES — api/capitulo.php
// POST /api/capitulo/desbloquear → valida e-mail, gera link
// GET  /api/capitulo/download/:id?token=... → serve PDF e registra
// ================================================================
require_once __DIR__ . '/../middleware/resposta.php';
require_once __DIR__ . '/../middleware/rate_limit.php';
require_once __DIR__ . '/../services/email.php';
require_once __DIR__ . '/../config/banco.php';

class CapituloAPI {
    public function __construct(
        private array  $body,
        private string $acao,
        private string $id,
        private string $metodo
    ) {}

    public function handle(): void {
        match (true) {
            $this->metodo === 'POST' && $this->acao === 'desbloquear' => $this->desbloquear(),
            $this->metodo === 'GET'  && $this->acao === 'download'    => $this->download(),
            $this->metodo === 'GET'  && $this->acao === 'listar'      => $this->listar(),
            default => resposta_erro('Ação inválida', 404)
        };
    }

    // ── POST /api/capitulo/desbloquear ────────────────────────────
    // Recebe e-mail, inscreve na newsletter e envia link de download
    private function desbloquear(): void {
        rate_limit('download', 5, RATE_LIMITE_JANELA);

        validar_campos($this->body, ['email', 'capitulo_id']);

        $email      = strtolower(limpar($this->body['email']));
        $nome       = limpar($this->body['nome'] ?? 'Leitor');
        $capituloId = (int) $this->body['capitulo_id'];

        if (!email_valido($email)) {
            resposta_erro('E-mail inválido.');
        }

        // Busca o capítulo
        $capitulo = Banco::um(
            "SELECT c.*, l.titulo as livro FROM capitulos c
             JOIN livros l ON l.id = c.livro_id
             WHERE c.id = ? AND c.ativo = 1",
            [$capituloId]
        );

        if (!$capitulo) {
            resposta_erro('Capítulo não encontrado.', 404);
        }

        // Garante que o e-mail está na newsletter (ao menos pendente)
        $existeNl = Banco::um("SELECT id, status FROM newsletter WHERE email = ?", [$email]);
        if (!$existeNl) {
            $token     = gerar_token();
            $tokenCanc = gerar_token();
            Banco::query(
                "INSERT INTO newsletter (email, nome, status, token_confirmacao, token_cancelamento, origem)
                 VALUES (?, ?, 'pendente', ?, ?, 'download')",
                [$email, $nome, $token, $tokenCanc]
            );
            EmailService::newsletterConfirmacao($email, $nome, $token);
        }

        // Gera URL assinada com expiração de 48h
        $urlDownload = SITE_URL . "/api/capitulo/download/{$capituloId}?token=" .
            urlencode(gerar_token_download($capituloId, $email));

        // Envia e-mail com o capítulo
        EmailService::capituloGratuito($email, $nome, $capitulo['livro'], $urlDownload);

        resposta_ok([
            'mensagem' => "O capítulo foi enviado para {$email}. Verifique sua caixa de entrada!"
        ]);
    }

    // ── GET /api/capitulo/download/:id?token=... ──────────────────
    // Valida token HMAC, registra download e serve o arquivo
    private function download(): void {
        $capituloId = (int) $this->id;
        $token      = $_GET['token'] ?? '';

        if (empty($token)) {
            resposta_erro('Token de download ausente.', 403);
        }

        // Valida o token assinado
        $dados = validar_token_download($token, $capituloId);
        if (!$dados) {
            resposta_erro('Link expirado ou inválido. Solicite um novo download.', 403);
        }

        $capitulo = Banco::um(
            "SELECT * FROM capitulos WHERE id = ? AND ativo = 1",
            [$capituloId]
        );

        if (!$capitulo) {
            resposta_erro('Arquivo não encontrado.', 404);
        }

        // Registra o download no banco
        $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
        Banco::query(
            "INSERT INTO downloads (capitulo_id, email, ip_hash, user_agent, criado_em)
             VALUES (?, ?, ?, ?, NOW())",
            [
                $capituloId,
                $dados['email'],
                hash_ip($ip),
                substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 300)
            ]
        );

        // Serve o arquivo
        $arquivoUrl = $capitulo['arquivo_url'];

        // Se for URL externa (Cloudinary, etc.), redireciona
        if (str_starts_with($arquivoUrl, 'http')) {
            header('Location: ' . $arquivoUrl);
            exit;
        }

        // Se for arquivo local
        $caminhoLocal = UPLOAD_DIR . $arquivoUrl;
        if (!file_exists($caminhoLocal)) {
            resposta_erro('Arquivo não disponível.', 404);
        }

        $nomeArquivo = basename($caminhoLocal);
        header('Content-Type: application/pdf');
        header('Content-Disposition: attachment; filename="' . $nomeArquivo . '"');
        header('Content-Length: ' . filesize($caminhoLocal));
        header('Cache-Control: no-cache');
        readfile($caminhoLocal);
        exit;
    }

    // ── GET /api/capitulo/listar ──────────────────────────────────
    private function listar(): void {
        $livroSlug = $_GET['livro'] ?? '';
        $sql    = "SELECT c.id, c.titulo, c.descricao, l.titulo as livro, l.slug as livro_slug
                   FROM capitulos c JOIN livros l ON l.id = c.livro_id
                   WHERE c.ativo = 1";
        $params = [];

        if ($livroSlug) {
            $sql .= " AND l.slug = ?";
            $params[] = $livroSlug;
        }

        resposta_ok(Banco::todos($sql, $params));
    }
}

// ── Valida token de download ──────────────────────────────────────
function validar_token_download(string $tokenBase64, int $capituloId): ?array {
    $decoded = base64_decode($tokenBase64);
    if (!$decoded) return null;

    // Formato: capituloId:email:expira:hmac
    $partes = explode(':', $decoded, 4);
    if (count($partes) !== 4) return null;

    [$id, $email, $expira, $hmac] = $partes;

    // Verifica expiração
    if ((int)$expira < time()) return null;

    // Verifica ID
    if ((int)$id !== $capituloId) return null;

    // Verifica HMAC
    $payload  = "{$id}:{$email}:{$expira}";
    $hmacEsperado = hash_hmac('sha256', $payload, JWT_SECRET);
    if (!hash_equals($hmacEsperado, $hmac)) return null;

    return ['email' => $email, 'expira' => $expira];
}
