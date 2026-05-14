<?php
// ================================================================
// ROBÉRIO DIÓGENES — services/email.php
// Serviço de envio de e-mail via SMTP (sem biblioteca externa)
// Usa a função mail() nativa ou SMTP com sockets
// Para o HostGator compartilhado, use o SMTP do próprio servidor
// ================================================================

require_once __DIR__ . '/../config/config.php';

class EmailService {

    // ── ENVIO PRINCIPAL ──────────────────────────────────────────
    public static function enviar(
        string $destinatario,
        string $nomeDestinatario,
        string $assunto,
        string $htmlBody,
        string $textoPlano = ''
    ): bool {

        // No HostGator compartilhado, a função mail() já usa o servidor SMTP local
        // Para desenvolvimento local com XAMPP, pode ser necessário configurar
        // um servidor SMTP externo

        $boundary = '----=_Part_' . md5(uniqid());

        $headers  = "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: multipart/alternative; boundary=\"{$boundary}\"\r\n";
        $headers .= "From: " . EMAIL_NOME . " <" . EMAIL_USUARIO . ">\r\n";
        $headers .= "Reply-To: " . EMAIL_REPLY . "\r\n";
        $headers .= "X-Mailer: PHP/" . PHP_VERSION . "\r\n";

        $corpo  = "--{$boundary}\r\n";
        $corpo .= "Content-Type: text/plain; charset=UTF-8\r\n";
        $corpo .= "Content-Transfer-Encoding: quoted-printable\r\n\r\n";
        $corpo .= quoted_printable_encode($textoPlano ?: strip_tags($htmlBody)) . "\r\n\r\n";

        $corpo .= "--{$boundary}\r\n";
        $corpo .= "Content-Type: text/html; charset=UTF-8\r\n";
        $corpo .= "Content-Transfer-Encoding: quoted-printable\r\n\r\n";
        $corpo .= quoted_printable_encode($htmlBody) . "\r\n\r\n";
        $corpo .= "--{$boundary}--";

        $para = "{$nomeDestinatario} <{$destinatario}>";

        $resultado = mail($para, $assunto, $corpo, $headers);

        if (!$resultado && AMBIENTE === 'desenvolvimento') {
            error_log("[EMAIL] Falha ao enviar para {$destinatario}: {$assunto}");
        }

        return $resultado;
    }

    // ── TEMPLATE BASE ─────────────────────────────────────────────
    private static function template(string $titulo, string $conteudo): string {
        $siteUrl = SITE_URL;
        $ano     = date('Y');
        return <<<HTML
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{$titulo}</title>
<style>
  body{margin:0;padding:0;background:#F5F0E8;font-family:Georgia,serif}
  .wrap{max-width:600px;margin:0 auto;padding:40px 20px}
  .card{background:#FAF7F2;border:1px solid #D4A843;border-radius:8px;padding:40px}
  .logo{text-align:center;margin-bottom:32px}
  .logo a{font-family:Georgia,serif;font-size:22px;color:#2C2418;text-decoration:none;letter-spacing:2px;text-transform:uppercase}
  .logo span{display:block;font-size:11px;color:#8C7D65;letter-spacing:3px;margin-top:4px;text-transform:uppercase;font-style:italic}
  .divisor{height:1px;background:#D4A843;opacity:.3;margin:24px 0}
  h1{font-size:22px;color:#2C2418;margin:0 0 16px;font-weight:normal}
  p{font-size:16px;color:#5C4F3A;line-height:1.7;margin:0 0 16px}
  .btn{display:inline-block;padding:14px 28px;background:#B8860B;color:#FAF7F2;text-decoration:none;border-radius:6px;font-size:14px;letter-spacing:1px;text-transform:uppercase;font-family:Georgia,serif;margin:8px 0}
  .rodape{text-align:center;margin-top:24px;font-size:12px;color:#8C7D65;font-style:italic}
  .rodape a{color:#B8860B;text-decoration:none}
</style>
</head>
<body>
<div class="wrap">
  <div class="card">
    <div class="logo">
      <a href="{$siteUrl}">Robério Diógenes</a>
      <span>Escritor Independente</span>
    </div>
    <div class="divisor"></div>
    {$conteudo}
    <div class="divisor"></div>
    <div class="rodape">
      <p>© {$ano} Robério Diógenes · Cascavel, Ceará<br>
      <a href="{$siteUrl}">roberiodiogenes.com.br</a></p>
    </div>
  </div>
</div>
</body>
</html>
HTML;
    }

    // ── E-MAILS ESPECÍFICOS ───────────────────────────────────────

    // Confirmação de inscrição na newsletter (double opt-in)
    public static function newsletterConfirmacao(
        string $email, string $nome, string $token
    ): bool {
        $url = SITE_URL . "/api/newsletter/confirmar/{$token}";
        $nomeCurto = explode(' ', $nome)[0];

        $html = self::template('Confirme sua inscrição', "
            <h1>Quase lá, {$nomeCurto}!</h1>
            <p>Você pediu para receber novidades de <strong>Robério Diógenes</strong> — lançamentos, capítulos gratuitos e reflexões do escritor.</p>
            <p>Clique no botão abaixo para confirmar sua inscrição:</p>
            <p style='text-align:center;margin:32px 0'>
              <a href='{$url}' class='btn'>Confirmar inscrição</a>
            </p>
            <p style='font-size:13px;color:#8C7D65'>Se você não pediu essa inscrição, ignore este e-mail. Nenhuma ação é necessária.</p>
            <p style='font-size:13px;color:#8C7D65'>Ou copie e cole este link no navegador:<br>{$url}</p>
        ");

        return self::enviar($email, $nome, 'Confirme sua inscrição — Robério Diógenes', $html);
    }

    // Entrega do capítulo gratuito após confirmação
    public static function capituloGratuito(
        string $email, string $nome, string $tituloLivro, string $urlDownload
    ): bool {
        $nomeCurto = explode(' ', $nome)[0] ?: 'Leitor';

        $html = self::template("Seu capítulo gratuito chegou!", "
            <h1>Seu capítulo chegou, {$nomeCurto}!</h1>
            <p>Como prometido, aqui está o capítulo gratuito de <strong>{$tituloLivro}</strong>.</p>
            <p style='text-align:center;margin:32px 0'>
              <a href='{$urlDownload}' class='btn'>Baixar capítulo (PDF)</a>
            </p>
            <p style='font-size:13px;color:#8C7D65'>Este link é válido por 48 horas.</p>
            <p>Espero que as primeiras páginas te prendam da mesma forma que as últimas me prenderam enquanto escrevia.</p>
            <p><em>— Robério Diógenes</em></p>
        ");

        return self::enviar($email, $nome, "Seu capítulo gratuito de {$tituloLivro}", $html);
    }

    // Confirmação de mensagem de contato (para o remetente)
    public static function contatoConfirmacao(
        string $email, string $nome, string $assunto
    ): bool {
        $nomeCurto = explode(' ', $nome)[0];

        $html = self::template('Mensagem recebida', "
            <h1>Recebi sua mensagem, {$nomeCurto}.</h1>
            <p>Obrigado por entrar em contato. Sua mensagem sobre <strong>&ldquo;{$assunto}&rdquo;</strong> chegou e será lida com atenção.</p>
            <p>Respondo normalmente em até <strong>48 horas</strong> nos dias úteis.</p>
            <p><em>— Robério Diógenes</em></p>
        ");

        return self::enviar($email, $nome, 'Recebi sua mensagem — Robério Diógenes', $html);
    }

    // Notificação de nova mensagem para o autor
    public static function contatoNotificacaoAdmin(
        string $nome, string $emailRemetente, string $assunto, string $mensagem
    ): bool {
        $html = self::template('Nova mensagem de contato', "
            <h1>Nova mensagem recebida</h1>
            <p><strong>De:</strong> {$nome} ({$emailRemetente})<br>
            <strong>Assunto:</strong> {$assunto}</p>
            <div style='background:#F5F0E8;border-left:3px solid #B8860B;padding:16px;margin:16px 0;border-radius:0 6px 6px 0;font-style:italic'>
              " . nl2br(htmlspecialchars($mensagem)) . "
            </div>
            <p style='text-align:center;margin-top:24px'>
              <a href='" . SITE_URL . "/admin/' class='btn'>Ver no painel admin</a>
            </p>
        ");

        return self::enviar(EMAIL_USUARIO, EMAIL_NOME, "Nova mensagem: {$assunto}", $html);
    }

    // Recuperação de senha
    public static function recuperacaoSenha(
        string $email, string $nome, string $token
    ): bool {
        $url = SITE_URL . "/leitor/?acao=nova-senha&token={$token}";
        $nomeCurto = explode(' ', $nome)[0];

        $html = self::template('Recuperação de senha', "
            <h1>Redefinir senha</h1>
            <p>Olá, {$nomeCurto}. Recebemos um pedido para redefinir a senha da sua conta.</p>
            <p style='text-align:center;margin:32px 0'>
              <a href='{$url}' class='btn'>Criar nova senha</a>
            </p>
            <p style='font-size:13px;color:#8C7D65'>Este link expira em <strong>2 horas</strong>.</p>
            <p style='font-size:13px;color:#8C7D65'>Se você não solicitou a redefinição de senha, ignore este e-mail. Sua senha não será alterada.</p>
        ");

        return self::enviar($email, $nome, 'Redefinir sua senha — Robério Diógenes', $html);
    }

    // Boas-vindas após cadastro
    public static function boasVindas(string $email, string $nome): bool {
        $nomeCurto = explode(' ', $nome)[0];

        $html = self::template('Bem-vindo!', "
            <h1>Bem-vindo, {$nomeCurto}!</h1>
            <p>Sua conta na área do leitor de <strong>Robério Diógenes</strong> foi criada com sucesso.</p>
            <p>Agora você pode:</p>
            <p>• Avaliar e comentar os livros<br>
               • Acompanhar seu histórico de compras<br>
               • Baixar capítulos exclusivos<br>
               • Participar dos enigmas e desafios</p>
            <p style='text-align:center;margin:32px 0'>
              <a href='" . SITE_URL . "/leitor/' class='btn'>Acessar minha conta</a>
            </p>
            <p><em>Boas leituras — Robério Diógenes</em></p>
        ");

        return self::enviar($email, $nome, 'Bem-vindo à área do leitor — Robério Diógenes', $html);
    }
}
