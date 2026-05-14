/* ================================================================
   ROBÉRIO DIÓGENES — api-client.js
   Conecta o front-end ao back-end PHP
   Coloque este arquivo em: js/api-client.js
   Inclua ANTES dos outros scripts: <script src="js/api-client.js"></script>
   ================================================================ */

const API = (() => {
  'use strict';

  /* ── CONFIGURAÇÃO ────────────────────────────────────────────── */
  // Em desenvolvimento (XAMPP): 'http://localhost/backend'
  // Em produção (HostGator): '' (mesma origem, caminho relativo)
  const BASE = window.location.hostname === 'localhost'
    ? 'http://localhost/backend'
    : '';

  /* ── REQUISIÇÃO BASE ─────────────────────────────────────────── */
  async function req(metodo, rota, dados = null, comAuth = false) {
    const headers = { 'Content-Type': 'application/json' };

    // Adiciona token JWT se existir
    if (comAuth) {
      const token = localStorage.getItem('rd_token');
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }

    const opcoes = { method: metodo, headers };
    if (dados && metodo !== 'GET') {
      opcoes.body = JSON.stringify(dados);
    }

    try {
      const resp = await fetch(`${BASE}/api/${rota}`, opcoes);
      const json = await resp.json();

      if (!resp.ok) {
        throw new Error(json.mensagem || `Erro ${resp.status}`);
      }
      return json.dados ?? json;
    } catch (err) {
      if (err instanceof TypeError) {
        throw new Error('Sem conexão com o servidor. Verifique se o XAMPP está rodando.');
      }
      throw err;
    }
  }

  /* ── NEWSLETTER ──────────────────────────────────────────────── */
  const newsletter = {
    inscrever: (email, nome, origem = 'site') =>
      req('POST', 'newsletter/inscrever', { email, nome, origem }),
  };

  /* ── AUTENTICAÇÃO ────────────────────────────────────────────── */
  const auth = {
    registrar: (dados) =>
      req('POST', 'auth/registrar', dados),

    login: async (email, senha) => {
      const res = await req('POST', 'auth/login', { email, senha });
      if (res.token) {
        localStorage.setItem('rd_token', res.token);
        localStorage.setItem('rd_leitor', JSON.stringify(res.leitor));
      }
      return res;
    },

    esqueciSenha: (email) =>
      req('POST', 'auth/esqueci-senha', { email }),

    novaSenha: (token, senha) =>
      req('POST', 'auth/nova-senha', { token, senha }),

    logout: () => {
      localStorage.removeItem('rd_token');
      localStorage.removeItem('rd_leitor');
    },

    leitorAtual: () => {
      const dados = localStorage.getItem('rd_leitor');
      return dados ? JSON.parse(dados) : null;
    },

    estaLogado: () => !!localStorage.getItem('rd_token'),
  };

  /* ── LEITOR ──────────────────────────────────────────────────── */
  const leitor = {
    perfil:          () => req('GET',  'leitor/perfil',     null, true),
    atualizarPerfil: (d) => req('PUT',  'leitor/perfil',    d,    true),
    alterarSenha:    (d) => req('PUT',  'leitor/senha',     d,    true),
    pedidos:         () => req('GET',  'leitor/pedidos',    null, true),
    biblioteca:      () => req('GET',  'leitor/biblioteca', null, true),
  };

  /* ── CONTATO ─────────────────────────────────────────────────── */
  const contato = {
    enviar: (dados) => req('POST', 'contato', dados),
  };

  /* ── ANALYTICS ───────────────────────────────────────────────── */
  const analytics = {
    // Registra visita única silenciosamente
    registrar: () => {
      const pagina   = window.location.pathname;
      const referrer = document.referrer;
      // Não bloqueia o carregamento da página
      req('POST', 'analytics/pageview', { pagina, referrer }).catch(() => {});
    },
  };

  /* ── LIVROS ──────────────────────────────────────────────────── */
  const livros = {
    listar:  (genero = '') => req('GET', `livros${genero ? '?genero=' + encodeURIComponent(genero) : ''}`),
    buscar:  (slug)        => req('GET', `livros/${slug}`),
  };

  /* ── POSTS ───────────────────────────────────────────────────── */
  const posts = {
    listar: (cat = '', pagina = 1) =>
      req('GET', `posts?categoria=${encodeURIComponent(cat)}&pagina=${pagina}`),
    buscar: (slug) => req('GET', `posts/${slug}`),
  };

  /* ── COMENTÁRIOS ─────────────────────────────────────────────── */
  const comentarios = {
    listar: (livroSlug) => req('GET', `comentarios/${livroSlug}`),
    criar:  (dados)     => req('POST', 'comentarios', dados, true),
  };

  /* ── CAPÍTULOS ───────────────────────────────────────────────── */
  const capitulo = {
    desbloquear: (capituloId, email, nome) =>
      req('POST', 'capitulo/desbloquear', { capitulo_id: capituloId, email, nome }),
    listar: (livroSlug = '') =>
      req('GET', `capitulo/listar${livroSlug ? '?livro=' + livroSlug : ''}`),
  };

  /* ── BUSCA ───────────────────────────────────────────────────── */
  const busca = {
    pesquisar: (termo) => req('GET', `busca?q=${encodeURIComponent(termo)}`),
  };

  /* ── EXPÕE PUBLICAMENTE ──────────────────────────────────────── */
  return { newsletter, auth, leitor, contato, analytics, livros, posts, comentarios, capitulo, busca };
})();

/* ================================================================
   AUTO-INICIALIZAÇÃO: registra visita assim que a página carrega
   ================================================================ */
document.addEventListener('DOMContentLoaded', () => {
  // Registra visita única (silencioso, não bloqueia nada)
  API.analytics.registrar();

  // Conecta os formulários existentes no HTML ──────────────────────

  // ── NEWSLETTER (qualquer formulário com data-form="newsletter") ─
  document.querySelectorAll('[data-form="newsletter"]').forEach(form => {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const btn    = form.querySelector('button[type="submit"]');
      const email  = form.querySelector('input[type="email"]')?.value;
      const nome   = form.querySelector('input[name="nome"]')?.value || 'Leitor';
      const origem = form.dataset.origem || 'site';

      if (!email) return;

      btn && (btn.disabled = true);
      try {
        await API.newsletter.inscrever(email, nome, origem);
        window.mostrarToast?.('Verifique seu e-mail para confirmar a inscrição! 📖', 'sucesso', 5000);
        window.Sons?.tocar('sucesso');
        form.reset();
      } catch (err) {
        window.mostrarToast?.(err.message, 'erro');
      } finally {
        btn && (btn.disabled = false);
      }
    });
  });

  // ── CONTATO ─────────────────────────────────────────────────────
  const formContato = document.getElementById('formContato');
  if (formContato) {
    formContato.addEventListener('submit', async e => {
      e.preventDefault();
      const btn = formContato.querySelector('button[type="submit"]');
      btn && (btn.disabled = true);

      try {
        const dados = {
          nome:     formContato.querySelector('#c-nome')?.value,
          email:    formContato.querySelector('#c-email')?.value,
          assunto:  formContato.querySelector('#c-assunto')?.value || 'Mensagem do site',
          mensagem: formContato.querySelector('#c-msg')?.value,
        };
        const res = await API.contato.enviar(dados);
        window.mostrarToast?.(res.mensagem || 'Mensagem enviada!', 'sucesso', 5000);
        window.Sons?.tocar('sucesso');
        formContato.reset();
      } catch (err) {
        window.mostrarToast?.(err.message, 'erro');
      } finally {
        btn && (btn.disabled = false);
      }
    });
  }

  // ── ÁREA DO LEITOR: login ────────────────────────────────────────
  const formLogin = document.getElementById('formLogin');
  if (formLogin) {
    formLogin.addEventListener('submit', async e => {
      e.preventDefault();
      const btn   = formLogin.querySelector('button[type="submit"]');
      const email = document.getElementById('l-email')?.value;
      const senha = document.getElementById('l-senha')?.value;
      btn && (btn.disabled = true);

      try {
        const res = await API.auth.login(email, senha);
        window.mostrarToast?.(`Bem-vindo, ${res.leitor.nome}! 📖`, 'sucesso');
        window.Sons?.tocar('sucesso');
        // Força reload para o dashboard aparecer
        setTimeout(() => window.location.reload(), 800);
      } catch (err) {
        window.mostrarToast?.(err.message, 'erro');
        window.Sons?.tocar('erro');
      } finally {
        btn && (btn.disabled = false);
      }
    });
  }

  // ── ÁREA DO LEITOR: cadastro ─────────────────────────────────────
  const formCadastro = document.getElementById('formCadastro');
  if (formCadastro) {
    formCadastro.addEventListener('submit', async e => {
      e.preventDefault();
      const btn = formCadastro.querySelector('button[type="submit"]');
      btn && (btn.disabled = true);

      try {
        const dados = {
          nome:       document.getElementById('cad-nome')?.value,
          email:      document.getElementById('cad-email')?.value,
          senha:      document.getElementById('cad-senha')?.value,
          newsletter: document.getElementById('cad-nl')?.checked ? 1 : 0,
        };
        const res = await API.auth.registrar(dados);
        localStorage.setItem('rd_token', res.token);
        localStorage.setItem('rd_leitor', JSON.stringify(res.leitor));
        window.mostrarToast?.(`Conta criada! Bem-vindo, ${res.leitor.nome}! 🎉`, 'sucesso', 5000);
        window.Sons?.tocar('sucesso');
        setTimeout(() => window.location.reload(), 800);
      } catch (err) {
        window.mostrarToast?.(err.message, 'erro');
        window.Sons?.tocar('erro');
      } finally {
        btn && (btn.disabled = false);
      }
    });
  }

  // ── BUSCA: conecta ao backend ────────────────────────────────────
  // Substitui a busca estática do global.js pela busca real
  const buscaInput = document.querySelector('.busca-nav input');
  if (buscaInput && window.API) {
    let debounceTimer;
    buscaInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        const q = buscaInput.value.trim();
        if (q.length < 2) return;

        try {
          const res = await API.busca.pesquisar(q);
          // Passa os resultados para o módulo de busca do global.js
          if (window._buscaCallback) {
            window._buscaCallback(res);
          }
        } catch (e) { /* silencioso — usa busca local como fallback */ }
      }, 300);
    });
  }
});
