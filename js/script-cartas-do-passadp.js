    // Cursor
    const cur=document.getElementById('cursor'),cAn=document.getElementById('cursorAnel');
    let mx=0,my=0,ax=0,ay=0;
    document.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;cur.style.left=mx+'px';cur.style.top=my+'px'});
    (function t(){ax+=(mx-ax)*.11;ay+=(my-ay)*.11;cAn.style.left=ax+'px';cAn.style.top=ay+'px';requestAnimationFrame(t)})();

    // Nav / topo
    const nav=document.getElementById('nav'),topoBtn=document.getElementById('topoBtn');
    window.addEventListener('scroll',()=>{nav.classList.toggle('scrolled',scrollY>40);topoBtn.classList.toggle('v',scrollY>500)},{passive:true});

    // Hero BG paralaxe
    const heroBg=document.getElementById('heroBg');
    setTimeout(()=>heroBg.classList.add('loaded'),200);
    window.addEventListener('scroll',()=>{heroBg.style.transform=`translateY(${scrollY*.15}px)`;},{passive:true});

    // Capa 3D
    const l3d=document.getElementById('livro3d');
    document.addEventListener('mousemove',e=>{
      if(window.innerWidth<768)return;
      const rx=-(e.clientY-innerHeight/2)/innerHeight*7;
      const ry=(e.clientX-innerWidth/2)/innerWidth*11;
      l3d.style.transform=`rotateX(${rx}deg) rotateY(${ry-18}deg)`;
    });
    document.addEventListener('mouseleave',()=>{l3d.style.transform='rotateY(-18deg) rotateX(3deg)'});

    // Scroll reveal
    const obs=new IntersectionObserver(entries=>{
      entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('v');obs.unobserve(e.target)}});
    },{threshold:.08});
    document.querySelectorAll('.r,.re,.rd').forEach(el=>obs.observe(el));

    // Download
    function baixarAmostra(e){
      e.preventDefault();
      const btn=e.target.querySelector('button');
      btn.textContent='⏳ Preparando...';btn.disabled=true;
      setTimeout(()=>{
        const a=document.createElement('a');
        a.href='../livros/cartas-passado-amostra.pdf';
        a.download='Cartas-do-Passado-Roberio-Diogenes.pdf';
        a.click();
        btn.textContent='✓ Download iniciado!';btn.style.background='#5a7a5c';
        setTimeout(()=>{btn.textContent='✉ Baixar Capítulo Grátis';btn.style.background='';btn.disabled=false;},4000);
      },700);
    }

    // Comentário
    function enviarComentario(e){
      e.preventDefault();
      const btn=e.target.querySelector('button[type="submit"]');
      btn.textContent='✓ Enviado! Aguardando moderação.';btn.style.background='#5a7a5c';btn.disabled=true;
      e.target.reset();
      setTimeout(()=>{btn.textContent='Publicar Comentário';btn.style.background='';btn.disabled=false;},5000);
    }