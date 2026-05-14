<?php
// ================================================================
// ROBÉRIO DIÓGENES — config/config.php
// Configurações gerais do sistema
// ================================================================

// ── AMBIENTE ────────────────────────────────────────────────────
// Mude para 'producao' antes de publicar no HostGator
define('AMBIENTE', 'desenvolvimento');

// ── BANCO DE DADOS ───────────────────────────────────────────────
// Desenvolvimento (XAMPP local): use os valores abaixo
// Produção (HostGator): substitua pelos dados do cPanel
define('DB_HOST', 'localhost');
define('DB_NOME', 'roberio_site');   // HostGator: geralmente cpanelusuario_roberio
define('DB_USUARIO', 'root');        // HostGator: usuário criado no cPanel
define('DB_SENHA', '');              // HostGator: senha criada no cPanel
define('DB_CHARSET', 'utf8mb4');

// ── SEGURANÇA ─────────────────────────────────────────────────────
// Gere uma chave aleatória: php -r "echo bin2hex(random_bytes(32));"
define('JWT_SECRET', 'TROQUE_ESTA_CHAVE_POR_UMA_ALEATORIA_DE_64_CHARS');
define('JWT_EXPIRACAO', 604800);          // 7 dias em segundos

// ── EMAIL (SMTP) ───────────────────────────────────────────────────
// Configuração para envio via Gmail ou servidor do HostGator
// Use uma senha de aplicativo do Gmail (não a senha normal)
define('EMAIL_HOST',    'smtp.gmail.com');  // ou 'mail.seudominio.com.br' no HostGator
define('EMAIL_PORTA',   587);
define('EMAIL_USUARIO', 'diogenes.escritor@gmail.com');
define('EMAIL_SENHA',   'SENHA_DE_APP_DO_GMAIL');  // gere em: myaccount.google.com/apppasswords
define('EMAIL_NOME',    'Robério Diógenes');
define('EMAIL_REPLY',   'diogenes.escritor@gmail.com');

// ── SITE ──────────────────────────────────────────────────────────
// Desenvolvimento: http://localhost
// Produção: https://www.seudominio.com.br
define('SITE_URL', AMBIENTE === 'producao'
    ? 'https://www.roberiodiogenes.com.br'
    : 'http://localhost/escritorlivre2/');

define('SITE_NOME', 'Robério Diógenes');

// ── UPLOADS ───────────────────────────────────────────────────────
// Pasta onde imagens e PDFs são salvos
define('UPLOAD_DIR',       __DIR__ . '/../uploads/');
define('UPLOAD_URL',       SITE_URL . '/api/uploads/');
define('UPLOAD_MAX_IMG',   5 * 1024 * 1024);    // 5 MB
define('UPLOAD_MAX_PDF',   20 * 1024 * 1024);   // 20 MB

// ── CORS ──────────────────────────────────────────────────────────
// Origens permitidas para requisições AJAX
define('CORS_ORIGENS', AMBIENTE === 'producao'
    ? ['https://www.roberiodiogenes.com.br']
    : ['http://localhost', 'http://127.0.0.1', 'http://localhost:5500', 'null']);

// ── RATE LIMITING ─────────────────────────────────────────────────
define('RATE_LIMITE_NEWSLETTER', 3);    // máx. 3 inscrições por IP por hora
define('RATE_LIMITE_CONTATO',    5);    // máx. 5 mensagens por IP por hora
define('RATE_LIMITE_LOGIN',      10);   // máx. 10 tentativas por IP por hora
define('RATE_LIMITE_JANELA',     3600); // janela de 1 hora em segundos
