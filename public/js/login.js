document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('loginBtn');
    const cadastroBtn = document.getElementById('cadastroBtn');
    const cadastroForm = document.getElementById('cadastroForm');
    const statusDiv = document.getElementById('status');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Impede o recarregamento da página

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        // Limpa status
        statusDiv.className = 'status';
        statusDiv.textContent = '';

        if (!email || !password) {
            mostrarStatus('Preencha e-mail e senha.', 'error');
            return;
        }

        setLoading(true);

        try {

            const res = await fetch('/users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json().catch(() => null);

            if (!res.ok) {
                const msg = data?.error || 'Usuário ou senha inválidos.';
                throw new Error(msg);
            }

            console.log('Resposta do login:', data);

            // Salva token e nome do usuário no localStorage
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('usuarioNome', data.nome);
            localStorage.setItem('userId', data.id);


            mostrarStatus('Login realizado com sucesso. Redirecionando...', 'success');

            // Dá um tempinho pro usuário ver a mensagem
            setTimeout(() => {
                window.location.href = '/main.html'; // dashboard principal
            }, 500);

        } catch (err) {
            console.error(err);
            mostrarStatus(err.message || 'Erro ao tentar fazer login.', 'error');
        } finally {
            setLoading(false);
        }});

        cadastroBtn.addEventListener('click', (e) => {
        e.preventDefault();

            setTimeout(() => {
                window.location.href = '/cadastro.html'; // dashboard principal
            }, 0);

        });

    function setLoading(loading) {
        if (loading) {
            loginBtn.disabled = true;
            loginBtn.textContent = 'Entrando...';
            emailInput.disabled = true;
            passwordInput.disabled = true;
        } else {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Entrar no Sistema';
            emailInput.disabled = false;
            passwordInput.disabled = false;
        }
    }

    function mostrarStatus(mensagem, tipo) {
        statusDiv.textContent = mensagem;
        statusDiv.className = 'status ' + tipo; // ex: status success / status error
    }
});
