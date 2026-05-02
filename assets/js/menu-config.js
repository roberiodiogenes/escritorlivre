// assets/js/menu-config.js
const menuLinks = [
    { nome: "Início", link: "index.html" },
    { nome: "Livros", link: "livros.html" },
    { nome: "O Autor", link: "autor.html" },
    { nome: "Blog", link: "blog.html" },
    { nome: "Contato", link: "contato.html" }
];

function carregarMenu() {
    const navUl = document.querySelector('.nav-menu ul');
    
    if (navUl) {
        navUl.innerHTML = menuLinks.map(item => `
            <li><a href="${item.link}">${item.nome}</a></li>
        `).join('');
    }
}

// Garante que o DOM está carregado antes de injetar o menu
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', carregarMenu);
} else {
    carregarMenu();
}

