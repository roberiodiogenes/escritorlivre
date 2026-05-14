# Robério Diógenes — Back-end
## Guia completo de instalação e publicação

---

## PASSO 1 — Instalar o XAMPP (teste local)

1. Acesse **https://www.apachefriends.org** e baixe o XAMPP para Windows
2. Instale normalmente (caminho padrão: `C:\xampp`)
3. Abra o **XAMPP Control Panel**
4. Clique em **Start** nos módulos **Apache** e **MySQL**
5. Teste abrindo **http://localhost** no navegador — deve aparecer a página do XAMPP

---

## PASSO 2 — Posicionar os arquivos

```
C:\xampp\htdocs\
  ├── backend\          ← cole esta pasta aqui
  │   ├── api\
  │   ├── config\
  │   ├── middleware\
  │   ├── services\
  │   ├── uploads\      ← criada automaticamente pelo sistema
  │   ├── .htaccess
  │   └── api-client.js
  └── site-novo\        ← seu site front-end aqui (opcional para teste)
```

**Acesso:** `http://localhost/backend/api/...`

---

## PASSO 3 — Criar o banco de dados

1. Abra **http://localhost/phpmyadmin** no navegador
2. Clique em **SQL** no menu superior
3. Cole o conteúdo do arquivo `database.sql` e clique em **Executar**
4. O banco `roberio_site` e todas as tabelas serão criadas automaticamente

---

## PASSO 4 — Configurar o sistema

Abra o arquivo `config/config.php` e ajuste:

```php
// Banco de dados (XAMPP local — deixe assim para desenvolvimento)
define('DB_HOST',    'localhost');
define('DB_NOME',    'roberio_site');
define('DB_USUARIO', 'root');
define('DB_SENHA',   '');           // XAMPP não tem senha por padrão

// E-mail (para testes, use uma conta Gmail com senha de app)
// Gere em: myaccount.google.com > Segurança > Senhas de app
define('EMAIL_USUARIO', 'seu-email@gmail.com');
define('EMAIL_SENHA',   'xxxx xxxx xxxx xxxx'); // senha de aplicativo do Gmail

// URL do site (desenvolvimento)
define('SITE_URL', 'http://localhost/site-novo');
```

**Gerar a chave JWT:**
Abra o terminal e execute:
```
php -r "echo bin2hex(random_bytes(32));"
```
Cole o resultado em `JWT_SECRET`.

---

## PASSO 5 — Conectar o front-end

No HTML de cada página, adicione **antes** do `</body>`:

```html
<!-- Adicione após global.js -->
<script src="js/api-client.js"></script>
```

Para páginas dentro de subpastas (`blog/`, `livros/`):
```html
<script src="../js/api-client.js"></script>
```

Nos formulários de newsletter, adicione o atributo `data-form="newsletter"`:
```html
<form data-form="newsletter" data-origem="index">
  <input type="email" placeholder="seu@email.com" required />
  <button type="submit">Inscrever-me</button>
</form>
```

---

## PASSO 6 — Testar a API

Abra o navegador ou use o Postman para testar:

| Teste | URL |
|-------|-----|
| API funcionando | `http://localhost/backend/api/livros` |
| Newsletter | `http://localhost/backend/api/newsletter/inscrever` (POST) |
| Contato | `http://localhost/backend/api/contato` (POST) |
| Analytics | `http://localhost/backend/api/analytics/pageview` (POST) |
| Login admin | `http://localhost/backend/api/admin/login` (POST) |

**Credenciais admin padrão:**
- E-mail: `diogenes.escritor@gmail.com`
- Senha: `roberio@2025`
- ⚠️ **Troque a senha antes de publicar!**

---

## PASSO 7 — Publicar no HostGator

### 7.1 — Criar o banco de dados no cPanel

1. Acesse o **cPanel** do HostGator
2. Vá em **Bancos de dados MySQL**
3. Crie um banco: `cpanelusuario_roberio` (o HostGator adiciona seu usuário como prefixo)
4. Crie um usuário e adicione-o ao banco com **Todos os privilégios**
5. Acesse o **phpMyAdmin** e importe o `database.sql`

### 7.2 — Ajustar o config.php para produção

```php
define('AMBIENTE',   'producao');
define('DB_HOST',    'localhost');
define('DB_NOME',    'cpanelusuario_roberio'); // ← nome real do banco no HostGator
define('DB_USUARIO', 'cpanelusuario_usuario'); // ← usuário criado no cPanel
define('DB_SENHA',   'SUA_SENHA_FORTE_AQUI');
define('SITE_URL',   'https://www.roberiodiogenes.com.br');

// E-mail: use o servidor do próprio HostGator
define('EMAIL_HOST',    'mail.roberiodiogenes.com.br');
define('EMAIL_USUARIO', 'contato@roberiodiogenes.com.br');
define('EMAIL_SENHA',   'SENHA_DA_CONTA_DE_EMAIL');
```

### 7.3 — Enviar os arquivos via FTP

Use o **FileZilla** (gratuito) para enviar:

```
Servidor FTP: ftp.roberiodiogenes.com.br
Usuário: seu usuário cPanel
Senha: sua senha cPanel
Porta: 21

Destino no servidor:
public_html/
  ├── (arquivos do site front-end)
  └── backend/
      ├── api/
      ├── config/
      ├── middleware/
      ├── services/
      └── .htaccess
```

### 7.4 — Copiar o api-client.js para o site

```
public_html/js/api-client.js   ← copie o arquivo aqui
```

---

## ESTRUTURA COMPLETA DOS ARQUIVOS

```
backend/
├── .htaccess                  ← roteamento Apache
├── api-client.js              ← script do front-end
├── database.sql               ← esquema completo do banco
├── LEIA-ME.md                 ← este arquivo
│
├── config/
│   ├── config.php             ← ⚙️ CONFIGURE ESTE ARQUIVO
│   └── banco.php              ← conexão PDO com MySQL
│
├── middleware/
│   ├── auth.php               ← JWT (gerar + validar)
│   ├── cors.php               ← headers CORS
│   ├── rate_limit.php         ← proteção anti-spam
│   └── resposta.php           ← helpers de resposta JSON
│
├── services/
│   └── email.php              ← envio de e-mails + templates
│
├── api/
│   ├── index.php              ← roteador principal
│   ├── newsletter.php         ← inscrição + double opt-in + capítulo grátis
│   ├── auth.php               ← login + cadastro + recuperação de senha
│   ├── leitor.php             ← perfil + pedidos + biblioteca
│   ├── contato.php            ← formulário de contato
│   ├── analytics.php          ← visitas únicas + dashboard de métricas
│   ├── livros.php             ← catálogo de livros
│   ├── posts.php              ← blog (CRUD)
│   ├── comentarios.php        ← avaliações dos leitores
│   ├── capitulo.php           ← download rastreado de capítulos
│   ├── admin.php              ← painel administrativo completo
│   ├── upload.php             ← upload de imagens e PDFs
│   └── busca.php              ← busca em livros e posts
│
└── uploads/                   ← criada automaticamente
    ├── imagens/               ← capas e fotos
    └── capitulos/             ← PDFs dos capítulos (acesso restrito)
```

---

## SEGURANÇA IMPLEMENTADA

| Recurso | Implementação |
|---------|--------------|
| Senhas | bcrypt com custo 12 |
| Sessões | JWT com expiração de 7 dias |
| Anti-spam | Rate limiting por IP no banco |
| SQL Injection | PDO com prepared statements |
| XSS | strip_tags + htmlspecialchars |
| CORS | Origens restritas por ambiente |
| Uploads | Validação de tipo + tamanho + extensão |
| PDFs | URLs assinadas com HMAC (expiram em 48h) |
| Newsletter | Double opt-in (exigência LGPD) |
| Admin | Token separado dos leitores |

---

## PRÓXIMOS PASSOS (opcional)

- **Brevo** — integrar para disparos de newsletter em massa (`services/brevo.php`)
- **Google OAuth** — login social (`api/auth.php` → método `google()`)
- **WhatsApp Business API** — lista de transmissão automática
- **Cloudinary** — upload de imagens com otimização automática

---

*Robério Diógenes · Sistema desenvolvido em PHP 8 + MySQL · Compatível com HostGator*
