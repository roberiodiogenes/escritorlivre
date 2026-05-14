<?php
// ================================================================
// ROBÉRIO DIÓGENES — api/index.php
// Roteador principal da API
// Todas as requisições /api/* chegam aqui via .htaccess
// ================================================================

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/banco.php';
require_once __DIR__ . '/../middleware/cors.php';
require_once __DIR__ . '/../middleware/resposta.php';
require_once __DIR__ . '/../middleware/auth.php';

// ── CORS & Headers ────────────────────────────────────────────────
cors_headers();

// Responde imediatamente ao OPTIONS (preflight do browser)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

header('Content-Type: application/json; charset=utf-8');

// ── ROTEAMENTO ────────────────────────────────────────────────────
// Extrai o caminho após /api/
$caminho = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
$partes   = explode('/', $caminho);

// Remove o prefixo 'api' se presente
if (isset($partes[0]) && $partes[0] === 'api') {
    array_shift($partes);
}

$recurso  = $partes[0] ?? '';        // ex: 'newsletter', 'auth', 'contato'
$acao     = $partes[1] ?? '';        // ex: 'confirmar', 'login', 'download'
$id       = $partes[2] ?? '';        // ex: '42', 'abc123'
$metodo   = $_SERVER['REQUEST_METHOD'];

// Lê o body JSON enviado pelo front-end
$body = [];
$rawBody = file_get_contents('php://input');
if (!empty($rawBody)) {
    $body = json_decode($rawBody, true) ?? [];
}

// ── ROTAS ─────────────────────────────────────────────────────────
try {
    switch ($recurso) {

        // ── NEWSLETTER ──────────────────────────────────────────
        case 'newsletter':
            require_once __DIR__ . '/newsletter.php';
            $ctrl = new NewsletterAPI($body, $acao, $id, $metodo);
            $ctrl->handle();
            break;

        // ── AUTENTICAÇÃO ────────────────────────────────────────
        case 'auth':
            require_once __DIR__ . '/auth.php';
            $ctrl = new AuthAPI($body, $acao, $id, $metodo);
            $ctrl->handle();
            break;

        // ── LEITOR (área logada) ────────────────────────────────
        case 'leitor':
            $leitor = auth_requerida();           // lança erro se não logado
            require_once __DIR__ . '/leitor.php';
            $ctrl = new LeitorAPI($body, $acao, $id, $metodo, $leitor);
            $ctrl->handle();
            break;

        // ── CONTATO ─────────────────────────────────────────────
        case 'contato':
            require_once __DIR__ . '/contato.php';
            $ctrl = new ContatoAPI($body, $acao, $id, $metodo);
            $ctrl->handle();
            break;

        // ── ANALYTICS ───────────────────────────────────────────
        case 'analytics':
            require_once __DIR__ . '/analytics.php';
            $ctrl = new AnalyticsAPI($body, $acao, $id, $metodo);
            $ctrl->handle();
            break;

        // ── LIVROS ──────────────────────────────────────────────
        case 'livros':
            require_once __DIR__ . '/livros.php';
            $ctrl = new LivrosAPI($body, $acao, $id, $metodo);
            $ctrl->handle();
            break;

        // ── POSTS DO BLOG ────────────────────────────────────────
        case 'posts':
            require_once __DIR__ . '/posts.php';
            $ctrl = new PostsAPI($body, $acao, $id, $metodo);
            $ctrl->handle();
            break;

        // ── COMENTÁRIOS ─────────────────────────────────────────
        case 'comentarios':
            require_once __DIR__ . '/comentarios.php';
            $ctrl = new ComentariosAPI($body, $acao, $id, $metodo);
            $ctrl->handle();
            break;

        // ── CAPÍTULOS / DOWNLOAD ─────────────────────────────────
        case 'capitulo':
            require_once __DIR__ . '/capitulo.php';
            $ctrl = new CapituloAPI($body, $acao, $id, $metodo);
            $ctrl->handle();
            break;

        // ── ADMIN ────────────────────────────────────────────────
        case 'admin':
            $admin = auth_admin_requerida();      // lança erro se não for admin
            require_once __DIR__ . '/admin.php';
            $ctrl = new AdminAPI($body, $acao, $id, $metodo, $admin);
            $ctrl->handle();
            break;

        // ── UPLOADS ─────────────────────────────────────────────
        case 'upload':
            $admin = auth_admin_requerida();
            require_once __DIR__ . '/upload.php';
            $ctrl = new UploadAPI($acao, $metodo, $admin);
            $ctrl->handle();
            break;

        // ── BUSCA ────────────────────────────────────────────────
        case 'busca':
            require_once __DIR__ . '/busca.php';
            $ctrl = new BuscaAPI($body, $acao, $id, $metodo);
            $ctrl->handle();
            break;

        default:
            resposta_erro('Rota não encontrada', 404);
    }

} catch (Exception $e) {
    if (AMBIENTE === 'desenvolvimento') {
        resposta_erro($e->getMessage(), 500);
    } else {
        resposta_erro('Erro interno do servidor', 500);
        error_log('[ROBERIO API] ' . $e->getMessage() . ' em ' . $e->getFile() . ':' . $e->getLine());
    }
}
