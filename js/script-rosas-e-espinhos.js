    // Cursor
    const cur=document.getElementById('cursor'),cAn=document.getElementById('cursorAnel');
    let mx=0,my=0,ax=0,ay=0;
    document.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;cur.style.left=mx+'px';cur.style.top=my+'px'});
    (function t(){ax+=(mx-ax)*.11;ay+=(my-ay)*.11;cAn.style.left=ax+'px';cAn.style.top=ay+'px';requestAnimationFrame(t)})();

    // Nav / topo
    const nav=document.getElementById('nav'),topoBtn=document.getElementById('topoBtn');
    window.addEventListener('scroll',()=>{nav.classList.toggle('scrolled',scrollY>40);topoBtn.classList.toggle('v',scrollY>500)},{passive:true});

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

    // Pétalas flutuantes suaves
    const petalasEl=document.getElementById('petalas');
    const flores=['🌸','🌹','🌺','🏵'];
    for(let i=0;i<12;i++){
      const p=document.createElement('span');
      p.className='petala';
      p.textContent=flores[i%flores.length];
      p.style.cssText=`left:${Math.random()*100}%;--dur:${8+Math.random()*12}s;--delay:${Math.random()*10}s;font-size:${.8+Math.random()*.8}rem`;
      petalasEl.appendChild(p);
    }

    // Download
    function baixarAmostra(e){
      e.preventDefault();
      const btn=e.target.querySelector('button');
      btn.textContent='🌸 Preparando...';btn.disabled=true;
      setTimeout(()=>{
        const a=document.createElement('a');
        a.href='../livros/rosas-espinhos-amostra.pdf';
        a.download='Rosas-e-Espinhos-Roberio-Diogenes.pdf';
        a.click();
        btn.textContent='✓ Download iniciado!';btn.style.background='var(--verde)';
        setTimeout(()=>{btn.textContent='🌸 Baixar Capítulo Grátis';btn.style.background='';btn.disabled=false;},4000);
      },700);
    }

    // Comentário
    function enviarComentario(e){
      e.preventDefault();
      const btn=e.target.querySelector('button[type="submit"]');
      btn.textContent='✓ Enviado! Aguardando moderação.';btn.style.background='var(--verde)';btn.disabled=true;
      e.target.reset();
      setTimeout(()=>{btn.textContent='Publicar Comentário';btn.style.background='';btn.disabled=false;},5000);
    }