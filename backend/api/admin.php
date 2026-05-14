<?php
// ================================================================
// ROBÉRIO DIÓGENES — api/admin.php
// Painel administrativo completo
// Todas as rotas exigem token admin
// ================================================================
require_once __DIR__ . '/../middleware/resposta.php';
require_once __DIR__ . '/../config/banco.php';

class AdminAPI {
    public function __construct(
        private array  $body,
        private string $acao,
        private string $id,
        private string $metodo,
        private array  $admin
    ) {}

    public function handle(): void {
        match (true) {
            // Login admin (única rota sem auth, tratada no index.php antes)
            $this->acao === 'login'          => $this->login(),

            // Dashboard
            $this->acao === 'dashboard'      => $this->dashboard(),

            // Mensagens
            $this->acao === 'mensagens'      => $this->mensagens(),
            $this->acao === 'mensagem-lida'  => $this->marcarLida(),

            // Newsletter
            $this->acao === 'newsletter'     => $this->newsletter(),
            $this->acao === 'disparar'       => $this->dispararEmail(),

            // Leitores
            $this->acao === 'leitores'       => $this->leitores(),

            // Comentários (moderação)
            $this->acao === 'comentarios'    => $this->comentarios(),
            $this->acao === 'moderar'        => $this->moderarComentario(),

            // Pedidos
            $this->acao === 'pedidos'        => $this->pedidos(),
            $this->acao === 'pedido-criar'   => $this->criarPedido(),

            // Capítulos
            $this->acao === 'capitulos'      => $this->capitulos(),
            $this->acao === 'capitulo-criar' => $this->criarCapitulo(),

            default => resposta_erro('Ação não encontrada', 404)
        };
    }

    // ── LOGIN ADMIN ───────────────────────────────────────────────
    // Chamado antes da verificação de auth no index.php
    public function login(): void {
        require_once __DIR__ . '/../middleware/rate_limit.php';
        rate_limit('admin_login', 5, RATE_LIMITE_JANELA);

        validar_campos($this->body, ['email', 'senha']);

        $email = strtolower(limpar($this->body['email']));
        $senha = $this->body['senha'];

        $admin = Banco::um(
            "SELECT id, nome, email, senha_hash FROM admin_usuarios WHERE email = ?",
            [$email]
        );

        if (!$admin || !password_verify($senha, $admin['senha_hash'])) {
            resposta_erro('Credenciais inválidas.', 401);
        }

        Banco::query(
            "UPDATE admin_usuarios SET ultimo_login = NOW() WHERE id = ?",
            [$admin['id']]
        );

        $token = jwt_gerar([
            'leitor_id' => 0,
            'admin'     => true,
            'admin_id'  => $admin['id'],
            'nome'      => $admin['nome'],
            'email'     => $admin['email'],
        ]);

        // Cookie seguro para o painel
        setcookie('rd_admin_token', $token, [
            'expires'  => time() + 28800, // 8 horas
            'path'     => '/admin/',
            'secure'   => AMBIENTE === 'producao',
            'httponly' => true,
            'samesite' => 'Strict',
        ]);

        resposta_ok([
            'token' => $token,
            'nome'  => $admin['nome'],
        ]);
    }

    // ── DASHBOARD ─────────────────────────────────────────────────
    private function dashboard(): void {
        $hoje   = date('Y-m-d');
        $mes    = date('Y-m-d', strtotime('-30 days'));
        $semana = date('Y-m-d', strtotime('-7 days'));

        resposta_ok([
            // Visitas
            'visitas_hoje'   => (int)Banco::um("SELECT COUNT(*) c FROM visitas WHERE criado_em = ?", [$hoje])['c'],
            'visitas_semana' => (int)Banco::um("SELECT COUNT(*) c FROM visitas WHERE criado_em >= ?", [$semana])['c'],
            'visitas_mes'    => (int)Banco::um("SELECT COUNT(*) c FROM visitas WHERE criado_em >= ?", [$mes])['c'],
            'visitas_total'  => (int)Banco::um("SELECT COUNT(*) c FROM visitas")['c'],

            // Newsletter
            'newsletter_ativos'   => (int)Banco::um("SELECT COUNT(*) c FROM newsletter WHERE status = 'ativo'")['c'],
            'newsletter_pendentes'=> (int)Banco::um("SELECT COUNT(*) c FROM newsletter WHERE status = 'pendente'")['c'],

            // Leitores
            'leitores_total' => (int)Banco::um("SELECT COUNT(*) c FROM leitores")['c'],
            'leitores_mes'   => (int)Banco::um("SELECT COUNT(*) c FROM leitores WHERE criado_em >= ?", [date('Y-m-d H:i:s', strtotime('-30 days'))])['c'],

            // Conteúdo
            'posts_publicados' => (int)Banco::um("SELECT COUNT(*) c FROM posts WHERE status = 'publicado'")['c'],
            'posts_rascunho'   => (int)Banco::um("SELECT COUNT(*) c FROM posts WHERE status = 'rascunho'")['c'],
            'livros_ativos'    => (int)Banco::um("SELECT COUNT(*) c FROM livros WHERE ativo = 1")['c'],

            // Pendências
            'mensagens_nao_lidas'      => (int)Banco::um("SELECT COUNT(*) c FROM mensagens WHERE lida = 0")['c'],
            'comentarios_pendentes'    => (int)Banco::um("SELECT COUNT(*) c FROM comentarios WHERE status = 'pendente'")['c'],

            // Downloads
            'downloads_total' => (int)Banco::um("SELECT COUNT(*) c FROM downloads")['c'],
            'downloads_mes'   => (int)Banco::um("SELECT COUNT(*) c FROM downloads WHERE criado_em >= ?", [date('Y-m-d H:i:s', strtotime('-30 days'))])['c'],

            // Gráfico: visitas últimos 14 dias
            'grafico_visitas' => Banco::todos(
                "SELECT criado_em as data, COUNT(*) as total FROM visitas
                 WHERE criado_em >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
                 GROUP BY criado_em ORDER BY criado_em ASC"
            ),

            // Top páginas do mês
            'top_paginas' => Banco::todos(
                "SELECT pagina, COUNT(*) as visitas FROM visitas WHERE criado_em >= ?
                 GROUP BY pagina ORDER BY visitas DESC LIMIT 8",
                [$mes]
            ),
        ]);
    }

    // ── MENSAGENS ─────────────────────────────────────────────────
    private function mensagens(): void {
        $lida = isset($_GET['lida']) ? (int)$_GET['lida'] : null;
        $sql  = "SELECT * FROM mensagens";
        $params = [];

        if ($lida !== null) {
            $sql .= " WHERE lida = ?";
            $params[] = $lida;
        }
        $sql .= " ORDER BY criado_em DESC LIMIT 100";

        resposta_ok(Banco::todos($sql, $params));
    }

    private function marcarLida(): void {
        $id = (int)$this->id;
        if (!$id) resposta_erro('ID obrigatório', 400);
        Banco::query("UPDATE mensagens SET lida = 1 WHERE id = ?", [$id]);
        resposta_ok(['mensagem' => 'Marcada como lida.']);
    }

    // ── NEWSLETTER ────────────────────────────────────────────────
    private function newsletter(): void {
        $status = $_GET['status'] ?? 'ativo';
        $lista  = Banco::todos(
            "SELECT id, email, nome, status, origem, criado_em, confirmado_em
             FROM newsletter WHERE status = ? ORDER BY criado_em DESC",
            [$status]
        );
        resposta_ok($lista);
    }

    private function dispararEmail(): void {
        if ($this->metodo !== 'POST') resposta_erro('POST esperado', 405);
        validar_campos($this->body, ['assunto', 'conteudo']);

        // TODO: Integrar com Brevo/SendGrid para disparos em massa
        // Por enquanto registra a intenção e retorna preview
        resposta_ok([
            'mensagem' => 'Disparo agendado. Integre com Brevo para envio real.',
            'preview'  => [
                'assunto'      => $this->body['assunto'],
                'destinatarios'=> Banco::um("SELECT COUNT(*) c FROM newsletter WHERE status = 'ativo'")['c'],
            ]
        ]);
    }

    // ── LEITORES ──────────────────────────────────────────────────
    private function leitores(): void {
        $busca = $_GET['q'] ?? '';
        $sql    = "SELECT id, nome, sobrenome, email, newsletter, verificado, criado_em FROM leitores";
        $params = [];

        if ($busca) {
            $sql .= " WHERE nome LIKE ? OR email LIKE ?";
            $params = ["%{$busca}%", "%{$busca}%"];
        }
        $sql .= " ORDER BY criado_em DESC LIMIT 200";

        resposta_ok(Banco::todos($sql, $params));
    }

    // ── COMENTÁRIOS ───────────────────────────────────────────────
    private function comentarios(): void {
        $status = $_GET['status'] ?? 'pendente';
        resposta_ok(Banco::todos(
            "SELECT c.id, c.nota, c.texto, c.status, c.criado_em,
                    l.nome as leitor, li.titulo as livro, li.slug as livro_slug
             FROM comentarios c
             JOIN leitores l  ON l.id  = c.leitor_id
             JOIN livros   li ON li.id = c.livro_id
             WHERE c.status = ?
             ORDER BY c.criado_em DESC",
            [$status]
        ));
    }

    private function moderarComentario(): void {
        if ($this->metodo !== 'PUT') resposta_erro('PUT esperado', 405);
        $id     = (int)$this->id;
        $status = limpar($this->body['status'] ?? 'aprovado');

        if (!in_array($status, ['aprovado', 'rejeitado'])) {
            resposta_erro('Status inválido.', 422);
        }

        Banco::query("UPDATE comentarios SET status = ? WHERE id = ?", [$status, $id]);
        resposta_ok(['mensagem' => "Comentário {$status}."]);
    }

    // ── PEDIDOS ───────────────────────────────────────────────────
    private function pedidos(): void {
        resposta_ok(Banco::todos(
            "SELECT p.*, l.nome as leitor, li.titulo as livro
             FROM pedidos p
             JOIN leitores l  ON l.id  = p.leitor_id
             JOIN livros   li ON li.id = p.livro_id
             ORDER BY p.criado_em DESC LIMIT 200"
        ));
    }

    private function criarPedido(): void {
        if ($this->metodo !== 'POST') resposta_erro('POST esperado', 405);
        validar_campos($this->body, ['email_leitor', 'livro_slug']);

        $leitor = Banco::um(
            "SELECT id FROM leitores WHERE email = ?",
            [strtolower(limpar($this->body['email_leitor']))]
        );
        if (!$leitor) resposta_erro('Leitor não encontrado.', 404);

        $livro = Banco::um(
            "SELECT id FROM livros WHERE slug = ?",
            [limpar($this->body['livro_slug'])]
        );
        if (!$livro) resposta_erro('Livro não encontrado.', 404);

        $id = Banco::inserir(
            "INSERT INTO pedidos (leitor_id, livro_id, formato, origem, valor, status)
             VALUES (?, ?, ?, ?, ?, 'confirmado')",
            [
                $leitor['id'],
                $livro['id'],
                limpar($this->body['formato'] ?? 'ebook'),
                limpar($this->body['origem']  ?? 'amazon'),
                (float)($this->body['valor']  ?? 0),
            ]
        );

        resposta_ok(['id' => $id, 'mensagem' => 'Pedido registrado!'], 201);
    }

    // ── CAPÍTULOS ─────────────────────────────────────────────────
    private function capitulos(): void {
        resposta_ok(Banco::todos(
            "SELECT c.*, l.titulo as livro FROM capitulos c
             JOIN livros l ON l.id = c.livro_id ORDER BY c.livro_id, c.id"
        ));
    }

    private function criarCapitulo(): void {
        if ($this->metodo !== 'POST') resposta_erro('POST esperado', 405);
        validar_campos($this->body, ['livro_slug', 'titulo', 'arquivo_url']);

        $livro = Banco::um("SELECT id FROM livros WHERE slug = ?", [limpar($this->body['livro_slug'])]);
        if (!$livro) resposta_erro('Livro não encontrado.', 404);

        $id = Banco::inserir(
            "INSERT INTO capitulos (livro_id, titulo, descricao, arquivo_url, exige_email)
             VALUES (?, ?, ?, ?, ?)",
            [
                $livro['id'],
                limpar($this->body['titulo']),
                limpar($this->body['descricao']  ?? ''),
                limpar($this->body['arquivo_url']),
                (int)($this->body['exige_email'] ?? 1),
            ]
        );

        resposta_ok(['id' => $id, 'mensagem' => 'Capítulo cadastrado!'], 201);
    }
}
