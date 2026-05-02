function updateCountdown() {
    // Define a data de lançamento: 1 de Maio de 2026
    const launchDate = new Date('May 1, 2026 00:00:00').getTime();
    const now = new Date().getTime();
    const duration = launchDate - now;

    if (duration > 0) {
        const days = Math.floor(duration / (1000 * 60 * 60 * 24));
        const hours = Math.floor((duration % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));

        // Atualiza os elementos na tela
        document.getElementById('days').innerText = days.toString().padStart(2, '0');
        document.getElementById('hours').innerText = hours.toString().padStart(2, '0');
        document.getElementById('minutes').innerText = minutes.toString().padStart(2, '0');
    } else {
        // Texto exibido após o lançamento
        document.getElementById('countdown').innerHTML = "<h3>Já Disponível!</h3>";
    }
}

// Atualiza a cada 1 minuto
setInterval(updateCountdown, 60000);
updateCountdown();

// --- EFEITO DE REVELAÇÃO DA SINOPSE ---
const observerOptions = {
    threshold: 0.5 // Revela quando 50% da seção estiver visível
};

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.filter = "blur(0)";
            entry.target.style.opacity = "1";
        }
    });
}, observerOptions);

// Aplica o observador ao parágrafo da sinopse
document.addEventListener("DOMContentLoaded", () => {
    const synopsis = document.querySelector('.synopsis-reveal');
    if (synopsis) revealObserver.observe(synopsis);
    
    // Inicia o contador
    updateCountdown();
});

// --- CONTADOR REGRESSIVO ---
function updateCountdown() {
    const launchDate = new Date('May 1, 2026 00:00:00').getTime();
    const now = new Date().getTime();
    const duration = launchDate - now;

    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minsEl = document.getElementById('minutes');

    if (duration > 0 && daysEl) {
        const days = Math.floor(duration / (1000 * 60 * 60 * 24));
        const hours = Math.floor((duration % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));

        daysEl.innerText = days.toString().padStart(2, '0');
        hoursEl.innerText = hours.toString().padStart(2, '0');
        minsEl.innerText = minutes.toString().padStart(2, '0');
    }
}

setInterval(updateCountdown, 60000);