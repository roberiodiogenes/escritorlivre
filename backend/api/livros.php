<?php
// ================================================================
// ROBÉRIO DIÓGENES — api/livros.php
// GET /api/livros           → lista todos os livros ativos
// GET /api/livros/:slug     → detalhes de um livro
// POST/PUT/DELETE           → apenas admin
// ================================================================
require_once __DIR__ . '/../middleware/resposta.php';
require_once __DIR__ . '/../config/banco.php';

class LivrosAPI {
    public function __construct(
        private array  $body,
        private string $acao,    // slug do livro
        private string $id,
        private string $metodo
    ) {}

    public function handle(): void {
        match ($this->metodo) {
            'GET'    => $this->acao ? $this->um()   : $this->listar(),
            'POST'   => $this->criar(),
            'PUT'    => $this->atualizar(),
            'DELETE' => $this->deletar(),
            default  => resposta_erro('Método não permitido', 405)
        };
    }

    private function listar(): void {
        $genero = $_GET['genero'] ?? '';
        $sql    = "SELECT id, slug, titulo, subtitulo, genero, sinopse, capa_url, amazon_url, paginas, publicado_em
                   FROM livros WHERE ativo = 1";
        $params = [];

        if ($genero) {
            $sql .= " AND genero LIKE ?";
            $params[] = "%{$genero}%";
        }
        $sql .= " ORDER BY ordem ASC";

        $livros = Banco::todos($sql, $params);

        // Adiciona média de avaliações para cada livro
        foreach ($livros as &$livro) {
            $av = Banco::um(
                "SELECT AVG(nota) as media, COUNT(*) as total FROM comentarios
                 WHERE livro_id = ? AND status = 'aprovado'",
                [$livro['id']]
            );
            $livro['avaliacao_media'] = $av['media'] ? round((float)$av['media'], 1) : null;
            $livro['avaliacao_total'] = (int)$av['total'];
        }

        resposta_ok($livros);
    }

    private function um(): void {
        $livro = Banco::um(
            "SELECT * FROM livros WHERE slug = ? AND ativo = 1",
            [$this->acao]
        );

        if (!$livro) {
            resposta_erro('Livro não encontrado.', 404);
        }

        // Comentários aprovados
        $livro['comentarios'] = Banco::todos(
            "SELECT c.nota, c.texto, c.criado_em, l.nome as leitor
             FROM comentarios c JOIN leitores l ON l.id = c.leitor_id
             WHERE c.livro_id = ? AND c.status = 'aprovado'
             ORDER BY c.criado_em DESC LIMIT 20",
            [$livro['id']]
        );

        // Capítulos gratuitos disponíveis
        $livro['capitulos'] = Banco::todos(
            "SELECT id, titulo, descricao FROM capitulos
             WHERE livro_id = ? AND ativo = 1",
            [$livro['id']]
        );

        // Estatísticas
        $av = Banco::um(
            "SELECT AVG(nota) as media, COUNT(*) as total FROM comentarios
             WHERE livro_id = ? AND status = 'aprovado'",
            [$livro['id']]
        );
        $livro['avaliacao_media'] = $av['media'] ? round((float)$av['media'], 1) : null;
        $livro['avaliacao_total'] = (int)$av['total'];

        resposta_ok($livro);
    }

    private function criar(): void {
        auth_admin_requerida();
        validar_campos($this->body, ['titulo', 'slug', 'genero']);

        $id = Banco::inserir(
            "INSERT INTO livros (slug, titulo, subtitulo, genero, sinopse, capa_url, amazon_url, paginas, publicado_em, ativo, ordem)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, (SELECT COALESCE(MAX(ordem),0)+1 FROM livros l2))",
            [
                limpar($this->body['slug']),
                limpar($this->body['titulo']),
                limpar($this->body['subtitulo']    ?? ''),
                limpar($this->body['genero']),
                limpar($this->body['sinopse']      ?? ''),
                limpar($this->body['capa_url']     ?? ''),
                limpar($this->body['amazon_url']   ?? ''),
                (int)($this->body['paginas']       ?? 0),
                $this->body['publicado_em']        ?? null,
            ]
        );

        resposta_ok(['id' => $id, 'mensagem' => 'Livro criado com sucesso!'], 201);
    }

    private function atualizar(): void {
        auth_admin_requerida();
        $slug = $this->acao;
        if (!$slug) resposta_erro('Slug obrigatório.', 400);

        Banco::query(
            "UPDATE livros SET titulo=?, subtitulo=?, genero=?, sinopse=?, capa_url=?, amazon_url=?,
             paginas=?, publicado_em=?, ativo=?, atualizado_em=NOW() WHERE slug=?",
            [
                limpar($this->body['titulo']      ?? ''),
                limpar($this->body['subtitulo']   ?? ''),
                limpar($this->body['genero']      ?? ''),
                limpar($this->body['sinopse']     ?? ''),
                limpar($this->body['capa_url']    ?? ''),
                limpar($this->body['amazon_url']  ?? ''),
                (int)($this->body['paginas']      ?? 0),
                $this->body['publicado_em']       ?? null,
                (int)($this->body['ativo']        ?? 1),
                $slug,
            ]
        );

        resposta_ok(['mensagem' => 'Livro atualizado!']);
    }

    private function deletar(): void {
        auth_admin_requerida();
        Banco::query("UPDATE livros SET ativo = 0 WHERE slug = ?", [$this->acao]);
        resposta_ok(['mensagem' => 'Livro removido do catálogo.']);
    }
}
