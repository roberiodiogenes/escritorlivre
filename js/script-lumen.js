    // --- Cursor ---
    const cursor = document.getElementById('cursor');
    const cAnel  = document.getElementById('cursorAnel');
    let mx=0,my=0,ax=0,ay=0;
    document.addEventListener('mousemove', e => {
      mx=e.clientX; my=e.clientY;
      cursor.style.left=mx+'px'; cursor.style.top=my+'px';
    });
    (function tick(){ ax+=(mx-ax)*.11; ay+=(my-ay)*.11; cAnel.style.left=ax+'px'; cAnel.style.top=ay+'px'; requestAnimationFrame(tick); })();
    if('ontouchstart' in window){ cursor.style.display='none'; cAnel.style.display='none'; }

    // --- Nav scroll ---
    const nav    = document.getElementById('nav');
    const topoBtn= document.getElementById('topoBtn');
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY>40);
      topoBtn.classList.toggle('visivel', window.scrollY>500);
    });

    // --- Scroll reveal ---
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add('v'); obs.unobserve(e.target); } });
    }, { threshold: .08 });
    document.querySelectorAll('.r,.re,.rd').forEach(el => obs.observe(el));

    // --- Capa 3D — mouse tilt ---
    const livro3d = document.getElementById('livro3d');
    document.addEventListener('mousemove', e => {
      if(window.innerWidth < 768) return;
      const cx = window.innerWidth/2, cy = window.innerHeight/2;
      const rx = -(e.clientY - cy) / cy * 8;
      const ry =  (e.clientX - cx) / cx * 12;
      livro3d.style.transform = `rotateX(${rx}deg) rotateY(${ry - 18}deg)`;
    });
    document.addEventListener('mouseleave', () => {
      livro3d.style.transform = 'rotateY(-18deg) rotateX(3deg)';
    });

    // --- Canvas: O Quadro de Izzi (labirinto generativo) ---
    const canvas = document.getElementById('quadroCanvas');
    const ctx    = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;

    function desenharLabirinto() {
      ctx.clearRect(0,0,W,H);

      // Fundo escuro com gradiente
      const grad = ctx.createRadialGradient(W/2,H/2,0, W/2,H/2,W/2);
      grad.addColorStop(0, '#0e1a28');
      grad.addColorStop(1, '#050709');
      ctx.fillStyle = grad;
      ctx.fillRect(0,0,W,H);

      // Reflexo no "chão" — gradiente horizontal sutil
      const piso = ctx.createLinearGradient(0, H*.5, 0, H);
      piso.addColorStop(0, 'rgba(78,205,196,0)');
      piso.addColorStop(1, 'rgba(78,205,196,0.04)');
      ctx.fillStyle = piso;
      ctx.fillRect(0,0,W,H);

      // Círculos concêntricos (paredes do labirinto)
      const raios = [160,125,90,60,35,16];
      raios.forEach((r, i) => {
        ctx.beginPath();
        ctx.arc(W/2, H/2, r, 0, Math.PI*2);
        ctx.strokeStyle = `rgba(78,205,196,${0.08 + i*.03})`;
        ctx.lineWidth = .8;
        ctx.stroke();
      });

      // Corredores (aberturas nas paredes)
      const aberturasConfig = [
        {r:160, ang: Math.PI*.5,  len:35},
        {r:125, ang: Math.PI*1.0, len:35},
        {r: 90, ang: Math.PI*1.5, len:30},
        {r: 60, ang: Math.PI*.25, len:25},
        {r: 35, ang: Math.PI*.75, len:20},
      ];
      aberturasConfig.forEach(({r,ang,len}) => {
        const x1 = W/2 + Math.cos(ang)*r;
        const y1 = H/2 + Math.sin(ang)*r;
        const x2 = W/2 + Math.cos(ang)*(r+len);
        const y2 = H/2 + Math.sin(ang)*(r+len);
        ctx.beginPath();
        ctx.moveTo(x1,y1); ctx.lineTo(x2,y2);
        ctx.strokeStyle = 'rgba(78,205,196,0.3)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      // Ponto central brilhante — "a saída"
      const glowGrad = ctx.createRadialGradient(W/2,H/2,0, W/2,H/2,20);
      glowGrad.addColorStop(0,'rgba(78,205,196,0.9)');
      glowGrad.addColorStop(.4,'rgba(78,205,196,0.3)');
      glowGrad.addColorStop(1,'rgba(78,205,196,0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath(); ctx.arc(W/2,H/2,20,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = 'rgba(78,205,196,1)';
      ctx.beginPath(); ctx.arc(W/2,H/2,4,0,Math.PI*2); ctx.fill();

      // Quadros nas "paredes" — retângulos sem rosto
      const quadros = [
        {x:30,  y:30,  w:55, h:72},
        {x:315, y:10,  w:70, h:55},
        {x:W-90,y:40,  w:55, h:70},
        {x:20,  y:H-95,w:65, h:50},
        {x:W-80,y:H-85,w:60, h:65},
      ];
      quadros.forEach(({x,y,w,h}) => {
        ctx.strokeStyle = 'rgba(78,205,196,0.18)';
        ctx.lineWidth = .8;
        ctx.strokeRect(x, y, w, h);
        // Contorno interno do quadro
        ctx.strokeStyle = 'rgba(78,205,196,0.06)';
        ctx.strokeRect(x+4, y+4, w-8, h-8);
        // "Rosto" — oval vazio
        ctx.beginPath();
        ctx.ellipse(x+w/2, y+h*.45, w*.2, h*.28, 0, 0, Math.PI*2);
        ctx.strokeStyle = 'rgba(78,205,196,0.1)';
        ctx.stroke();
      });

      // Partículas flutuantes — "poeira de memória"
      for(let i=0; i<40; i++){
        const px = Math.random()*W, py = Math.random()*H;
        const op = Math.random()*.12;
        ctx.fillStyle = `rgba(78,205,196,${op})`;
        ctx.beginPath(); ctx.arc(px,py,Math.random()*1.5,0,Math.PI*2); ctx.fill();
      }
    }

    desenharLabirinto();

    // Animação sutil — piscar a luz central
    let fase = 0;
    function animarCanvas(){
      fase += .02;
      const alpha = 0.6 + Math.sin(fase)*.3;
      const glowGrad = ctx.createRadialGradient(W/2,H/2,0, W/2,H/2,20);
      glowGrad.addColorStop(0, `rgba(78,205,196,${alpha})`);
      glowGrad.addColorStop(.4,'rgba(78,205,196,0.2)');
      glowGrad.addColorStop(1,'rgba(78,205,196,0)');
      ctx.clearRect(W/2-25,H/2-25,50,50);
      // Redraw local
      const g2 = ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,W/2);
      g2.addColorStop(0,'#0e1a28'); g2.addColorStop(1,'#050709');
      ctx.fillStyle=g2; ctx.fillRect(W/2-25,H/2-25,50,50);
      ctx.fillStyle=glowGrad; ctx.beginPath(); ctx.arc(W/2,H/2,20,0,Math.PI*2); ctx.fill();
      ctx.fillStyle=`rgba(78,205,196,${alpha})`; ctx.beginPath(); ctx.arc(W/2,H/2,4,0,Math.PI*2); ctx.fill();
      requestAnimationFrame(animarCanvas);
    }
    animarCanvas();

    // --- Download amostra ---
    function baixarAmostra(e) {
      e.preventDefault();
      const btn = e.target.querySelector('button');
      const email = document.getElementById('emailAmostra').value;
      btn.textContent = '✓ Preparando download...';
      btn.disabled = true;
      setTimeout(() => {
        // Link de download — substitua pelo PDF real
        const link = document.createElement('a');
        link.href = '../livros/lumen-capitulo-1.txt';
        link.download = 'Lumen-Capitulo-1-Roberio-Diogenes.txt';
        link.click();
        btn.textContent = '✓ Download iniciado!';
        btn.style.background = '#2a9d8f';
        setTimeout(() => { btn.textContent = '📥 Baixar Capítulo Grátis'; btn.style.background=''; btn.disabled=false; }, 4000);
      }, 800);
    }

    // --- Enviar comentário ---
    function enviarComentario(e) {
      e.preventDefault();
      const btn = e.target.querySelector('button[type="submit"]');
      btn.textContent = '✓ Enviado! Aguardando moderação.';
      btn.style.background = '#2a9d8f';
      btn.disabled = true;
      e.target.reset();
      setTimeout(() => { btn.textContent='Publicar Comentário'; btn.style.background=''; btn.disabled=false; }, 5000);
    }