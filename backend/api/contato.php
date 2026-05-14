<?php
// ================================================================
// ROBÉRIO DIÓGENES — api/contato.php
// POST /api/contato → recebe mensagem, notifica o autor
// ================================================================
require_once __DIR__ . '/../middleware/resposta.php';
require_once __DIR__ . '/../middleware/rate_limit.php';
require_once __DIR__ . '/../services/email.php';
require_once __DIR__ . '/../config/banco.php';

class ContatoAPI {
    public function __construct(
        private array  $body,
        private string $acao,
        private string $id,
        private string $metodo
    ) {}

    public function handle(): void {
        if ($this->metodo !== 'POST') {
            resposta_erro('Método não permitido', 405);
        }
        $this->enviar();
    }

    private function enviar(): void {
        rate_limit('contato', RATE_LIMITE_CONTATO, RATE_LIMITE_JANELA);

        validar_campos($this->body, ['nome', 'email', 'mensagem']);

        $nome     = limpar($this->body['nome']);
        $email    = strtolower(limpar($this->body['email']));
        $assunto  = limpar($this->body['assunto'] ?? 'Mensagem do site');
        $mensagem = limpar($this->body['mensagem']);

        if (!email_valido($email)) {
            resposta_erro('E-mail inválido.');
        }
        if (strlen($mensagem) < 10) {
            resposta_erro('Mensagem muito curta.');
        }

        // Salva no banco
        Banco::inserir(
            "INSERT INTO mensagens (nome, email, assunto, mensagem) VALUES (?, ?, ?, ?)",
            [$nome, $email, $assunto, $mensagem]
        );

        // Notifica o autor
        EmailService::contatoNotificacaoAdmin($nome, $email, $assunto, $mensagem);

        // Confirma para o remetente
        EmailService::contatoConfirmacao($email, $nome, $assunto);

        resposta_ok([
            'mensagem' => "Mensagem recebida! Responderei em até 48 horas, {$nome}."
        ], 201);
    }
}
