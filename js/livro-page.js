/* ================================================================
   ROBÉRIO DIÓGENES — livro-page.js
   Script compartilhado por todas as páginas de livros
   Enigma, avaliações, download de capítulo, comentários
   ================================================================ */

(function () {
  'use strict';

  /* ── ENIGMA ──────────────────────────────────────────────────── */
  window.EnigmaCtrl = {
    tentativas: 0,
    maxTentativas: 5,
    respondido: false,

    init(respostaCorreta, dica) {
      this.respostaCorreta = respostaCorreta.toLowerCase().trim();
      this.dica = dica || '';
      this.tentativas = parseInt(localStorage.getItem('enigma_' + window.LIVRO_SLUG) || '0');
      this.respondido = localStorage.getItem('enigma_ok_' + window.LIVRO_SLUG) === '1';

      if (this.respondido) {
        this.mostrarSucesso();
        return;
      }
      this.atualizarTentativas();

      const input = document.getElementById('enigmaInput');
      if (input) {
        input.addEventListener('keydown', e => {
          if (e.key === 'Enter') this.verificar();
        });
      }
    },

    verificar() {
      if (this.respondido) return;
      const input = document.getElementById('enigmaInput');
      if (!input) return;

      const resposta = input.value.toLowerCase().trim()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const correta = this.respostaCorreta
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

      this.tentativas++;
      localStorage.setItem('enigma_' + window.LIVRO_SLUG, this.tentativas);

      if (resposta === correta) {
        this.respondido = true;
        localStorage.setItem('enigma_ok_' + window.LIVRO_SLUG, '1');
        this.mostrarSucesso();
        window.Sons?.tocar('sucesso');
        window.mostrarToast?.('🎉 Resposta correta! Conteúdo desbloqueado!', 'sucesso', 5000);
      } else {
        this.mostrarErro();
        window.Sons?.tocar('erro');
        this.atualizarTentativas();
        input.value = '';
        input.focus();
      }
    },

    mostrarSucesso() {
      const fb = document.getElementById('enigmaFeedback');
      const desbloqueio = document.getElementById('enigmaDesbloqueio');
      if (fb) {
        fb.className = 'enigma-feedback certo';
        fb.textContent = '✓ Correto! Você desvendou o enigma.';
        fb.style.display = 'block';
      }
      if (desbloqueio) desbloqueio.style.display = 'block';
      const btn = document.getElementById('enigmaBtn');
      if (btn) btn.disabled = true;
    },

    mostrarErro() {
      const fb = document.getElementById('enigmaFeedback');
      if (fb) {
        const restam = this.maxTentativas - this.tentativas;
        fb.className = 'enigma-feedback errado';
        fb.textContent = restam > 0
          ? `✕ Não é isso. ${restam} tentativa${restam > 1 ? 's' : ''} restante${restam > 1 ? 's' : ''}.`
          : '✕ Sem mais tentativas. A dica está disponível.';
        fb.style.display = 'block';
      }
    },

    atualizarTentativas() {
      const el = document.getElementById('enigmaTentativas');
      if (el) el.textContent = `Tentativas: ${this.tentativas}/${this.maxTentativas}`;
    },

    toggleDica() {
      const el = document.getElementById('enigmaDicaTexto');
      if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
    }
  };

  /* ── ROLETA ──────────────────────────────────────────────────── */
  window.RoletaCtrl = {
    girando: false,

    init(segmentos) {
      this.segmentos = segmentos;
      this.canvas = document.getElementById('roletaCanvas');
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');
      this.angulo = 0;
      this.desenhar(0);
    },

    desenhar(rotacao) {
      const canvas = this.canvas;
      const ctx = this.ctx;
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const r = cx - 8;
      const n = this.segmentos.length;
      const fatia = (2 * Math.PI) / n;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cores = ['var(--ouro)', 'var(--fundo-3)', 'var(--ouro-escuro)', 'var(--fundo-2)',
                     'var(--ferrugem)', 'var(--fundo-card)', 'var(--madeira)', 'var(--creme)'];

      this.segmentos.forEach((seg, i) => {
        const inicio = rotacao + i * fatia;
        const fim    = inicio + fatia;
        const corCSS = getComputedStyle(document.documentElement)
          .getPropertyValue(cores[i % cores.length].replace('var(', '').replace(')', '').trim()) || '#B8860B';

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, inicio, fim);
        ctx.closePath();
        ctx.fillStyle = corCSS || ['#B8860B','#E4DBC8','#8B6508','#EDE6D6','#8B3A2A','#FAF7F2','#6B4226','#F2E8D4'][i % 8];
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.15)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Texto
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(inicio + fatia / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#FAF7F2';
        ctx.font = `bold ${Math.max(11, Math.floor(r / n * 1.2))}px Georgia`;
        ctx.shadowColor = 'rgba(0,0,0,.5)';
        ctx.shadowBlur = 3;
        ctx.fillText(seg.slice(0, 18), r - 14, 5);
        ctx.restore();
      });

      // Centro
      ctx.beginPath();
      ctx.arc(cx, cy, 18, 0, Math.PI * 2);
      ctx.fillStyle = '#B8860B';
      ctx.fill();
    },

    girar() {
      if (this.girando) return;
      this.girando = true;
      window.Sons?.tocar('clique');
      const btn = document.getElementById('roletaBtn');
      if (btn) btn.disabled = true;

      const voltas   = 5 + Math.random() * 5;
      const extra    = Math.random() * 2 * Math.PI;
      const total    = voltas * 2 * Math.PI + extra;
      const duracao  = 4000;
      const inicio   = performance.now();
      const anguloIni = this.angulo;

      const animar = (agora) => {
        const t = Math.min((agora - inicio) / duracao, 1);
        const ease = 1 - Math.pow(1 - t, 4);
        this.angulo = anguloIni + total * ease;
        this.desenhar(this.angulo);

        if (t < 1) {
          requestAnimationFrame(animar);
        } else {
          this.girando = false;
          if (btn) btn.disabled = false;

          // Calcula segmento vencedor
          const n = this.segmentos.length;
          const fatia = (2 * Math.PI) / n;
          const norm = (((-this.angulo % (2 * Math.PI)) + 2 * Math.PI)) % (2 * Math.PI);
          const idx = Math.floor(norm / fatia) % n;
          const vencedor = this.segmentos[idx];

          window.Sons?.tocar('sucesso');
          window.mostrarToast?.(`🎯 ${vencedor}`, 'sucesso', 6000);

          const resultado = document.getElementById('roletaResultado');
          if (resultado) {
            resultado.textContent = vencedor;
            resultado.parentElement.style.display = 'block';
          }
        }
      };
      requestAnimationFrame(animar);
    }
  };

  /* ── DOWNLOAD DE CAPÍTULO ────────────────────────────────────── */
  window.solicitarCapitulo = async function (capituloId, btnEl) {
    const email = document.getElementById('capituloEmail')?.value?.trim();
    const nome  = document.getElementById('capituloNome')?.value?.trim() || 'Leitor';

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      window.mostrarToast?.('Informe um e-mail válido.', 'aviso');
      return;
    }

    if (btnEl) btnEl.disabled = true;

    try {
      if (window.API) {
        await window.API.capitulo.desbloquear(capituloId, email, nome);
      }
      window.mostrarToast?.(
        `Capítulo enviado para ${email}! Verifique sua caixa de entrada. 📖`,
        'sucesso', 6000
      );
      window.Sons?.tocar('sucesso');
      document.getElementById('capituloEmail').value = '';
    } catch (err) {
      window.mostrarToast?.(err.message || 'Erro ao solicitar. Tente novamente.', 'erro');
    } finally {
      if (btnEl) btnEl.disabled = false;
    }
  };

  /* ── AVALIAÇÕES ──────────────────────────────────────────────── */
  window.AvaliacaoCtrl = {
    nota: 0,

    init() {
      this.atualizarEstrelas(0);
      document.querySelectorAll('.estrela').forEach(e => {
        e.addEventListener('click',      () => { this.nota = parseInt(e.dataset.v); this.atualizarEstrelas(this.nota); });
        e.addEventListener('mouseenter', () => this.atualizarEstrelas(parseInt(e.dataset.v)));
        e.addEventListener('mouseleave', () => this.atualizarEstrelas(this.nota));
      });
      this.carregarComentarios();
    },

    atualizarEstrelas(n) {
      document.querySelectorAll('.estrela').forEach((e, i) => {
        e.classList.toggle('on', i < n);
      });
    },

    async enviar() {
      if (!this.nota) { window.mostrarToast?.('Selecione uma nota.', 'aviso'); return; }
      const texto = document.getElementById('avTexto')?.value?.trim();
      if (!texto || texto.length < 10) { window.mostrarToast?.('Escreva pelo menos 10 caracteres.', 'aviso'); return; }

      if (!window.API?.auth.estaLogado()) {
        window.mostrarToast?.('Faça login para avaliar. 👤', 'aviso');
        setTimeout(() => window.location.href = (window.PREFIXO || '') + 'leitor/index.html', 1500);
        return;
      }

      try {
        await window.API.comentarios.criar({
          livro_slug: window.LIVRO_SLUG,
          nota: this.nota,
          texto
        });
        window.mostrarToast?.('Avaliação enviada! Aparecerá após moderação. ⭐', 'sucesso', 5000);
        window.Sons?.tocar('sucesso');
        document.getElementById('avTexto').value = '';
        this.nota = 0; this.atualizarEstrelas(0);
      } catch (err) {
        window.mostrarToast?.(err.message, 'erro');
      }
    },

    async carregarComentarios() {
      if (!window.LIVRO_SLUG || !window.API) return;
      try {
        const res = await window.API.comentarios.listar(window.LIVRO_SLUG);
        this.renderizarComentarios(res);
      } catch (e) { /* usa os estáticos do HTML */ }
    },

    renderizarComentarios(res) {
      const lista = document.getElementById('comentariosLista');
      const mediaEl = document.getElementById('mediaNumero');
      const estrelasEl = document.getElementById('mediaEstrelas');
      const totalEl = document.getElementById('mediaTotal');

      if (mediaEl && res.media) mediaEl.textContent = res.media;
      if (estrelasEl && res.media) estrelasEl.textContent = '★'.repeat(Math.round(res.media)) + '☆'.repeat(5 - Math.round(res.media));
      if (totalEl) totalEl.textContent = `${res.total_avaliacoes || 0} avaliação${res.total_avaliacoes !== 1 ? 'ões' : ''}`;

      if (!lista || !res.comentarios?.length) return;
      lista.innerHTML = res.comentarios.map(c => `
        <div class="lp-comentario">
          <div class="lp-comentario-cabecalho">
            <span class="lp-comentario-leitor">${c.leitor}</span>
            <span class="lp-comentario-estrelas">${'★'.repeat(c.nota)}${'☆'.repeat(5-c.nota)}</span>
            <span class="lp-comentario-data">${new Date(c.criado_em).toLocaleDateString('pt-BR')}</span>
          </div>
          <p class="lp-comentario-texto">${c.texto}</p>
        </div>
      `).join('');
    }
  };

  /* ── INIT ──────────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    if (window.AvaliacaoCtrl) window.AvaliacaoCtrl.init();
  });

})();
