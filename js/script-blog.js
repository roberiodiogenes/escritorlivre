    // Cursor
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

    // Nav
    const nav = document.getElementById('nav');
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');
    const topoBtn = document.getElementById('topoBtn');
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 40);
      topoBtn.classList.toggle('visivel', window.scrollY > 400);
    });
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('ativo');
      navLinks.classList.toggle('aberto');
    });

    // Scroll Reveal
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visivel'); observer.unobserve(e.target); } });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    // Filtros de categoria
    const filtrosBtns = document.querySelectorAll('.filtro-btn');
    const posts = document.querySelectorAll('#postsGrade .post-card, .post-destaque');

    filtrosBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filtrosBtns.forEach(b => b.classList.remove('ativo'));
        btn.classList.add('ativo');
        const cat = btn.dataset.cat;
        posts.forEach(post => {
          if (cat === 'todos' || post.dataset.cat === cat) {
            post.style.display = '';
          } else {
            post.style.display = 'none';
          }
        });
      });
    });

    // Links de categoria na sidebar
    document.querySelectorAll('.w-cat').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        const filtro = link.dataset.filtro;
        const btn = document.querySelector(`.filtro-btn[data-cat="${filtro}"]`);
        if (btn) { btn.click(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
      });
    });

    // Busca simples (filtra por título)
    document.getElementById('buscaInput').addEventListener('input', function () {
      const termo = this.value.toLowerCase().trim();
      document.querySelectorAll('.post-card, .post-destaque').forEach(post => {
        const titulo = post.querySelector('.pd-titulo, .pc-titulo')?.textContent.toLowerCase() || '';
        const resumo = post.querySelector('.pd-resumo, .pc-resumo')?.textContent.toLowerCase() || '';
        post.style.display = (!termo || titulo.includes(termo) || resumo.includes(termo)) ? '' : 'none';
      });
    });

    // Newsletter
    function inscricaoBlog(e) {
      e.preventDefault();
      const btn = e.target.querySelector('button');
      btn.textContent = '✓ Inscrito!';
      btn.style.background = '#4a7c59';
      e.target.querySelector('input').value = '';
      setTimeout(() => { btn.textContent = 'Inscrever-se'; btn.style.background = ''; }, 3000);
    }