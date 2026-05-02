// assets/js/main.js

document.addEventListener('DOMContentLoaded', () => {
    console.log("Site Escritor Livre carregado com sucesso!");
    
    // Futura lógica para o menu hamburguer responsivo
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('.nav-menu');

    if(menuToggle) {
        menuToggle.addEventListener('click', () => {
            nav.classList.toggle('active');
        });
    }
});