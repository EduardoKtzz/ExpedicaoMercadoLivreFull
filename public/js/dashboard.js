document.addEventListener('DOMContentLoaded', () => {
    // Busca os elementos no HTML
    const greetingElement = document.getElementById('greeting');
    const btnMLFull = document.getElementById('btnMLFull');

    // --- LÓGICA DA SAUDAÇÃO ---
    // O 'if' garante que o código só tente mudar o texto SE o elemento existir
    if (greetingElement) {
        const agora = new Date();
        const hora = agora.getHours();
        let saudacao = 'Olá';

        if (hora >= 5 && hora < 12) {
            saudacao = 'Bom dia';
        } else if (hora >= 12 && hora < 18) {
            saudacao = 'Boa tarde';
        } else {
            saudacao = 'Boa noite';
        }

        const nomeUsuario = localStorage.getItem('usuarioNome') || 'Usuário';
        greetingElement.textContent = `${saudacao}, ${nomeUsuario}!`;
    } else {
        console.warn('Elemento #greeting não encontrado no HTML.');
    }

    // --- LÓGICA DO BOTÃO ---
    if (btnMLFull) {
        btnMLFull.addEventListener('click', (e) => {
            e.preventDefault(); // Previne comportamentos padrão estranhos
            console.log("Botão clicado! Redirecionando...");
            window.location.href = 'pedidoMLFULL.html';
        });
    } else {
        console.error('ERRO CRÍTICO: Botão #btnMLFull não encontrado! Verifique o ID no HTML.');
    }
});