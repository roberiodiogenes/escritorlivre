<?php
// ================================================================
// ROBÉRIO DIÓGENES — api/posts.php
// GET /api/posts            → lista posts publicados
// GET /api/posts/:slug      → post completo
// POST/PUT/DELETE           → apenas admin
// ================================================================
require_once __DIR__ . '/../middleware/resposta.php';
require_once __DIR__ . '/../config/banco.php';

class PostsAPI {
    public function __construct(
        private array  $body,
        private string $acao,
        private string $id,
        private string $metodo
    ) {}

    public function handle(): void {
        match ($this->metodo) {
            'GET'    => $this->acao ? $this->um()  : $this->listar(),
            'POST'   => $this->criar(),
            'PUT'    => $this->atualizar(),
            'DELETE' => $this->deletar(),
            default  => resposta_erro('Método não permitido', 405)
        };
    }

    private function listar(): void {
        $categoria = $_GET['categoria'] ?? '';
        $limite    = min((int)($_GET['limite'] ?? 10), 50);
        $pagina    = max((int)($_GET['pagina'] ?? 1), 1);
        $offset    = ($pagina - 1) * $limite;

        $sql    = "SELECT id, slug, titulo, subtitulo, categoria, resumo, imagem_url,
                          tempo_leitura, publicado_em
                   FROM posts WHERE status = 'publicado'";
        $params = [];

        if ($categoria) {
            $sql .= " AND categoria = ?";
            $params[] = $categoria;
        }

        $sql .= " ORDER BY publicado_em DESC LIMIT {$limite} OFFSET {$offset}";

        $total = Banco::um(
            "SELECT COUNT(*) as c FROM posts WHERE status = 'publicado'" .
            ($categoria ? " AND categoria = ?" : ""),
            $categoria ? [$categoria] : []
        )['c'];

        resposta_ok([
            'posts'      => Banco::todos($sql, $params),
            'total'      => (int)$total,
            'pagina'     => $pagina,
            'total_pags' => (int)ceil($total / $limite),
        ]);
    }

    private function um(): void {
        $post = Banco::um(
            "SELECT * FROM posts WHERE slug = ? AND status = 'publicado'",
            [$this->acao]
        );

        if (!$post) {
            resposta_erro('Post não encontrado.', 404);
        }

        // Posts relacionados (mesma categoria)
        $post['relacionados'] = Banco::todos(
            "SELECT slug, titulo, imagem_url, publicado_em FROM posts
             WHERE categoria = ? AND slug != ? AND status = 'publicado'
             ORDER BY publicado_em DESC LIMIT 3",
            [$post['categoria'], $post['slug']]
        );

        resposta_ok($post);
    }

    private function criar(): void {
        auth_admin_requerida();
        validar_campos($this->body, ['titulo', 'slug', 'conteudo']);

        $status = ($this->body['publicar'] ?? false) ? 'publicado' : 'rascunho';
        $pubEm  = $status === 'publicado' ? date('Y-m-d H:i:s') : null;

        // Gera slug se não informado
        $slug = limpar($this->body['slug'] ?: $this->gerarSlug($this->body['titulo']));

        // Estima tempo de leitura (200 palavras/min)
        $palavras      = str_word_count(strip_tags($this->body['conteudo']));
        $tempoLeitura  = max(1, (int)round($palavras / 200));

        $id = Banco::inserir(
            "INSERT INTO posts (slug, titulo, subtitulo, categoria, resumo, conteudo,
                                imagem_url, status, tempo_leitura, publicado_em)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                $slug,
                limpar($this->body['titulo']),
                limpar($this->body['subtitulo']  ?? ''),
                limpar($this->body['categoria']  ?? 'reflexao'),
                limpar($this->body['resumo']     ?? ''),
                $this->body['conteudo'],
                limpar($this->body['imagem_url'] ?? ''),
                $status,
                $tempoLeitura,
                $pubEm,
            ]
        );

        resposta_ok(['id' => $id, 'slug' => $slug, 'mensagem' => 'Post criado!'], 201);
    }

    private function atualizar(): void {
        auth_admin_requerida();
        $slug = $this->acao;
        if (!$slug) resposta_erro('Slug obrigatório.', 400);

        $post = Banco::um("SELECT id, status FROM posts WHERE slug = ?", [$slug]);
        if (!$post) resposta_erro('Post não encontrado.', 404);

        $novoStatus = limpar($this->body['status'] ?? $post['status']);
        $pubEm = ($novoStatus === 'publicado' && $post['status'] !== 'publicado')
            ? date('Y-m-d H:i:s') : null;

        $palavras     = str_word_count(strip_tags($this->body['conteudo'] ?? ''));
        $tempoLeitura = max(1, (int)round($palavras / 200));

        Banco::query(
            "UPDATE posts SET titulo=?, subtitulo=?, categoria=?, resumo=?, conteudo=?,
             imagem_url=?, status=?, tempo_leitura=?,
             publicado_em = COALESCE(?, publicado_em), atualizado_em=NOW()
             WHERE slug=?",
            [
                limpar($this->body['titulo']      ?? ''),
                limpar($this->body['subtitulo']   ?? ''),
                limpar($this->body['categoria']   ?? 'reflexao'),
                limpar($this->body['resumo']      ?? ''),
                $this->body['conteudo']           ?? '',
                limpar($this->body['imagem_url']  ?? ''),
                $novoStatus,
                $tempoLeitura,
                $pubEm,
                $slug,
            ]
        );

        resposta_ok(['mensagem' => 'Post atualizado!']);
    }

    private function deletar(): void {
        auth_admin_requerida();
        Banco::query("DELETE FROM posts WHERE slug = ?", [$this->acao]);
        resposta_ok(['mensagem' => 'Post removido.']);
    }

    private function gerarSlug(string $titulo): string {
        $slug = strtolower($titulo);
        $slug = preg_replace('/[áàãâä]/u', 'a', $slug);
        $slug = preg_replace('/[éèêë]/u', 'e', $slug);
        $slug = preg_replace('/[íìîï]/u', 'i', $slug);
        $slug = preg_replace('/[óòõôö]/u', 'o', $slug);
        $slug = preg_replace('/[úùûü]/u', 'u', $slug);
        $slug = preg_replace('/[ç]/u', 'c', $slug);
        $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
        return trim($slug, '-');
    }
}
