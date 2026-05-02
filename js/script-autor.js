    // --- Cursor ---
    const cursor = document.getElementById('cursor');
    const cursorAnel = document.getElementById('cursorAnel');
    let mx = 0, my = 0, ax = 0, ay = 0;
    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      cursor.style.left = mx + 'px'; cursor.style.top = my + 'px';
    });
    (function animarAnel() {
      ax += (mx - ax) * .12; ay += (my - ay) * .12;
      cursorAnel.style.left = ax + 'px'; cursorAnel.style.top = ay + 'px';
      requestAnimationFrame(animarAnel);
    })();
    if ('ontouchstart' in window) { cursor.style.display = 'none'; cursorAnel.style.display = 'none'; }

    // --- Navegação ---
    const nav = document.getElementById('nav');
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');
    const topoBtn  = document.getElementById('topoBtn');

    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 40);
      topoBtn.classList.toggle('visivel', window.scrollY > 400);
    });
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('ativo');
      navLinks.classList.toggle('aberto');
    });
    navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      navToggle.classList.remove('ativo'); navLinks.classList.remove('aberto');
    }));

    // --- Hero: efeito paralaxe na foto ---
    const heroBg = document.getElementById('heroBg');
    setTimeout(() => heroBg.classList.add('carregada'), 100);
    window.addEventListener('scroll', () => {
      heroBg.style.transform = `scale(1) translateY(${window.scrollY * .2}px)`;
    }, { passive: true });

    // --- Scroll Reveal ---
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visivel'); observer.unobserve(e.target); } });
    }, { threshold: .1 });
    document.querySelectorAll('.reveal, .reveal-esq, .reveal-dir').forEach(el => observer.observe(el));

    // --- Contadores animados ---
    const contadores = document.querySelectorAll('[data-contador]');
    const contObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const alvo = parseInt(el.dataset.contador);
        const sufixo = el.dataset.sufixo || '';
        let atual = 0;
        const duracao = 1600;
        const inicio = performance.now();
        (function animar(agora) {
          const progresso = Math.min((agora - inicio) / duracao, 1);
          const easing = 1 - Math.pow(1 - progresso, 3);
          atual = Math.round(easing * alvo);
          el.textContent = atual + sufixo;
          if (progresso < 1) requestAnimationFrame(animar);
        })(performance.now());
        contObs.unobserve(el);
      });
    }, { threshold: .5 });
    contadores.forEach(c => contObs.observe(c));

    // --- Carrossel de trechos ---
    const trilho = document.getElementById('trechosTrilho');
    const cards  = trilho.querySelectorAll('.trecho-card');
    const dotsWrap = document.getElementById('trechosDots');
    let ativoIdx = 0;

    // Cria pontos
    cards.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'trecho-dot' + (i === 0 ? ' ativo' : '');
      dot.setAttribute('aria-label', `Trecho ${i+1}`);
      dot.addEventListener('click', () => irPara(i));
      dotsWrap.appendChild(dot);
    });

    function atualizarDots(idx) {
      dotsWrap.querySelectorAll('.trecho-dot').forEach((d, i) => d.classList.toggle('ativo', i === idx));
    }

    function irPara(idx) {
      ativoIdx = (idx + cards.length) % cards.length;
      const card = cards[ativoIdx];
      trilho.scrollTo({ left: card.offsetLeft - 20, behavior: 'smooth' });
      atualizarDots(ativoIdx);
    }

    document.getElementById('trechoPrev').addEventListener('click', () => irPara(ativoIdx - 1));
    document.getElementById('trechoNext').addEventListener('click', () => irPara(ativoIdx + 1));

    // Auto-play suave
    let autoplay = setInterval(() => irPara(ativoIdx + 1), 5000);
    trilho.addEventListener('mouseenter', () => clearInterval(autoplay));
    trilho.addEventListener('mouseleave', () => { autoplay = setInterval(() => irPara(ativoIdx + 1), 5000); });

    // --- Formulário de contato ---
    function enviarMensagem(e) {
      e.preventDefault();
      const btn = e.target.querySelector('button[type="submit"]');
      btn.textContent = '✓ Mensagem enviada!';
      btn.style.background = '#4a7c59';
      btn.disabled = true;
      setTimeout(() => { btn.textContent = 'Enviar Mensagem'; btn.style.background = ''; btn.disabled = false; e.target.reset(); }, 3500);
    }

    // --- Newsletter ---
    function inscricao(e) {
      e.preventDefault();
      const btn = e.target.querySelector('button');
      btn.textContent = '✓ Inscrito!';
      btn.style.background = '#4a7c59';
      e.target.querySelector('input').value = '';
      setTimeout(() => { btn.textContent = 'Inscrever-se'; btn.style.background = ''; }, 3000);
    }