    const cur=document.getElementById('cursor'),cAn=document.getElementById('cursorAnel');
    let mx=0,my=0,ax=0,ay=0;
    document.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;cur.style.left=mx+'px';cur.style.top=my+'px'});
    (function t(){ax+=(mx-ax)*.12;ay+=(my-ay)*.12;cAn.style.left=ax+'px';cAn.style.top=ay+'px';requestAnimationFrame(t)})();
    const nav=document.getElementById('nav'),topoBtn=document.getElementById('topoBtn');
    window.addEventListener('scroll',()=>{nav.classList.toggle('scrolled',scrollY>40);topoBtn.classList.toggle('visivel',scrollY>400)});
    const navToggle=document.getElementById('navToggle'),navLinks=document.getElementById('navLinks');
    navToggle.addEventListener('click',()=>{navToggle.classList.toggle('ativo');navLinks.classList.toggle('aberto')});
    const obs=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visivel');obs.unobserve(e.target)}})},{threshold:.08});
    document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));
    function enviarContato(e){
      e.preventDefault();
      const btn=e.target.querySelector('button[type="submit"]');
      btn.textContent='⏳ Enviando...';btn.disabled=true;
      setTimeout(()=>{btn.textContent='✓ Mensagem enviada!';btn.style.background='#4a7c59';e.target.reset();
      setTimeout(()=>{btn.textContent='Enviar Mensagem';btn.style.background='';btn.disabled=false;},4000);},1000);
    }