<?php
// ================================================================
// ROBÉRIO DIÓGENES — api/comentarios.php
// GET  /api/comentarios/:livro_slug → lista aprovados
// POST /api/comentarios             → leitor autenticado posta
// ================================================================
require_once __DIR__ . '/../middleware/resposta.php';
require_once __DIR__ . '/../config/banco.php';

class ComentariosAPI {
    public function __construct(
        private array  $body,
        private string $acao,   // slug do livro
        private string $id,
        private string $metodo
    ) {}

    public function handle(): void {
        match ($this->metodo) {
            'GET'  => $this->listar(),
            'POST' => $this->criar(),
            default => resposta_erro('Método não permitido', 405)
        };
    }

    private function listar(): void {
        $slug = $this->acao;
        if (!$slug) resposta_erro('Informe o livro.', 400);

        $livro = Banco::um("SELECT id FROM livros WHERE slug = ?", [$slug]);
        if (!$livro) resposta_erro('Livro não encontrado.', 404);

        $comentarios = Banco::todos(
            "SELECT c.nota, c.texto, c.criado_em,
                    l.nome as leitor, l.avatar_url
             FROM comentarios c
             JOIN leitores l ON l.id = c.leitor_id
             WHERE c.livro_id = ? AND c.status = 'aprovado'
             ORDER BY c.criado_em DESC",
            [$livro['id']]
        );

        $media = Banco::um(
            "SELECT AVG(nota) as media, COUNT(*) as total
             FROM comentarios WHERE livro_id = ? AND status = 'aprovado'",
            [$livro['id']]
        );

        resposta_ok([
            'comentarios'     => $comentarios,
            'media'           => $media['media'] ? round((float)$media['media'], 1) : null,
            'total_avaliacoes' => (int)$media['total'],
        ]);
    }

    private function criar(): void {
        $leitor = auth_requerida();

        validar_campos($this->body, ['livro_slug', 'nota', 'texto']);

        $slug  = limpar($this->body['livro_slug']);
        $nota  = (int)$this->body['nota'];
        $texto = limpar($this->body['texto']);

        if ($nota < 1 || $nota > 5) {
            resposta_erro('A nota deve ser entre 1 e 5.', 422);
        }
        if (strlen($texto) < 10) {
            resposta_erro('Escreva pelo menos 10 caracteres.', 422);
        }

        $livro = Banco::um("SELECT id FROM livros WHERE slug = ?", [$slug]);
        if (!$livro) resposta_erro('Livro não encontrado.', 404);

        // Verifica se já avaliou este livro
        $jaAvaliou = Banco::um(
            "SELECT id FROM comentarios WHERE livro_id = ? AND leitor_id = ?",
            [$livro['id'], $leitor['leitor_id']]
        );
        if ($jaAvaliou) {
            resposta_erro('Você já avaliou este livro.', 409);
        }

        Banco::inserir(
            "INSERT INTO comentarios (livro_id, leitor_id, nota, texto, status)
             VALUES (?, ?, ?, ?, 'pendente')",
            [$livro['id'], $leitor['leitor_id'], $nota, $texto]
        );

        resposta_ok([
            'mensagem' => 'Avaliação enviada! Ela aparecerá após moderação. Obrigado!'
        ], 201);
    }
}
