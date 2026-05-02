    // Cursor
    const cur=document.getElementById('cursor'),cAn=document.getElementById('cursorAnel');
    let mx=0,my=0,ax=0,ay=0;
    document.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;cur.style.left=mx+'px';cur.style.top=my+'px'});
    (function t(){ax+=(mx-ax)*.11;ay+=(my-ay)*.11;cAn.style.left=ax+'px';cAn.style.top=ay+'px';requestAnimationFrame(t)})();
    if('ontouchstart'in window){cur.style.display='none';cAn.style.display='none'}

    // Nav / topo
    const nav=document.getElementById('nav'),topoBtn=document.getElementById('topoBtn');
    window.addEventListener('scroll',()=>{nav.classList.toggle('scrolled',scrollY>40);topoBtn.classList.toggle('v',scrollY>500)},{passive:true});

    // Hero BG
    const heroBg=document.getElementById('heroBg');
    setTimeout(()=>heroBg.classList.add('loaded'),200);
    window.addEventListener('scroll',()=>{heroBg.style.transform=`translateY(${scrollY*.15}px)`;},{passive:true});

    // Capa 3D
    const l3d=document.getElementById('livro3d');
    document.addEventListener('mousemove',e=>{
      if(window.innerWidth<768)return;
      const rx=-(e.clientY-innerHeight/2)/innerHeight*8;
      const ry=(e.clientX-innerWidth/2)/innerWidth*12;
      l3d.style.transform=`rotateX(${rx}deg) rotateY(${ry-18}deg)`;
    });
    document.addEventListener('mouseleave',()=>{l3d.style.transform='rotateY(-18deg) rotateX(3deg)'});

    // Scroll reveal
    const obs=new IntersectionObserver(entries=>{
      entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('v');obs.unobserve(e.target)}});
    },{threshold:.08});
    document.querySelectorAll('.r,.re,.rd').forEach(el=>obs.observe(el));

    // ============================================================
    // GUIA DE LEITURA — dados
    // ============================================================
    const guiaDados = {
      '1': {
        label: 'Momento 01',
        tit: 'Você suspeita de traição, <em>mas não tem provas</em>',
        texto: 'Você está num território muito específico — e muito perigoso. A intuição que você sente pode ser genuína, ou pode ser o medo falando mais alto. Antes de agir, você precisa entender a diferença.',
        caminho: '→ Comece pelo Capítulo 2 (As Fissuras Silenciosas)\n→ Depois: Capítulo 3, subseção "Confronto ou Silêncio"\n→ Não pule para o adultério consumado ainda',
        nota: 'Se você está confuso sobre o que sente, leia o Prefácio primeiro. Às vezes, entender o desígnio original ajuda a nomear onde está a ruptura.'
      },
      '2': {
        label: 'Momento 02',
        tit: 'Você acabou de descobrir a traição — <em>horas ou dias atrás</em>',
        texto: 'Seu corpo está em choque. Não é fraqueza — é biologia. Você acabou de ter uma ruptura que é comparável, neurologicamente, à perda por morte. Não tome decisões irreversíveis agora.',
        caminho: '→ Capítulo 3 (subseção "As primeiras horas") — primeiro\n→ Depois: Capítulo 4 (A Abstinência da Presença) — para entender o choque físico\n→ Não avance para reconciliação ainda. O foco é sobreviver às próximas horas.',
        nota: 'Se a dor for insuportável agora, leia apenas o que indico para o seu caso. O resto pode esperar.'
      },
      '3': {
        label: 'Momento 03',
        tit: 'Você está <em>no meio da separação</em>',
        texto: 'O maior risco agora é a obsessão — vigiar, investigar, controlar. Isso não é amor. É abstinência. E confundir os dois é uma das maiores armadilhas que você vai enfrentar.',
        caminho: '→ Capítulo 4 (A Abstinência da Presença) — todo ele\n→ Especialmente: obsessão e dependência emocional\n→ Depois: Capítulo 5 (A Cura do Indivíduo)\n→ O foco agora é você, não o outro.',
        nota: 'Você não precisa ter respostas sobre o casamento agora. Você precisa sobreviver inteiro.'
      },
      '4': {
        label: 'Momento 04',
        tit: 'Você quer saber se <em>o divórcio é permitido por Deus</em>',
        texto: 'Você já ouviu "Deus odeia o divórcio" mais vezes do que consegue contar. Mas provavelmente nunca ouviu a frase inteira — nem o que o mesmo Deus disse logo depois sobre quem deveria ser protegido.',
        caminho: '→ Capítulo 6 (O Fim de uma Aliança) — completo\n→ Leia com calma as exceções bíblicas\n→ Não pule as notas sobre perdão vs reconciliação\n→ Depois, se precisar de confirmação, leia o Epílogo.',
        nota: 'Leia com calma. Não use o livro como justificativa para uma decisão que você já tomou. Use para entender o que Deus de fato diz — sem filtros humanos.'
      },
      '5': {
        label: 'Momento 05',
        tit: 'Você está pensando em reconciliar — <em>ou sendo pressionado</em>',
        texto: 'Há uma pergunta que precisa ser respondida antes de qualquer passo: o arrependimento que você está vendo é real, ou é remorso de quem foi pego? A resposta determina tudo.',
        caminho: '→ Capítulo 7, seção 7.1 (O Único Arrependimento que Presta) — primeiro\n→ Se o outro não cumpre os critérios: pare aqui\n→ Se cumpre: leia 7.2 (Os Dois Sim) e 7.3 (Primeiros Passos)\n→ O restante (gatilhos, intimidade) só quando já estiverem no processo',
        nota: 'Reconciliação não é um evento. É um sistema diário. E ele só funciona quando ambos querem — não quando um está tentando salvar e o outro está esperando.'
      },
      '6': {
        label: 'Momento 06',
        tit: 'Você traiu — e quer entender <em>o que aconteceu dentro de você</em>',
        texto: 'Há uma diferença entre uma queda e um estilo de vida de traição. Entender em qual você está muda completamente o que precisa acontecer agora.',
        caminho: '→ Capítulo 2 (Fissuras): tecnologia, amizade íntima, pornografia\n→ Capítulo 3: Adultério como processo (queda vs padrão)\n→ Capítulo 7: Arrependimento genuíno (remorso vs mudança real)',
        nota: 'Este livro não vai te poupar. Mas também não vai te reduzir ao seu pior momento. Há uma diferença entre o que você fez e quem você é — e o livro vai exigir que você a confronte.'
      },
      '7': {
        label: 'Momento 07',
        tit: 'Você já se divorciou — e carrega <em>culpa ou vergonha</em>',
        texto: 'Você provavelmente ouviu que Deus está desapontado com você. Ou que seu casamento era para durar para sempre e você falhou. Este livro tem algo diferente a dizer.',
        caminho: '→ Leia o Epílogo primeiro (A Esperança que vai além do casamento)\n→ Depois: Capítulo 5 (Cura do Indivíduo) — completo\n→ Capítulo 6 só se precisar de confirmação teológica de que não está condenado\n→ Use a oração final e o espaço de anotações',
        nota: 'O livro termina com uma oração e espaço para anotações. Use-os. Você chegou ao lugar certo.'
      },
      '8': {
        label: 'Momento 08',
        tit: 'Você é líder, conselheiro ou pastor — e <em>quer saber o que não dizer</em>',
        texto: 'A maior dor de quem está em crise muitas vezes não vem do cônjuge. Vem de quem deveria ajudar — e usa a Bíblia como instrumento de pressão. Este livro foi escrito para que isso pare.',
        caminho: '→ Leia o livro inteiro na ordem\n→ Atenção especial: Capítulo 2 (fissuras) e Capítulo 6 (divórcio)\n→ Capítulo 6 especialmente: violência espiritual e o que não dizer\n→ Use o Apêndice se disponível na sua edição',
        nota: 'Você precisa saber o que não dizer a quem sofre. O silêncio compassivo às vezes vale mais do que dez versículos mal aplicados.'
      }
    };

    // Guia interativo
    document.getElementById('guiaSelector').addEventListener('click', e => {
      const opcao = e.target.closest('.guia-opcao');
      if (!opcao) return;
      document.querySelectorAll('.guia-opcao').forEach(o => o.classList.remove('ativa'));
      opcao.classList.add('ativa');
      const momento = opcao.dataset.momento;
      const dados = guiaDados[momento];
      if (!dados) return;
      document.getElementById('resLabel').textContent = dados.label;
      document.getElementById('resTit').innerHTML = dados.tit;
      document.getElementById('resTexto').textContent = dados.texto;
      document.getElementById('resCaminho').textContent = dados.caminho;
      document.getElementById('resNota').textContent = dados.nota;
      const resultado = document.getElementById('guiaResultado');
      resultado.classList.add('aberto');
      setTimeout(() => resultado.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
    });

    // Download amostra
    function baixarAmostra(e) {
      e.preventDefault();
      const btn = e.target.querySelector('button');
      btn.textContent = '⏳ Preparando...'; btn.disabled = true;
      setTimeout(() => {
        const a = document.createElement('a');
        a.href = '../livros/setima-lei-amostra.pdf';
        a.download = 'A-Setima-Lei-Roberio-Diogenes.pdf';
        a.click();
        btn.textContent = '✓ Download iniciado!'; btn.style.background = '#6b4a1a';
        setTimeout(() => { btn.textContent = '📥 Baixar Amostra Grátis'; btn.style.background = ''; btn.disabled = false; }, 4000);
      }, 700);
    }

    // Comentário
    function enviarComentario(e) {
      e.preventDefault();
      const btn = e.target.querySelector('button[type="submit"]');
      btn.textContent = '✓ Enviado! Aguardando moderação.'; btn.style.background = '#5a3a0a'; btn.disabled = true;
      e.target.reset();
      setTimeout(() => { btn.textContent = 'Publicar Comentário'; btn.style.background = ''; btn.disabled = false; }, 5000);
    }