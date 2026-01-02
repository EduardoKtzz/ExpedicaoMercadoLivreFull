document.addEventListener('DOMContentLoaded', () => {
    // 1. Definição do HTML das Navbars
    const navbarHTML = `
    <nav class="top-navbar">
        <div class="nav-left">
            <a href="main.html" class="nav-logo">Sistema Pedidos</a>
                    <button id="toggleSidebar" class="toggle-btn">
                <span></span>
                <span></span>
                <span></span>
            </button>
            </div>
        <div class="nav-right">
            <div class="user-menu" id="userMenuBtn">
                <span class="user-trigger">
                    <span id="navUserName">Usuário</span> ▾
                </span>
                <div class="dropdown-menu" id="dropdownMenu">
                    <a href="#" id="logoutBtn" class="dropdown-item">Sair</a>
                </div>
            </div>
        </div>
    </nav>

    <aside class="side-navbar" id="sideNavbar">
        <div class="nav-content">
            <div class="nav-section-title">Principal</div>
            <a href="main.html" class="nav-link">🏠 Início</a>
            
            <hr class="nav-divider">
            
            <a href="gestãoDePedidos.html" class="nav-link">📦 Gestão Pedidos</a>
        </div>
    </aside>
    `;

    // 2. Injetar o HTML no início do Body
    document.body.insertAdjacentHTML('afterbegin', navbarHTML);

    // 3. Adicionar classes de layout ao Body
    document.body.classList.add('with-navbar');

    // 4. Lógica do Nome do Usuário
    const nomeSalvo = localStorage.getItem('usuarioNome') || 'Admin';
    document.getElementById('navUserName').textContent = nomeSalvo;

    // 5. Lógica do Toggle (Abrir/Fechar Sidebar)
    const toggleBtn = document.getElementById('toggleSidebar');
    const sideNavbar = document.getElementById('sideNavbar');
    
    toggleBtn.addEventListener('click', () => {
        sideNavbar.classList.toggle('closed');
        document.body.classList.toggle('sidebar-closed');
    });

    // 6. Lógica do Dropdown de Usuário
    const userMenuBtn = document.getElementById('userMenuBtn');
    const dropdownMenu = document.getElementById('dropdownMenu');

    userMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Evita fechar imediatamente
        dropdownMenu.classList.toggle('active');
    });

    // Fechar dropdown se clicar fora
    document.addEventListener('click', () => {
        dropdownMenu.classList.remove('active');
    });

    // 7. Lógica de Logout
    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        // Opcional: localStorage.removeItem('usuarioNome'); 
        window.location.href = 'index.html';
    });

    // 8. Destacar link ativo (Visual)
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        if(link.getAttribute('href') === currentPath.split('/').pop()) {
            link.classList.add('active');
        }
    });
});