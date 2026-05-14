<?php
// ================================================================
// ROBÉRIO DIÓGENES — api/auth.php
// POST /api/auth/registrar      → cria conta de leitor
// POST /api/auth/login          → faz login, retorna JWT
// POST /api/auth/esqueci-senha  → envia e-mail de recuperação
// POST /api/auth/nova-senha     → redefine senha com token
// GET  /api/auth/verificar      → verifica e-mail do cadastro
// ================================================================

require_once __DIR__ . '/../middleware/resposta.php';
require_once __DIR__ . '/../middleware/rate_limit.php';
require_once __DIR__ . '/../services/email.php';
require_once __DIR__ . '/../config/banco.php';

class AuthAPI {
    public function __construct(
        private array  $body,
        private string $acao,
        private string $id,
        private string $metodo
    ) {}

    public function handle(): void {
        match (true) {
            $this->metodo === 'POST' && $this->acao === 'registrar'     => $this->registrar(),
            $this->metodo === 'POST' && $this->acao === 'login'         => $this->login(),
            $this->metodo === 'POST' && $this->acao === 'esqueci-senha' => $this->esqueciSenha(),
            $this->metodo === 'POST' && $this->acao === 'nova-senha'    => $this->novaSenha(),
            $this->metodo === 'GET'  && $this->acao === 'verificar'     => $this->verificarEmail(),
            default => resposta_erro('Ação não encontrada', 404)
        };
    }

    // ── POST /api/auth/registrar ──────────────────────────────────
    private function registrar(): void {
        rate_limit('registrar', 5, RATE_LIMITE_JANELA);

        validar_campos($this->body, ['nome', 'email', 'senha']);

        $nome  = limpar($this->body['nome']);
        $email = strtolower(limpar($this->body['email']));
        $senha = $this->body['senha'];
        $nl    = !empty($this->body['newsletter']) ? 1 : 0;

        if (!email_valido($email)) {
            resposta_erro('E-mail inválido.');
        }
        if (strlen($senha) < 8) {
            resposta_erro('A senha deve ter no mínimo 8 caracteres.');
        }
        if (strlen($nome) < 2) {
            resposta_erro('Informe seu nome completo.');
        }

        // Verifica duplicidade
        if (Banco::um("SELECT id FROM leitores WHERE email = ?", [$email])) {
            resposta_erro('Este e-mail já está cadastrado. Faça login ou use "esqueci minha senha".', 409);
        }

        $senhaHash     = password_hash($senha, PASSWORD_BCRYPT, ['cost' => 12]);
        $tokenVerif    = gerar_token();

        $id = Banco::inserir(
            "INSERT INTO leitores (nome, email, senha_hash, newsletter, token_verificacao)
             VALUES (?, ?, ?, ?, ?)",
            [$nome, $email, $senhaHash, $nl, $tokenVerif]
        );

        // Também inscreve na newsletter se marcou a opção
        if ($nl) {
            $tokenNl = gerar_token();
            $tokenNlCanc = gerar_token();
            $existeNl = Banco::um("SELECT id FROM newsletter WHERE email = ?", [$email]);
            if (!$existeNl) {
                Banco::query(
                    "INSERT INTO newsletter (email, nome, status, token_confirmacao, token_cancelamento, origem)
                     VALUES (?, ?, 'pendente', ?, ?, 'cadastro')",
                    [$email, $nome, $tokenNl, $tokenNlCanc]
                );
                EmailService::newsletterConfirmacao($email, $nome, $tokenNl);
            }
        }

        EmailService::boasVindas($email, $nome);

        // Gera JWT para login automático
        $token = jwt_gerar(['leitor_id' => $id, 'email' => $email, 'nome' => $nome]);

        resposta_ok([
            'token' => $token,
            'leitor' => ['id' => $id, 'nome' => $nome, 'email' => $email],
            'mensagem' => 'Conta criada com sucesso!'
        ], 201);
    }

    // ── POST /api/auth/login ──────────────────────────────────────
    private function login(): void {
        rate_limit('login', RATE_LIMITE_LOGIN, RATE_LIMITE_JANELA);

        validar_campos($this->body, ['email', 'senha']);

        $email = strtolower(limpar($this->body['email']));
        $senha = $this->body['senha'];

        $leitor = Banco::um(
            "SELECT id, nome, email, senha_hash FROM leitores WHERE email = ?",
            [$email]
        );

        if (!$leitor || !password_verify($senha, $leitor['senha_hash'] ?? '')) {
            // Mesmo tempo de resposta para e-mail não encontrado e senha errada
            // (evita enumerar usuários)
            resposta_erro('E-mail ou senha incorretos.', 401);
        }

        $token = jwt_gerar([
            'leitor_id' => $leitor['id'],
            'email'     => $leitor['email'],
            'nome'      => $leitor['nome'],
        ]);

        // Cookie HttpOnly para front-end web (opcional)
        setcookie('rd_token', $token, [
            'expires'  => time() + JWT_EXPIRACAO,
            'path'     => '/',
            'secure'   => AMBIENTE === 'producao',
            'httponly' => true,
            'samesite' => 'Lax',
        ]);

        resposta_ok([
            'token'  => $token,
            'leitor' => [
                'id'    => $leitor['id'],
                'nome'  => $leitor['nome'],
                'email' => $leitor['email'],
            ],
        ]);
    }

    // ── POST /api/auth/esqueci-senha ──────────────────────────────
    private function esqueciSenha(): void {
        rate_limit('senha', 3, RATE_LIMITE_JANELA);

        validar_campos($this->body, ['email']);
        $email = strtolower(limpar($this->body['email']));

        $leitor = Banco::um(
            "SELECT id, nome FROM leitores WHERE email = ?",
            [$email]
        );

        // Sempre responde OK para não revelar se e-mail existe
        if (!$leitor) {
            resposta_ok(['mensagem' => 'Se este e-mail estiver cadastrado, você receberá as instruções em breve.']);
        }

        $token  = gerar_token();
        $expira = date('Y-m-d H:i:s', time() + 7200); // 2 horas

        Banco::query(
            "INSERT INTO tokens_senha (leitor_id, token, expira_em)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE token=VALUES(token), expira_em=VALUES(expira_em), usado=0",
            [$leitor['id'], $token, $expira]
        );

        EmailService::recuperacaoSenha($email, $leitor['nome'], $token);

        resposta_ok(['mensagem' => 'Se este e-mail estiver cadastrado, você receberá as instruções em breve.']);
    }

    // ── POST /api/auth/nova-senha ─────────────────────────────────
    private function novaSenha(): void {
        validar_campos($this->body, ['token', 'senha']);

        $token = limpar($this->body['token']);
        $senha = $this->body['senha'];

        if (strlen($senha) < 8) {
            resposta_erro('A senha deve ter no mínimo 8 caracteres.');
        }

        $registro = Banco::um(
            "SELECT leitor_id, expira_em, usado FROM tokens_senha WHERE token = ?",
            [$token]
        );

        if (!$registro || $registro['usado']) {
            resposta_erro('Token inválido ou já utilizado.', 400);
        }

        if (strtotime($registro['expira_em']) < time()) {
            resposta_erro('Este link de recuperação expirou. Solicite um novo.', 400);
        }

        $hash = password_hash($senha, PASSWORD_BCRYPT, ['cost' => 12]);
        Banco::query("UPDATE leitores SET senha_hash = ? WHERE id = ?", [$hash, $registro['leitor_id']]);
        Banco::query("UPDATE tokens_senha SET usado = 1 WHERE token = ?", [$token]);

        resposta_ok(['mensagem' => 'Senha alterada com sucesso! Faça login com sua nova senha.']);
    }

    // ── GET /api/auth/verificar ───────────────────────────────────
    private function verificarEmail(): void {
        $token = $_GET['token'] ?? $this->id;

        $leitor = Banco::um(
            "SELECT id FROM leitores WHERE token_verificacao = ?",
            [$token]
        );

        if (!$leitor) {
            header('Location: ' . SITE_URL . '/leitor/?erro=token-invalido');
            exit;
        }

        Banco::query(
            "UPDATE leitores SET verificado = 1, token_verificacao = NULL WHERE id = ?",
            [$leitor['id']]
        );

        header('Location: ' . SITE_URL . '/leitor/?verificado=1');
        exit;
    }
}
