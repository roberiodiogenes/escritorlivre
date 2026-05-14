/* index.js — scripts exclusivos da página inicial */
window.inscricaoEmail = function(e) {
  e.preventDefault();
  const email = document.getElementById('nl-email').value;
  if (!email) return;
  mostrarToast('Inscrição realizada! Bem-vindo à família. 📖', 'sucesso', 4000);
  Sons.tocar('sucesso');
  document.getElementById('nl-email').value = '';
};

window.submeterNewsletter = function(e) {
  e.preventDefault();
  const input = e.target.querySelector('input[type="email"]');
  mostrarToast('Inscrição realizada! 📖', 'sucesso');
  if (input) input.value = '';
};
