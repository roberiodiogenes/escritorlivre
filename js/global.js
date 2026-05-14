/* ================================================================
   ROBÉRIO DIÓGENES — global.js v2 (corrigido)
   ================================================================ */
(function () {
  'use strict';

  /* ── SONS ──────────────────────────────────────────────────── */
  const Sons = {
    ctx: null,
    habilitado: true,

    garantirCtx() {
      if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return true; }
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); return true; }
      catch (e) { this.habilitado = false; return false; }
    },

    tocar(tipo) {
      if (!this.habilitado || !this.garantirCtx()) return;
      const ctx = this.ctx, now = ctx.currentTime;
      const osc = (type, freq, gain, dur, delay) => {
        try {
          const o = ctx.createOscillator(), g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination);
          o.type = type; o.frequency.value = freq;
          const t = now + (delay || 0);
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(gain, t + 0.02);
          g.gain.exponentialRampToValueAtTime(0.001, t + dur);
          o.start(t); o.stop(t + dur + 0.05);
        } catch(e){}
      };
      switch(tipo) {
        case 'pagina':    [261.63,329.63,392].forEach((f,i)=>osc('sine',f,0.04,1.2,i*0.08)); break;
        case 'hover':     osc('sine',880,0.015,0.12); break;
        case 'clique':    osc('sine',440,0.04,0.15); break;
        case 'sucesso':   osc('sine',523,0.05,0.35,0); osc('sine',659,0.05,0.35,0.12); break;
        case 'notificacao': osc('triangle',1046,0.03,0.5); break;
        case 'erro':      osc('sawtooth',220,0.03,0.3); break;
      }
    },

    alternar() {
      this.habilitado = !this.habilitado;
      Armazena.salvar('sons', this.habilitado ? '1' : '0');
      document.querySelectorAll('.som-btn').forEach(b => {
        b.textContent = this.habilitado ? '♪' : '♩';
        b.title = this.habilitado ? 'Silenciar sons' : 'Ativar sons';
      });
      if (this.habilitado) this.tocar('clique');
    }
  };

  /* ── ARMAZENAMENTO ─────────────────────────────────────────── */
  const Armazena = {
    salvar(k, v) { try { localStorage.setItem('rd_' + k, v); } catch(e){} },
    ler(k, def)  { try { return localStorage.getItem('rd_' + k) ?? def; } catch(e){ return def; } }
  };

  /* ── TEMAS ─────────────────────────────────────────────────── */
  const Temas = {
    atual: 'claro',
    validos: ['claro','noturno','contraste'],

    init() { this.aplicar(Armazena.ler('tema','claro'), false); },

    aplicar(tema, som) {
      if (!tema || !this.validos.includes(tema)) return;
      this.atual = tema;
      document.documentElement.setAttribute('data-tema', tema);
      Armazena.salvar('tema', tema);
      document.querySelectorAll('.tema-btn[data-tema]').forEach(b => {
        const ativo = b.dataset.tema === tema;
        b.classList.toggle('ativo', ativo);
        b.setAttribute('aria-pressed', String(ativo));
      });
      if (window.Particulas && Particulas.canvas) Particulas.reconfigurar(tema);
      if (som !== false) Sons.tocar('clique');
    }
  };

  /* ── FONTE ─────────────────────────────────────────────────── */
  const Fonte = {
    tamanhos: [16,18,20,22],
    atual: 1,

    init() {
      this.atual = Math.min(3, Math.max(0, parseInt(Armazena.ler('fonte','1')) || 1));
      this.aplicar(this.atual, false);
    },
    aumentar() { if (this.atual < 3) { this.atual++; this.aplicar(this.atual); } },
    diminuir()  { if (this.atual > 0) { this.atual--; this.aplicar(this.atual); } },
    aplicar(idx, som) {
      this.atual = idx;
      document.documentElement.style.setProperty('--tamanho-base', this.tamanhos[idx] + 'px');
      Armazena.salvar('fonte', idx);
      if (som !== false) Sons.tocar('clique');
    }
  };

  /* ── PARTÍCULAS ────────────────────────────────────────────── */
  window.Particulas = {
    canvas: null, ctx2d: null, particulas: [], animId: null, W: 0, H: 0, cfg: null,
    configs: {
      claro:     { qtd:50, cores:['rgba(139,99,40,','rgba(184,134,11,','rgba(92,79,58,'],  tMin:1.5,tMax:4,  vel:0.4, opMax:0.45 },
      noturno:   { qtd:75, cores:['rgba(155,46,26,','rgba(200,148,12,','rgba(80,15,5,'],   tMin:1,  tMax:3.5,vel:0.55,opMax:0.60 },
      contraste: { qtd:25, cores:['rgba(0,0,0,',    'rgba(122,80,0,'],                     tMin:1,  tMax:2.5,vel:0.3, opMax:0.18 }
    },

    init() {
      this.canvas = document.getElementById('canvas-particulas');
      if (!this.canvas) return;
      this.ctx2d = this.canvas.getContext('2d');
      this.resize();
      window.addEventListener('resize', () => this.resize(), {passive:true});
      this.reconfigurar(Temas.atual);
    },

    resize() {
      if (!this.canvas) return;
      this.W = this.canvas.width  = window.innerWidth;
      this.H = this.canvas.height = window.innerHeight;
    },

    nova(cfg, aleatorio) {
      const cor = cfg.cores[Math.floor(Math.random()*cfg.cores.length)];
      return {
        x: Math.random()*this.W,
        y: aleatorio ? Math.random()*this.H : this.H+20,
        tam: cfg.tMin + Math.random()*(cfg.tMax-cfg.tMin),
        vel: cfg.vel*(0.5+Math.random()*1.2),
        dx: (Math.random()-0.5)*0.4,
        op: 0, opMax: cfg.opMax*(0.5+Math.random()*0.5),
        cor, rot: Math.random()*Math.PI*2, dRot:(Math.random()-0.5)*0.02,
        losango: Math.random() > 0.65
      };
    },

    reconfigurar(tema) {
      if (this.animId) { cancelAnimationFrame(this.animId); this.animId = null; }
      this.cfg = this.configs[tema] || this.configs.claro;
      this.particulas = Array.from({length: this.cfg.qtd}, () => this.nova(this.cfg, true));
      this.loop();
    },

    loop() {
      const cfg = this.cfg, c = this.ctx2d;
      if (!cfg || !c) return;
      const tick = () => {
        c.clearRect(0,0,this.W,this.H);
        for (let i = this.particulas.length-1; i >= 0; i--) {
          const p = this.particulas[i];
          p.y -= p.vel; p.x += p.dx; p.rot += p.dRot;
          const prog = 1 - p.y/this.H;
          if      (prog < 0.15) p.op = Math.min(p.op+0.012, p.opMax*(prog/0.15));
          else if (prog > 0.75) p.op = Math.max(0, p.opMax*(1-(prog-0.75)/0.25));
          else                  p.op = Math.min(p.op+0.008, p.opMax);
          if (p.y < -20 || p.x < -50 || p.x > this.W+50) { this.particulas[i] = this.nova(cfg,false); continue; }
          c.save();
          c.translate(p.x, p.y); c.rotate(p.rot);
          c.globalAlpha = Math.max(0, p.op);
          c.fillStyle = p.cor + p.op + ')';
          c.beginPath();
          if (p.losango) { const s=p.tam*1.4; c.moveTo(0,-s);c.lineTo(s,0);c.lineTo(0,s);c.lineTo(-s,0);c.closePath(); }
          else           { c.arc(0,0,p.tam,0,Math.PI*2); }
          c.fill(); c.restore();
        }
        this.animId = requestAnimationFrame(tick);
      };
      tick();
    }
  };

  /* ── NAVEGAÇÃO ─────────────────────────────────────────────── */
  const Nav = {
    init() {
      const nav     = document.getElementById('nav');
      const toggle  = document.getElementById('navToggle');
      const links   = document.getElementById('navLinks');
      const topoBtn = document.getElementById('topoBtn');
      if (!nav) return;

      window.addEventListener('scroll', () => {
        nav.classList.toggle('nav-scrolled', window.scrollY > 20);
        if (topoBtn) topoBtn.classList.toggle('visivel', window.scrollY > 400);
      }, {passive:true});

      if (toggle && links) {
        toggle.addEventListener('click', e => {
          e.stopPropagation();
          const aberto = links.classList.toggle('aberto');
          toggle.classList.toggle('aberto', aberto);
          toggle.setAttribute('aria-expanded', String(aberto));
          Sons.tocar('clique');
        });

        document.addEventListener('click', e => {
          if (links.classList.contains('aberto') && !nav.contains(e.target)) {
            links.classList.remove('aberto');
            toggle.classList.remove('aberto');
            toggle.setAttribute('aria-expanded','false');
          }
        });

        document.addEventListener('keydown', e => {
          if (e.key === 'Escape' && links.classList.contains('aberto')) {
            links.classList.remove('aberto');
            toggle.classList.remove('aberto');
            toggle.setAttribute('aria-expanded','false');
            toggle.focus();
          }
        });

        links.querySelectorAll('a').forEach(a => {
          a.addEventListener('click', () => {
            links.classList.remove('aberto');
            toggle.classList.remove('aberto');
            toggle.setAttribute('aria-expanded','false');
          });
        });
      }

      if (topoBtn) {
        topoBtn.addEventListener('click', e => {
          e.preventDefault();
          window.scrollTo({top:0,behavior:'smooth'});
          Sons.tocar('hover');
        });
      }

      nav.querySelectorAll('a').forEach(a => {
        a.addEventListener('mouseenter', () => Sons.tocar('hover'));
      });
    }
  };

  /* ── ACESSIBILIDADE ────────────────────────────────────────── */
  const Acessibilidade = {
    init() {
      /* Tema — só botões com data-tema */
      document.querySelectorAll('.tema-btn[data-tema]').forEach(btn => {
        btn.addEventListener('click', () => Temas.aplicar(btn.dataset.tema));
      });

      /* Som — botões com classe som-btn mas SEM data-tema */
      document.querySelectorAll('.som-btn').forEach(btn => {
        btn.addEventListener('click', () => Sons.alternar());
      });

      /* Fonte */
      document.querySelectorAll('.fonte-aumentar').forEach(btn => {
        btn.addEventListener('click', () => Fonte.aumentar());
      });
      document.querySelectorAll('.fonte-diminuir').forEach(btn => {
        btn.addEventListener('click', () => Fonte.diminuir());
      });
    }
  };

  /* ── BUSCA ─────────────────────────────────────────────────── */
  const Busca = {
    input: null, dropdown: null, indice: [],

    init() {
      this.input = document.querySelector('.busca-nav input');
      if (!this.input) return;

      /* Detecta se está numa subpasta (blog/, livros/, leitor/, admin/) */
      const path = window.location.pathname;
      const emSub = /\/(blog|livros|leitor|admin)\//.test(path);
      const p = emSub ? '../' : '';
      this.carregarIndice(p);
      this.criarDropdown();

      this.input.addEventListener('input',  () => this.pesquisar());
      this.input.addEventListener('focus',  () => Sons.tocar('hover'));
      this.input.addEventListener('keydown', e => {
        if (e.key==='Escape') { this.input.blur(); this.fechar(); }
      });
      document.addEventListener('click', e => {
        if (!this.input.closest('.busca-nav').contains(e.target)) this.fechar();
      });
    },

    criarDropdown() {
      const wrap = this.input.closest('.busca-nav');
      if (!wrap) return;
      this.dropdown = document.createElement('div');
      this.dropdown.className = 'busca-resultados';
      Object.assign(this.dropdown.style, {
        position:'absolute', top:'calc(100% + 8px)', left:'0', right:'0',
        background:'var(--fundo-card)', border:'1px solid var(--borda-forte)',
        borderRadius:'var(--raio-lg)', boxShadow:'var(--sombra-lg)',
        zIndex:'2000', display:'none', overflow:'hidden',
        maxHeight:'340px', overflowY:'auto'
      });
      wrap.appendChild(this.dropdown);
    },

    fechar() { if (this.dropdown) this.dropdown.style.display = 'none'; },

    carregarIndice(p) {
      this.indice = [
        {t:'Início',            u:p+'index.html',                       d:'Página principal'},
        {t:'Biblioteca',        u:p+'livros.html',                      d:'Todos os livros'},
        {t:'O Autor',           u:p+'autor.html',                       d:'Biografia'},
        {t:'Diário',            u:p+'blog.html',                        d:'Posts e reflexões'},
        {t:'Contato',           u:p+'contato.html',                     d:'Fale com o autor'},
        {t:'Área do Leitor',    u:p+'leitor/index.html',                d:'Login e compras'},
        {t:'O Jogo das Máscaras',u:p+'livros/jogo-das-mascaras.html',  d:'Thriller Psicológico'},
        {t:'A Sétima Lei',      u:p+'livros/a-setima-lei.html',         d:'Auto-Ajuda Cristã'},
        {t:'Lúmen',             u:p+'livros/lumen.html',                d:'Ficção · Romance'},
        {t:'Gênesis',           u:p+'livros/genesis.html',              d:'Ficção · Romance'},
        {t:'Rosas & Espinhos',  u:p+'livros/rosas-e-espinhos.html',    d:'Drama · Romance'},
        {t:'Cartas do Passado', u:p+'livros/cartas-do-passado.html',   d:'Ficção · Romance'},
        {t:'As Marés Secretas', u:p+'livros/mares-secretas.html',      d:'Romance · Drama'},
        {t:'Das Coisas que o Amor Faz',u:p+'livros/das-coisas-que-o-amor-faz.html',d:'Poesias'},
        {t:'O Abismo das Almas',u:p+'livros/o-abismo-das-almas.html',  d:'Distopia · Horror'},
        {t:'A Marca da Besta',  u:p+'livros/a-marca-da-besta.html',    d:'Distopia'},
        {t:'Caminhos de Outono',u:p+'livros/caminhos-de-outono.html',  d:'Romance'},
      ];
    },

    pesquisar() {
      const q = (this.input.value||'').trim().toLowerCase();
      if (!this.dropdown) return;
      if (q.length < 2) { this.fechar(); return; }
      const res = this.indice.filter(i => i.t.toLowerCase().includes(q) || i.d.toLowerCase().includes(q)).slice(0,6);
      this.dropdown.innerHTML = res.length
        ? res.map(i=>`<a href="${i.u}" style="display:flex;flex-direction:column;gap:2px;padding:.75rem 1.25rem;text-decoration:none;border-bottom:1px solid var(--borda);"
            onmouseenter="this.style.background='var(--fundo-2)'" onmouseleave="this.style.background=''"
            onclick="this.closest('.busca-resultados').style.display='none'">
            <span style="font-family:var(--fonte-titulo);font-size:.95rem;color:var(--texto);font-weight:500;">${this.hl(i.t,q)}</span>
            <span style="font-family:var(--fonte-ui);font-size:.78rem;color:var(--texto-3);font-style:italic;">${i.d}</span>
          </a>`).join('')
        : '<div style="padding:1rem 1.25rem;color:var(--texto-3);font-family:var(--fonte-ui);font-size:.85rem;">Nenhum resultado.</div>';
      this.dropdown.style.display = 'block';
    },

    hl(txt, q) {
      return txt.replace(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`, 'gi'),
        '<mark style="background:rgba(184,134,11,.25);color:var(--ouro);border-radius:2px;">$1</mark>');
    }
  };

  /* ── SCROLL REVEAL ─────────────────────────────────────────── */
  const Reveal = {
    init() {
      const els = document.querySelectorAll('.reveal');
      if (!els.length) return;
      if (!('IntersectionObserver' in window)) { els.forEach(el=>el.classList.add('visivel')); return; }
      const obs = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visivel'); obs.unobserve(e.target); } });
      }, {threshold:0.08, rootMargin:'0px 0px -20px 0px'});
      els.forEach(el => obs.observe(el));
    }
  };

  /* ── TOAST ─────────────────────────────────────────────────── */
  window.mostrarToast = function(msg, tipo, dur) {
    let wrap = document.querySelector('.toast-wrap');
    if (!wrap) { wrap = document.createElement('div'); wrap.className = 'toast-wrap'; document.body.appendChild(wrap); }
    const icons = {info:'📖',sucesso:'✓',erro:'✕',aviso:'⚠'};
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `<span>${icons[tipo]||'📖'}</span> ${msg}`;
    wrap.appendChild(t);
    Sons.tocar(tipo==='sucesso'?'sucesso':tipo==='erro'?'erro':'notificacao');
    setTimeout(()=>{ t.classList.add('saindo'); setTimeout(()=>t.remove(),400); }, dur||3500);
  };

  /* ── INICIALIZAÇÃO ─────────────────────────────────────────── */
  function inicializar() {
    Sons.habilitado = Armazena.ler('sons','1') === '1';

    Temas.init();
    Fonte.init();
    Nav.init();
    Acessibilidade.init();
    Busca.init();
    Reveal.init();
    Particulas.init();

    /* Atualiza ícone do som */
    document.querySelectorAll('.som-btn').forEach(b => {
      b.textContent = Sons.habilitado ? '♪' : '♩';
      b.title = Sons.habilitado ? 'Silenciar sons' : 'Ativar sons';
    });

    /* Som de boas-vindas na 1ª interação (exigência dos browsers) */
    const bv = () => { Sons.tocar('pagina'); };
    document.addEventListener('click',    bv, {once:true});
    document.addEventListener('touchend', bv, {once:true});

    /* Hover nos botões */
    document.querySelectorAll('.btn').forEach(b => {
      b.addEventListener('mouseenter', () => Sons.tocar('hover'));
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializar);
  } else {
    inicializar();
  }

  window.Sons  = Sons;
  window.Temas = Temas;
  window.Fonte = Fonte;

})();
