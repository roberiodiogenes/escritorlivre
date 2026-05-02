    // Cursor
    const cursor = document.getElementById('cursor');
    const cursorAnel = document.getElementById('cursorAnel');
    let mx=0, my=0, ax=0, ay=0;
    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      cursor.style.left = mx+'px'; cursor.style.top = my+'px';
    });
    (function tick(){ ax+=(mx-ax)*.12; ay+=(my-ay)*.12; cursorAnel.style.left=ax+'px'; cursorAnel.style.top=ay+'px'; requestAnimationFrame(tick); })();
    if('ontouchstart' in window){ cursor.style.display='none'; cursorAnel.style.display='none'; }

    // Nav
    const nav = document.getElementById('nav');
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');
    const topoBtn = document.getElementById('topoBtn');
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 40);
      topoBtn.classList.toggle('visivel', window.scrollY > 400);
    });
    navToggle.addEventListener('click', () => { navToggle.classList.toggle('ativo'); navLinks.classList.toggle('aberto'); });
    navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { navToggle.classList.remove('ativo'); navLinks.classList.remove('aberto'); }));

    // Scroll reveal
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add('visivel'); obs.unobserve(e.target); } });
    }, { threshold: .08 });
    document.querySelectorAll('.reveal, .reveal-esq, .reveal-dir').forEach(el => obs.observe(el));

    // Filtros
    const filtros = document.querySelectorAll('.filtro-btn');
    const cards = document.querySelectorAll('#livrosGrade > .livro-card, #livrosGrade > .livro-card-wide');
    const contagem = document.getElementById('filtrosContagem');

    filtros.forEach(btn => {
      btn.addEventListener('click', () => {
        filtros.forEach(b => b.classList.remove('ativo'));
        btn.classList.add('ativo');
        const filtro = btn.dataset.filtro;
        let visiveis = 0;
        cards.forEach(card => {
          const generos = card.dataset.genero || '';
          const mostrar = filtro === 'todos' || generos.includes(filtro);
          card.classList.toggle('filtrado', !mostrar);
          if(mostrar) visiveis++;
        });
        contagem.textContent = visiveis + (visiveis === 1 ? ' obra' : ' obras');
      });
    });

    // Countdown para A Marca da Besta (Agosto 2026)
    function atualizarCountdown() {
      const alvo = new Date('2026-08-01T00:00:00');
      const agora = new Date();
      const diff = alvo - agora;
      if(diff <= 0) return;
      const dias  = Math.floor(diff / (1000*60*60*24));
      const horas = Math.floor((diff % (1000*60*60*24)) / (1000*60*60));
      const mins  = Math.floor((diff % (1000*60*60)) / (1000*60));
      const segs  = Math.floor((diff % (1000*60)) / 1000);
      const el = document.getElementById('countdown');
      if(el) {
        el.querySelector('.cd-dias').textContent  = String(dias).padStart(3,'0');
        el.querySelector('.cd-horas').textContent = String(horas).padStart(2,'0');
        el.querySelector('.cd-mins').textContent  = String(mins).padStart(2,'0');
        el.querySelector('.cd-segs').textContent  = String(segs).padStart(2,'0');
      }
    }
    setInterval(atualizarCountdown, 1000);

    // Newsletter
    function inscricao(e) {
      e.preventDefault();
      const btn = e.target.querySelector('button');
      btn.textContent = '✓ Inscrito!';
      btn.style.background = '#4a7c59';
      e.target.querySelector('input').value = '';
      setTimeout(() => { btn.textContent = 'Inscrever-se'; btn.style.background = ''; }, 3000);
    }