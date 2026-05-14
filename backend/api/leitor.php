<?php
// ================================================================
// ROBÉRIO DIÓGENES — api/leitor.php
// GET /api/leitor/perfil      → dados do leitor logado
// PUT /api/leitor/perfil      → atualiza perfil
// GET /api/leitor/pedidos     → histórico de compras
// GET /api/leitor/biblioteca  → livros adquiridos
// ================================================================
require_once __DIR__ . '/../middleware/resposta.php';
require_once __DIR__ . '/../config/banco.php';

class LeitorAPI {
    public function __construct(
        private array  $body,
        private string $acao,
        private string $id,
        private string $metodo,
        private array  $leitor     // payload JWT já validado
    ) {}

    public function handle(): void {
        match (true) {
            $this->metodo === 'GET'  && $this->acao === 'perfil'     => $this->perfil(),
            $this->metodo === 'PUT'  && $this->acao === 'perfil'     => $this->atualizarPerfil(),
            $this->metodo === 'PUT'  && $this->acao === 'senha'      => $this->alterarSenha(),
            $this->metodo === 'GET'  && $this->acao === 'pedidos'    => $this->pedidos(),
            $this->metodo === 'GET'  && $this->acao === 'biblioteca' => $this->biblioteca(),
            $this->metodo === 'GET'  && $this->acao === 'downloads'  => $this->meusDowloads(),
            default => resposta_erro('Ação não encontrada', 404)
        };
    }

    private function perfil(): void {
        $leitor = Banco::um(
            "SELECT id, nome, sobrenome, email, bio, avatar_url, newsletter,
                    verificado, criado_em
             FROM leitores WHERE id = ?",
            [$this->leitor['leitor_id']]
        );

        if (!$leitor) resposta_erro('Leitor não encontrado.', 404);
        resposta_ok($leitor);
    }

    private function atualizarPerfil(): void {
        $id = $this->leitor['leitor_id'];

        Banco::query(
            "UPDATE leitores SET nome=?, sobrenome=?, bio=?, newsletter=?, atualizado_em=NOW()
             WHERE id=?",
            [
                limpar($this->body['nome']       ?? ''),
                limpar($this->body['sobrenome']  ?? ''),
                limpar($this->body['bio']        ?? ''),
                (int)($this->body['newsletter']  ?? 0),
                $id,
            ]
        );

        resposta_ok(['mensagem' => 'Perfil atualizado com sucesso!']);
    }

    private function alterarSenha(): void {
        $id    = $this->leitor['leitor_id'];
        validar_campos($this->body, ['senha_atual', 'nova_senha']);

        $leitor = Banco::um(
            "SELECT senha_hash FROM leitores WHERE id = ?", [$id]
        );

        if (!password_verify($this->body['senha_atual'], $leitor['senha_hash'] ?? '')) {
            resposta_erro('Senha atual incorreta.', 401);
        }

        if (strlen($this->body['nova_senha']) < 8) {
            resposta_erro('A nova senha deve ter no mínimo 8 caracteres.');
        }

        $hash = password_hash($this->body['nova_senha'], PASSWORD_BCRYPT, ['cost' => 12]);
        Banco::query("UPDATE leitores SET senha_hash = ? WHERE id = ?", [$hash, $id]);

        resposta_ok(['mensagem' => 'Senha alterada com sucesso!']);
    }

    private function pedidos(): void {
        $pedidos = Banco::todos(
            "SELECT p.id, p.formato, p.origem, p.valor, p.status, p.criado_em,
                    l.titulo, l.slug, l.capa_url
             FROM pedidos p JOIN livros l ON l.id = p.livro_id
             WHERE p.leitor_id = ?
             ORDER BY p.criado_em DESC",
            [$this->leitor['leitor_id']]
        );

        resposta_ok($pedidos);
    }

    private function biblioteca(): void {
        // Livros adquiridos (pedidos confirmados)
        $livros = Banco::todos(
            "SELECT DISTINCT l.id, l.titulo, l.slug, l.capa_url, l.genero,
                    p.formato, p.criado_em as adquirido_em
             FROM pedidos p JOIN livros l ON l.id = p.livro_id
             WHERE p.leitor_id = ? AND p.status IN ('confirmado','entregue')
             ORDER BY p.criado_em DESC",
            [$this->leitor['leitor_id']]
        );

        resposta_ok($livros);
    }

    private function meusDowloads(): void {
        $downloads = Banco::todos(
            "SELECT d.criado_em, c.titulo as capitulo, l.titulo as livro, l.slug
             FROM downloads d
             JOIN capitulos c ON c.id = d.capitulo_id
             JOIN livros l ON l.id = c.livro_id
             WHERE d.leitor_id = ?
             ORDER BY d.criado_em DESC",
            [$this->leitor['leitor_id']]
        );

        resposta_ok($downloads);
    }
}
