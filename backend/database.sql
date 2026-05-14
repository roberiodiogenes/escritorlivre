-- ================================================================
-- ROBÉRIO DIÓGENES — Schema do Banco de Dados
-- MySQL 8.0+ | Compatível com HostGator (compartilhado e VPS)
-- Execute este arquivo uma única vez para criar todas as tabelas
-- ================================================================

-- Usar UTF-8 completo para suportar emojis e acentos corretamente
CREATE DATABASE IF NOT EXISTS roberio_site
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE roberio_site;

-- ── 1. LEITORES ────────────────────────────────────────────────
-- Usuários cadastrados na área do leitor
CREATE TABLE IF NOT EXISTS leitores (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome          VARCHAR(100) NOT NULL,
  sobrenome     VARCHAR(100),
  email         VARCHAR(255) NOT NULL UNIQUE,
  senha_hash    VARCHAR(255),                      -- NULL se login via Google
  google_id     VARCHAR(100) UNIQUE,               -- ID do OAuth Google
  bio           TEXT,                              -- mini bio para comentários
  avatar_url    VARCHAR(500),
  newsletter    TINYINT(1) NOT NULL DEFAULT 1,     -- deseja receber e-mails?
  verificado    TINYINT(1) NOT NULL DEFAULT 0,     -- e-mail confirmado?
  token_verificacao VARCHAR(100),                  -- token para confirmar e-mail
  criado_em     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_google (google_id)
) ENGINE=InnoDB;

-- ── 2. SESSÕES / TOKENS JWT ────────────────────────────────────
-- Controle de sessões ativas (permite logout remoto)
CREATE TABLE IF NOT EXISTS sessoes (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  leitor_id     INT UNSIGNED NOT NULL,
  token_hash    VARCHAR(64) NOT NULL UNIQUE,       -- SHA256 do JWT
  user_agent    VARCHAR(500),
  ip            VARCHAR(45),
  expira_em     DATETIME NOT NULL,
  criado_em     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (leitor_id) REFERENCES leitores(id) ON DELETE CASCADE,
  INDEX idx_token (token_hash),
  INDEX idx_expira (expira_em)
) ENGINE=InnoDB;

-- ── 3. TOKENS DE RECUPERAÇÃO DE SENHA ─────────────────────────
CREATE TABLE IF NOT EXISTS tokens_senha (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  leitor_id     INT UNSIGNED NOT NULL,
  token         VARCHAR(100) NOT NULL UNIQUE,
  usado         TINYINT(1) NOT NULL DEFAULT 0,
  expira_em     DATETIME NOT NULL,
  criado_em     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (leitor_id) REFERENCES leitores(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── 4. NEWSLETTER ──────────────────────────────────────────────
-- Inscritos que ainda não têm conta de leitor (ou que se inscreveram separadamente)
CREATE TABLE IF NOT EXISTS newsletter (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(255) NOT NULL UNIQUE,
  nome          VARCHAR(100),
  status        ENUM('pendente','ativo','cancelado') NOT NULL DEFAULT 'pendente',
  token_confirmacao VARCHAR(100) UNIQUE,           -- double opt-in
  token_cancelamento VARCHAR(100) UNIQUE,          -- para cancelar sem login
  origem        VARCHAR(100),                      -- ex: 'index', 'jogo-das-mascaras', 'whatsapp'
  criado_em     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  confirmado_em DATETIME,
  INDEX idx_email (email),
  INDEX idx_status (status)
) ENGINE=InnoDB;

-- ── 5. LIVROS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS livros (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug          VARCHAR(100) NOT NULL UNIQUE,      -- ex: 'jogo-das-mascaras'
  titulo        VARCHAR(255) NOT NULL,
  subtitulo     VARCHAR(255),
  genero        VARCHAR(100),
  sinopse       TEXT,
  capa_url      VARCHAR(500),
  amazon_url    VARCHAR(500),
  paginas       SMALLINT UNSIGNED,
  publicado_em  DATE,
  ativo         TINYINT(1) NOT NULL DEFAULT 1,
  ordem         TINYINT UNSIGNED NOT NULL DEFAULT 0, -- ordem no catálogo
  criado_em     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_slug (slug),
  INDEX idx_ativo (ativo)
) ENGINE=InnoDB;

-- ── 6. CAPÍTULOS / ARQUIVOS PARA DOWNLOAD ─────────────────────
CREATE TABLE IF NOT EXISTS capitulos (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  livro_id      INT UNSIGNED NOT NULL,
  titulo        VARCHAR(255) NOT NULL,
  descricao     TEXT,
  arquivo_url   VARCHAR(500) NOT NULL,             -- URL no Cloudinary/servidor
  exige_email   TINYINT(1) NOT NULL DEFAULT 1,     -- precisa informar e-mail?
  ativo         TINYINT(1) NOT NULL DEFAULT 1,
  criado_em     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (livro_id) REFERENCES livros(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── 7. DOWNLOADS ───────────────────────────────────────────────
-- Cada vez que alguém baixa um capítulo
CREATE TABLE IF NOT EXISTS downloads (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  capitulo_id   INT UNSIGNED NOT NULL,
  email         VARCHAR(255),                      -- e-mail informado
  leitor_id     INT UNSIGNED,                      -- NULL se não logado
  ip_hash       VARCHAR(64),                       -- SHA256 do IP
  user_agent    VARCHAR(300),
  criado_em     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (capitulo_id) REFERENCES capitulos(id) ON DELETE CASCADE,
  FOREIGN KEY (leitor_id)   REFERENCES leitores(id) ON DELETE SET NULL,
  INDEX idx_capitulo (capitulo_id),
  INDEX idx_email    (email),
  INDEX idx_data     (criado_em)
) ENGINE=InnoDB;

-- ── 8. POSTS DO BLOG ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS posts (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug          VARCHAR(150) NOT NULL UNIQUE,
  titulo        VARCHAR(255) NOT NULL,
  subtitulo     VARCHAR(255),
  categoria     ENUM('bastidores','reflexao','escritor','livros') NOT NULL DEFAULT 'reflexao',
  resumo        TEXT,
  conteudo      LONGTEXT NOT NULL,
  imagem_url    VARCHAR(500),
  status        ENUM('rascunho','publicado') NOT NULL DEFAULT 'rascunho',
  tempo_leitura TINYINT UNSIGNED,                  -- minutos estimados
  publicado_em  DATETIME,
  criado_em     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_slug   (slug),
  INDEX idx_status (status),
  INDEX idx_data   (publicado_em)
) ENGINE=InnoDB;

-- ── 9. COMENTÁRIOS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comentarios (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  livro_id      INT UNSIGNED NOT NULL,
  leitor_id     INT UNSIGNED NOT NULL,
  nota          TINYINT UNSIGNED NOT NULL,          -- 1 a 5 estrelas
  texto         TEXT NOT NULL,
  status        ENUM('pendente','aprovado','rejeitado') NOT NULL DEFAULT 'pendente',
  criado_em     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (livro_id)  REFERENCES livros(id)   ON DELETE CASCADE,
  FOREIGN KEY (leitor_id) REFERENCES leitores(id) ON DELETE CASCADE,
  INDEX idx_livro  (livro_id),
  INDEX idx_status (status)
) ENGINE=InnoDB;

-- ── 10. MENSAGENS DE CONTATO ────────────────────────────────────
CREATE TABLE IF NOT EXISTS mensagens (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL,
  assunto       VARCHAR(100),
  mensagem      TEXT NOT NULL,
  lida          TINYINT(1) NOT NULL DEFAULT 0,
  respondida    TINYINT(1) NOT NULL DEFAULT 0,
  criado_em     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_lida (lida)
) ENGINE=InnoDB;

-- ── 11. VISITAS (ANALYTICS) ────────────────────────────────────
-- Uma linha por visita única (1 por visitante por página por dia)
CREATE TABLE IF NOT EXISTS visitas (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  pagina        VARCHAR(255) NOT NULL,             -- ex: '/index.html'
  fingerprint   VARCHAR(64) NOT NULL,              -- SHA256(ip+ua+data)
  ip_hash       VARCHAR(64),                       -- SHA256 do IP (anonimizado)
  pais          VARCHAR(2),                        -- BR, US, etc.
  dispositivo   ENUM('desktop','mobile','tablet','bot') DEFAULT 'desktop',
  referrer      VARCHAR(500),
  criado_em     DATE NOT NULL,                     -- apenas a data (sem hora)
  UNIQUE KEY uq_fingerprint_pagina (fingerprint, pagina), -- evita duplicatas
  INDEX idx_pagina (pagina),
  INDEX idx_data   (criado_em)
) ENGINE=InnoDB;

-- ── 12. PEDIDOS / BIBLIOTECA DO LEITOR ─────────────────────────
CREATE TABLE IF NOT EXISTS pedidos (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  leitor_id     INT UNSIGNED NOT NULL,
  livro_id      INT UNSIGNED NOT NULL,
  formato       ENUM('ebook','fisico') NOT NULL DEFAULT 'ebook',
  origem        ENUM('amazon','direto','cortesia') NOT NULL DEFAULT 'amazon',
  valor         DECIMAL(8,2),
  status        ENUM('confirmado','enviado','entregue') NOT NULL DEFAULT 'confirmado',
  criado_em     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (leitor_id) REFERENCES leitores(id) ON DELETE CASCADE,
  FOREIGN KEY (livro_id)  REFERENCES livros(id)  ON DELETE CASCADE,
  INDEX idx_leitor (leitor_id)
) ENGINE=InnoDB;

-- ── 13. ENIGMAS (GAMIFICAÇÃO) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS enigmas (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  livro_id      INT UNSIGNED NOT NULL,
  pergunta      TEXT NOT NULL,
  resposta      VARCHAR(255) NOT NULL,             -- resposta correta (lowercase)
  dica          TEXT,
  recompensa    VARCHAR(255),                      -- ex: 'trecho exclusivo'
  ativo         TINYINT(1) NOT NULL DEFAULT 1,
  FOREIGN KEY (livro_id) REFERENCES livros(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS enigmas_respostas (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  enigma_id     INT UNSIGNED NOT NULL,
  leitor_id     INT UNSIGNED,
  email         VARCHAR(255),
  acertou       TINYINT(1) NOT NULL DEFAULT 0,
  tentativas    TINYINT UNSIGNED NOT NULL DEFAULT 1,
  criado_em     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (enigma_id) REFERENCES enigmas(id) ON DELETE CASCADE,
  FOREIGN KEY (leitor_id) REFERENCES leitores(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ── 14. ADMIN ──────────────────────────────────────────────────
-- Usuário administrativo separado dos leitores
CREATE TABLE IF NOT EXISTS admin_usuarios (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(255) NOT NULL UNIQUE,
  senha_hash    VARCHAR(255) NOT NULL,
  nome          VARCHAR(100) NOT NULL DEFAULT 'Robério',
  ultimo_login  DATETIME,
  criado_em     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ================================================================
-- DADOS INICIAIS
-- ================================================================

-- Admin padrão (senha: roberio@2025 — TROQUE antes de publicar!)
-- Hash gerado com: password_hash('roberio@2025', PASSWORD_BCRYPT, ['cost'=>12])
INSERT IGNORE INTO admin_usuarios (email, senha_hash, nome) VALUES (
  'diogenes.escritor@gmail.com',
  '$2y$12$XKJtZgG/qmZbZ9s5R1VLFO8eW0eOhMPlqL5TJkuVkxKQh5IjRxhUm',
  'Robério Diógenes'
);

-- Livros existentes
INSERT IGNORE INTO livros (slug, titulo, subtitulo, genero, sinopse, capa_url, amazon_url, ativo, ordem) VALUES
('jogo-das-mascaras',       'O Jogo das Máscaras',            'Toda verdade usa disfarce',           'Thriller Psicológico', 'Juliette acreditava que a dor era eterna, até conhecer o Cavaleiro...', 'img/jogo-das-mascaras.jpg', 'https://www.amazon.com.br/jogo-das-m%C3%A1scaras-verdade-disfarce-ebook/dp/B0FTTFPWXB', 1, 1),
('a-setima-lei',            'A Sétima Lei',                   'A guerra silenciosa no casamento',    'Auto-Ajuda Cristã',    'Existe uma lei que ninguém te ensina sobre relacionamentos...', 'img/a-setima-lei.jpg', 'https://www.amazon.com.br/dp/B0GXGZJV1Y', 1, 2),
('lumen',                   'Lúmen',                          'A outra metade do céu',               'Ficção · Romance',     'Hannah convive com sonhos que parecem avisos...', 'img/lumen.jpg', '', 1, 3),
('genesis',                 'Gênesis',                        'Um novo começo',                      'Ficção · Romance',     'Esta é uma história sobre o fim — mas também sobre começos.', 'img/genesis.jpg', '', 1, 4),
('rosas-e-espinhos',        'Rosas & Espinhos',               'O diário secreto de uma alma apaixonada','Drama · Romance',  'Em Campos do Jordão, Camille vive uma vida que parece perfeita...', 'img/rosas-e-espinhos.jpg', 'https://www.amazon.com.br/Rosas-espinhos-onde-voc%C3%AA-sente-ebook/dp/B0DMHSDJPX/', 1, 5),
('cartas-do-passado',       'Cartas do Passado',              'O verdadeiro amor nunca morre',       'Ficção · Romance',     'Lucas, soldado brasileiro, escreve cartas de amor entre bombardeios.', 'img/cartas-do-passado.jpg', '', 1, 6),
('mares-secretas',          'As Marés Secretas do Amor',      'O mar não devolve tudo que engole',   'Romance · Drama',      'Entre ondas e silêncios, dois corações descobrem...', 'img/mares-secretas.jpg', '', 1, 7),
('das-coisas-que-o-amor-faz','Das Coisas que o Amor Faz',    'Poesias que sangram e florescem',     'Poesia · Romance',     'Uma coleção de poemas que capturam os extremos do amor.', 'img/coisas-que-o-amor-faz.jpg', '', 1, 8),
('o-abismo-das-almas',      'O Abismo das Almas',             'O horror que mora dentro de nós',     'Distopia · Horror',    'Em um mundo onde as emoções são proibidas...', 'img/o-abismo-das-almas-vol-1.jpg', '', 1, 9),
('a-marca-da-besta',        'A Marca da Besta',               'Ninguém escapa da marca',             'Distopia · Horror',    'Quando o controle social se torna total...', 'img/a-marca-da-besta.jpg', '', 1, 10),
('caminhos-de-outono',      'Caminhos de Outono',             'O outono que muda tudo',              'Romance',              'Algumas estações chegam para transformar.', 'img/caminhos-de-outono.jpg', '', 1, 11);
