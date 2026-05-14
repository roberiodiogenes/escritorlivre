/* ============================================================
   main.js — Scripts globais
   Carregado em todas as páginas via <script src="../js/main.js">
   ============================================================ */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     1. HEADER: adiciona classe .scrolled ao rolar a página
     ---------------------------------------------------------- */
  const header = document.querySelector('.site-header');

  if (header) {
    const onScroll = () => {
      header.classList.toggle('scrolled', window.scrollY > 40);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // estado inicial
  }

  /* ----------------------------------------------------------
     2. NAV MOBILE: toggle do menu hamburguer
     ---------------------------------------------------------- */
  const navToggle = document.querySelector('.nav-toggle');
  const mainNav   = document.querySelector('.main-nav');

  if (navToggle && mainNav) {
    navToggle.addEventListener('click', () => {
      const open = mainNav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open);
      // Ícone: ✕ quando aberto, ☰ quando fechado
      navToggle.innerHTML = open ? '&#10005;' : '&#9776;';
    });

    // Fecha o menu ao clicar em um link
    mainNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mainNav.classList.remove('open');
        navToggle.innerHTML = '&#9776;';
        navToggle.setAttribute('aria-expanded', false);
      });
    });

    // Fecha ao clicar fora
    document.addEventListener('click', e => {
      if (!header.contains(e.target)) {
        mainNav.classList.remove('open');
        navToggle.innerHTML = '&#9776;';
        navToggle.setAttribute('aria-expanded', false);
      }
    });
  }

  /* ----------------------------------------------------------
     3. ANIMAÇÕES DE ENTRADA: IntersectionObserver para .fade-up
     ---------------------------------------------------------- */
  const fadeEls = document.querySelectorAll('.fade-up');

  if (fadeEls.length > 0 && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target); // anima apenas uma vez
          }
        });
      },
      { threshold: 0.12 }
    );
    fadeEls.forEach(el => observer.observe(el));
  } else {
    // Fallback: exibe tudo imediatamente se Observer não suportado
    fadeEls.forEach(el => el.classList.add('visible'));
  }

  /* ----------------------------------------------------------
     4. BOTÕES DE COMPARTILHAMENTO
     ---------------------------------------------------------- */
  const shareX  = document.querySelector('.share-btn--x');
  const shareWa = document.querySelector('.share-btn--wa');

  if (shareX || shareWa) {
    const url   = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title);

    if (shareX) {
      shareX.href = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
      shareX.target = '_blank';
      shareX.rel = 'noopener';
    }

    if (shareWa) {
      shareWa.href = `https://wa.me/?text=${title}%20${url}`;
      shareWa.target = '_blank';
      shareWa.rel = 'noopener';
    }
  }

  /* ----------------------------------------------------------
     5. BARRA DE PROGRESSO DE LEITURA (apenas em posts)
     ---------------------------------------------------------- */
  const postContent = document.querySelector('.post-content');

  if (postContent) {
    // Cria a barra
    const bar = document.createElement('div');
    bar.id = 'reading-progress';
    Object.assign(bar.style, {
      position:   'fixed',
      top:        '0',
      left:       '0',
      width:      '0%',
      height:     '3px',
      background: 'var(--color-accent)',
      zIndex:     '2000',
      transition: 'width 0.1s linear',
    });
    document.body.prepend(bar);

    window.addEventListener('scroll', () => {
      const docH    = document.documentElement.scrollHeight - window.innerHeight;
      const pct     = docH > 0 ? (window.scrollY / docH) * 100 : 0;
      bar.style.width = Math.min(pct, 100) + '%';
    }, { passive: true });
  }

  /* ----------------------------------------------------------
     6. TEMPO DE LEITURA DINÂMICO
        Recalcula se o atributo [data-readtime] estiver presente
     ---------------------------------------------------------- */
  const readTimeEl = document.querySelector('[data-readtime]');
  const articleEl  = document.querySelector('.post-content');

  if (readTimeEl && articleEl) {
    const words = articleEl.innerText.trim().split(/\s+/).length;
    const mins  = Math.max(1, Math.round(words / 200)); // ~200 ppm
    readTimeEl.textContent = `${mins} min de leitura`;
  }

  /* ----------------------------------------------------------
     7. FORMULÁRIO DE NEWSLETTER (sidebar)
        Validação básica + feedback visual
     ---------------------------------------------------------- */
  document.querySelectorAll('.sidebar-form').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      const btn   = form.querySelector('button');

      if (!input || !input.value || !/\S+@\S+\.\S+/.test(input.value)) {
        input.style.borderColor = '#c0392b';
        input.focus();
        return;
      }

      // Feedback de sucesso (substitua por integração real de e-mail)
      btn.textContent  = 'Inscrito ✓';
      btn.disabled     = true;
      input.disabled   = true;
      input.style.borderColor = 'var(--color-accent)';
    });
  });

  /* ----------------------------------------------------------
     8. ACTIVE LINK NA NAV
        Marca o link cujo href bate com a URL atual
     ---------------------------------------------------------- */
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';

  document.querySelectorAll('.main-nav a').forEach(link => {
    const linkPath = link.getAttribute('href').split('/').pop();
    if (linkPath === currentPath) link.classList.add('active');
  });

})();
