<?php
// ================================================================
// ROBÉRIO DIÓGENES — api/busca.php
// GET /api/busca?q=termo → busca em livros e posts
// ================================================================
require_once __DIR__ . '/../middleware/resposta.php';
require_once __DIR__ . '/../config/banco.php';

class BuscaAPI {
    public function __construct(
        private array  $body,
        private string $acao,
        private string $id,
        private string $metodo
    ) {}

    public function handle(): void {
        if ($this->metodo !== 'GET') {
            resposta_erro('Método não permitido', 405);
        }

        $q = trim($_GET['q'] ?? '');
        if (strlen($q) < 2) {
            resposta_ok(['livros' => [], 'posts' => []]);
        }

        $termo = "%{$q}%";

        $livros = Banco::todos(
            "SELECT slug, titulo, subtitulo, genero, capa_url
             FROM livros
             WHERE ativo = 1 AND (titulo LIKE ? OR subtitulo LIKE ? OR sinopse LIKE ? OR genero LIKE ?)
             LIMIT 5",
            [$termo, $termo, $termo, $termo]
        );

        $posts = Banco::todos(
            "SELECT slug, titulo, categoria, resumo, imagem_url, publicado_em
             FROM posts
             WHERE status = 'publicado' AND (titulo LIKE ? OR resumo LIKE ? OR conteudo LIKE ?)
             ORDER BY publicado_em DESC LIMIT 5",
            [$termo, $termo, $termo]
        );

        resposta_ok([
            'livros'      => $livros,
            'posts'       => $posts,
            'total'       => count($livros) + count($posts),
            'termo'       => $q,
        ]);
    }
}
