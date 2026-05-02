    // --- Cursor personalizado ---
    const cursor = document.getElementById('cursor');
    const cursorAnel = document.getElementById('cursorAnel');
    let mx = 0, my = 0, ax = 0, ay = 0;

    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      cursor.style.left = mx + 'px';
      cursor.style.top  = my + 'px';
    });

    function animarAnel() {
      ax += (mx - ax) * 0.12;
      ay += (my - ay) * 0.12;
      cursorAnel.style.left = ax + 'px';
      cursorAnel.style.top  = ay + 'px';
      requestAnimationFrame(animarAnel);
    }
    animarAnel();

    // Esconde cursor em mobile
    if ('ontouchstart' in window) {
      cursor.style.display = 'none';
      cursorAnel.style.display = 'none';
    }

    // --- Navegação: scroll e mobile ---
    const nav = document.getElementById('nav');
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');

    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 40);
      document.getElementById('topoBtn').classList.toggle('visivel', window.scrollY > 400);
    });

    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('ativo');
      navLinks.classList.toggle('aberto');
    });

    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        navToggle.classList.remove('ativo');
        navLinks.classList.remove('aberto');
      });
    });

    // --- Partículas no hero ---
    const particulas = document.getElementById('particulas');
    for (let i = 0; i < 30; i++) {
      const p = document.createElement('div');
      p.className = 'particula';
      p.style.cssText = `
        left: ${Math.random() * 100}%;
        top:  ${Math.random() * 100}%;
        --dur:   ${6 + Math.random() * 10}s;
        --delay: ${Math.random() * 8}s;
        width: ${1 + Math.random() * 2}px;
        height: ${1 + Math.random() * 2}px;
      `;
      particulas.appendChild(p);
    }

    // --- Scroll reveal ---
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visivel');
          observer.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    // --- Newsletter ---
    function inscricao(e) {
      e.preventDefault();
      const input = e.target.querySelector('input');
      const btn = e.target.querySelector('button');
      btn.textContent = '✓ Inscrito!';
      btn.style.background = '#4a7c59';
      input.value = '';
      setTimeout(() => {
        btn.textContent = 'Inscrever-se';
        btn.style.background = '';
      }, 3000);
    }