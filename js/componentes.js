/* ================================================================
   ROBÉRIO DIÓGENES — Componentes HTML Compartilhados
   Nav · Footer · Canvas de partículas
   ================================================================ */

/* Uso: componentes.nav(paginaAtual) */
window.Componentes = {

  /* ── NAVEGAÇÃO ────────────────────────────────────────────── */
  injetarNav(paginaAtual, prefixo = '') {
    const links = [
      { href: 'index.html',   label: 'Início' },
      { href: 'livros.html',  label: 'Biblioteca' },
      { href: 'autor.html',   label: 'O Autor' },
      { href: 'blog.html',    label: 'Diário' },
      { href: 'contato.html', label: 'Contato' },
    ];

    const html = `
      <canvas id="canvas-particulas" aria-hidden="true"></canvas>
      <a href="#conteudo-principal" class="pular-nav">Pular para o conteúdo</a>

      <nav id="nav" role="navigation" aria-label="Navegação principal">
        <a href="${prefixo}index.html" class="nav-logo" aria-label="Robério Diógenes - Página inicial">
          Robério Diógenes
          <span>Escritor Independente</span>
        </a>

        <ul class="nav-links" id="navLinks" role="list">
          ${links.map(l => `
            <li role="listitem">
              <a href="${prefixo}${l.href}" ${paginaAtual === l.href ? 'class="ativa" aria-current="page"' : ''}>${l.label}</a>
            </li>
          `).join('')}
        </ul>

        <div class="nav-acoes">
          <!-- Busca interna -->
          <div class="busca-nav" role="search">
            <span class="busca-nav-icone" aria-hidden="true">🔍</span>
            <input type="search" placeholder="Buscar..." aria-label="Buscar no site" />
          </div>

          <!-- Controles de tema -->
          <div class="tema-controles" role="group" aria-label="Selecionar tema">
            <button class="tema-btn" data-tema="claro"    title="Tema claro"          aria-label="Tema claro">☀</button>
            <button class="tema-btn" data-tema="noturno"  title="Tema noturno"        aria-label="Tema noturno">🌙</button>
            <button class="tema-btn" data-tema="contraste" title="Alto contraste"     aria-label="Alto contraste">◑</button>
          </div>

          <!-- Controles de fonte -->
          <div class="fonte-controles" role="group" aria-label="Tamanho do texto">
            <button class="fonte-btn fonte-diminuir" title="Diminuir texto" aria-label="Diminuir tamanho do texto">A-</button>
            <button class="fonte-btn fonte-aumentar" title="Aumentar texto" aria-label="Aumentar tamanho do texto">A+</button>
          </div>

          <!-- Som -->
          <button class="tema-btn som-btn" title="Silenciar sons" aria-label="Alternar sons">♪</button>

          <!-- Área do leitor -->
          <a href="${prefixo}leitor/index.html" class="btn btn-secundario" style="padding:0.4rem 0.9rem;font-size:0.8rem;" aria-label="Área do leitor">
            <span aria-hidden="true">👤</span> Entrar
          </a>
        </div>

        <button class="nav-toggle" id="navToggle" aria-label="Abrir menu" aria-expanded="false" aria-controls="navLinks">
          <span></span><span></span><span></span>
        </button>
      </nav>

      <a href="#" class="topo-btn" id="topoBtn" aria-label="Voltar ao topo">↑</a>
    `;

    document.body.insertAdjacentHTML('afterbegin', html);
  },

  /* ── RODAPÉ ───────────────────────────────────────────────── */
  injetarFooter(prefixo = '') {
    const html = `
      <footer role="contentinfo">
        <div class="footer-wrap">
          <div>
            <a href="${prefixo}index.html" class="footer-logo">Robério Diógenes</a>
            <p class="footer-desc">"Escrevo sobre o que nos assombra no silêncio, sobre os abismos que escondemos atrás das telas e das convenções sociais."</p>
            <div class="footer-social" aria-label="Redes sociais">
              <a href="https://www.instagram.com/diogenesroberio" target="_blank" rel="noopener noreferrer" aria-label="Instagram de Robério Diógenes" title="Instagram">
                <i class="fa-brands fa-instagram" aria-hidden="true"></i>
              </a>
              <a href="https://www.linkedin.com/in/rob%C3%A9rio-di%C3%B3genes-47977b210/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" title="LinkedIn">
                <i class="fa-brands fa-linkedin-in" aria-hidden="true"></i>
              </a>
              <a href="https://www.amazon.com.br/stores/author/B0DJCQMG7C/about" target="_blank" rel="noopener noreferrer" aria-label="Página do autor na Amazon" title="Amazon">
                <i class="fa-brands fa-amazon" aria-hidden="true"></i>
              </a>
              <a href="https://wa.me/5585999999999" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" title="WhatsApp">
                <i class="fa-brands fa-whatsapp" aria-hidden="true"></i>
              </a>
            </div>
          </div>

          <div>
            <p class="footer-col-titulo">Navegação</p>
            <ul class="footer-links">
              <li><a href="${prefixo}index.html">Início</a></li>
              <li><a href="${prefixo}livros.html">Biblioteca</a></li>
              <li><a href="${prefixo}autor.html">O Autor</a></li>
              <li><a href="${prefixo}blog.html">Diário</a></li>
              <li><a href="${prefixo}contato.html">Contato</a></li>
            </ul>
          </div>

          <div>
            <p class="footer-col-titulo">Livros em Destaque</p>
            <ul class="footer-links">
              <li><a href="https://www.amazon.com.br/jogo-das-m%C3%A1scaras-verdade-disfarce-ebook/dp/B0FTTFPWXB" target="_blank" rel="noopener">O Jogo das Máscaras</a></li>
              <li><a href="https://www.amazon.com.br/dp/B0GXGZJV1Y" target="_blank" rel="noopener">A Sétima Lei</a></li>
              <li><a href="${prefixo}livros.html">Ver todos →</a></li>
            </ul>
          </div>

          <div>
            <p class="footer-col-titulo">Contato</p>
            <ul class="footer-links">
              <li><a href="mailto:diogenes.escritor@gmail.com">diogenes.escritor@gmail.com</a></li>
              <li><a href="${prefixo}contato.html">Formulário de contato</a></li>
              <li><a href="${prefixo}leitor/index.html">Área do leitor</a></li>
            </ul>
            <br />
            <p class="footer-col-titulo" style="margin-top:0.5rem;">Newsletter</p>
            <form onsubmit="submeterNewsletter(event)" style="display:flex;flex-direction:column;gap:0.5rem;margin-top:0.75rem;">
              <input type="email" class="finput" placeholder="seu@email.com" required aria-label="E-mail para newsletter" style="font-size:0.85rem;padding:0.5rem 0.75rem;" />
              <button type="submit" class="btn btn-primario" style="padding:0.5rem 1rem;font-size:0.8rem;">Inscrever-se</button>
            </form>
          </div>
        </div>

        <div class="footer-bottom">
          <p class="footer-copy">© ${new Date().getFullYear()} Robério Diógenes. Todos os direitos reservados.</p>
          <p class="footer-copy">Feito com tinta e silêncio · Cascavel, Ceará</p>
        </div>
      </footer>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  }
};

/* ── UTILITÁRIO: NEWSLETTER ───────────────────────────────────── */
window.submeterNewsletter = function(e) {
  e.preventDefault();
  const input = e.target.querySelector('input[type="email"]');
  const email = input ? input.value : '';
  // TODO: integrar com serviço de e-mail (Mailchimp, etc.)
  mostrarToast('Inscrição realizada! Em breve você receberá novidades. 📖', 'sucesso');
  if (input) { input.value = ''; }
};
