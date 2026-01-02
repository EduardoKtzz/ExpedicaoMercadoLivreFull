const tableBody = document.querySelector('#pedidosTable tbody');
const rowTemplate = document.getElementById('pedidoRowTemplate');
const codInternoML = document.getElementById('gsInput');
let dataTableInstance = null;
let pedidosMap = new Map();

// Ícones SVG para os status
const iconCheck = '<svg class="icon-status" viewBox="0 0 20 20"><path d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 011.4-1.4L8 12.58l7.3-7.3a1 1 0 011.4 0z"/></svg>';
const iconClock = '<svg class="icon-status" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/></svg>';

// Função da Barra de Progresso
function atualizarBarraProgresso() {
    const linhas = document.querySelectorAll("#pedidosTable tbody tr:not(#loading-row)");
    if (linhas.length === 0) return;

    const totalLinhas = linhas.length;
    // Conta quantas linhas tem a classe 'linha-concluida'
    const concluidas = document.querySelectorAll("#pedidosTable tbody tr.linha-concluida").length;

    const porcentagem = Math.round((concluidas / totalLinhas) * 100);

    const barra = document.getElementById("barraProgresso");
    const texto = document.getElementById("textoProgresso");

    if (barra && texto) {
        barra.style.width = porcentagem + "%";
        texto.textContent = porcentagem + "% VERIFICADO";
        
        if (porcentagem === 100) {
            barra.style.background = "#059669";
            texto.style.color = "white";
        } else {
            barra.style.background = "linear-gradient(90deg, #3b82f6, #2563eb)";
            texto.style.color = "#374151";
        }
    }
}

// função para preencher a tabela com os produtos no pedido atual
function preencherTabela(pedidos) {

    // LIMPA O TBODY (Isso remove o Loading Row automaticamente quando os dados chegam)
    tableBody.innerHTML = '';

    // loop de repetição
    pedidos.forEach((pedido) => {
        const clone = rowTemplate.content.cloneNode(true);

        clone.querySelector('.pedido').textContent = pedido.pedido || '';

        // ocultando coluna de EAN e CODIGOML

        //clone.querySelector('.ean').textContent = pedido.EAN || '';
        //clone.querySelector('.codigoML').textContent = pedido.codInternoML || '';

        clone.querySelector('.nome').textContent = pedido.nomeProduto;
        clone.querySelector('.gs').textContent = pedido.GS;
        clone.querySelector('.qtdTotal').textContent = pedido.quantidadeTotal;
        clone.querySelector('.qtdVerificada').textContent = pedido.quantidadeVerificada;

        // Lógica de Status
        const statusCell = clone.querySelector('.status');
        const verificado = (pedido.quantidadeVerificada ?? 0) >= (pedido.quantidadeTotal ?? 0);
        
        statusCell.innerHTML = (verificado ? iconCheck : iconClock) + (verificado ? "Verificado" : "Pendente");
        statusCell.className = ''; 
        statusCell.classList.add('status', verificado ? 'status-true' : 'status-false');

        const row = clone.querySelector('tr');   

        // guarda o EAN invisível na linha
        row.dataset.ean = pedido.EAN;

        if (verificado) row.classList.add('linha-concluida'); // Usando a nova classe padrão

        tableBody.appendChild(clone);
    });

    // Inicializa o Simple DataTables
    const tabelaElement = document.getElementById("pedidosTable");
    if (dataTableInstance) dataTableInstance.destroy();

    dataTableInstance = new simpleDatatables.DataTable(tabelaElement, {
        paging: false,
        searchable: false,
        sortable: true,
        fixedHeight: false,
        labels: {
            placeholder: "Pesquisar...",
            perPage: "Por página",
            noRows: "Nenhum pedido",
            info: "{start}–{end} de {rows}"
        }
    });

    // Calcula a barra inicial
    atualizarBarraProgresso();
}

// função para atualizar o status da linha e verificar 
function atualizarLinhaNaTabela(pedido) {

    const linhas = document.querySelectorAll("#pedidosTable tbody tr");

    linhas.forEach(linha => {

        // Verifica se é a linha certa comparando o texto
        if (linha.dataset.ean === pedido.EAN) {

            // 1. Atualiza quantidade verificada
            linha.querySelector(".qtdVerificada").textContent = pedido.quantidadeVerificada;

            const quantidadeVerificada = pedido.quantidadeVerificada ?? 0;
            const quantidadeTotal = pedido.quantidadeTotal ?? 0;
            const verificado = quantidadeVerificada >= quantidadeTotal;

            // 2. Atualiza Status e Ícone
            const statusCell = linha.querySelector(".status");
            // Se verificado: Ícone Check + Verde. Se não: Ícone Relógio + Amarelo/Cinza
            statusCell.innerHTML = (verificado ? iconCheck : iconClock) + (verificado ? "Verificado" : "Pendente");
            
            // Reseta classes e aplica a nova
            statusCell.className = '';
            statusCell.classList.add('status', verificado ? 'status-true' : 'status-false');

            // 3. Lógica Visual de "Linha Concluída"
            if (verificado) {
                linha.classList.add("linha-concluida");
                // Se acabou, remove a animação de bip para ficar verde sólido estático
                linha.classList.remove("animacao-bip"); 
            } else {
                // === AQUI ESTÁ O FIX DO FLASH ===
                // Se ainda não acabou (apenas somou +1), dá o flash!
                linha.classList.remove("animacao-bip");
                void linha.offsetWidth; // Truque para reiniciar a animação (Reflow)
                linha.classList.add("animacao-bip");
            }
            
            // 4. Foco automático e scroll suave (User Experience)
            linha.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });

    // Atualiza o mapa local
    pedidosMap.set(pedido.GS, pedido);
    
    // Atualiza a Barra de Progresso no topo
    if (typeof atualizarBarraProgresso === "function") {
        atualizarBarraProgresso();
    }

    // Checa se todos acabaram para abrir o modal
    const todasProdutosFinalizados = Array.from(linhas).every(linha => {
        const statusTexto = linha.querySelector(".status").textContent;
        return statusTexto.includes("Verificado");
    });

    if (todasProdutosFinalizados && linhas.length > 0) {
        abrirModalFinalizado();
    }
}

// função para processar o EAN e passar ele para o BACKEND
async function processarCodigoInternoML(codInternoML, numeroPedido) {
    try {
        const pedidoAtual = sessionStorage.getItem('pedidoNumero');
        if (!pedidoAtual) {
            console.log("Pedido não encontrado");
            return;
        }

        const res = await fetch('/order/processar-cod-interno-ml', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                codInternoML,
                numeroPedido: pedidoAtual
            })
        });

        if (!res.ok) {
            const errorData = await res.json();
            console.log(errorData);
            alert("Erro: " + (errorData.error || "Código inválido")); // Feedback visual de erro
            return;
        }

        const pedidoAtualizado = await res.json();
        atualizarLinhaNaTabela(pedidoAtualizado);

        // Limpa input
        const inputElement = document.getElementById('gsInput');
        inputElement.value = "";
        setTimeout(() => inputElement.focus(), 50);

    } catch (error) {
        console.error("Erro ao processar código interno ML:", error);
    }
}

// função para abrir o modal assim que tudo for finalizado
function abrirModalFinalizado() {
    const modal = document.getElementById("modalFinalizado");
    modal.classList.add("ativo");
}

function irParaMenu() {
    window.location.href = "main.html"
}

async function fetchPedidos(pedido) {
    const res = await fetch(`/order/pedidos?pedido=${pedido}`);
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erro ao buscar pedidos');
    }
    return data = await res.json();
}

async function initTabela() {
    try {
        const pedido = (sessionStorage.getItem('pedidoNumero') || '').replace(/[^0-9]/g, '');
        if (!pedido) throw new Error('Pedido não encontrado no sessionStorage');

        const pedidos = await fetchPedidos(pedido);

        pedidosMap.clear();
        pedidos.forEach(p => pedidosMap.set(p.GS, p));

        preencherTabela(pedidos);

    } catch (err) {
        console.error('Erro ao inicializar tabela:', err);
        // Opcional: mostrar erro na tabela se falhar
    }
}

// Evento do input
codInternoML.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        const codigoML = codInternoML.value.trim();
        if (codigoML === "") return;

        const numeroPedido = sessionStorage.getItem('pedidoNumero');
        if (!numeroPedido) {
            console.error("Pedido não encontrado");
            return;
        }

        processarCodigoInternoML(codigoML, numeroPedido);
        
        // Limpa input imediatamente para evitar bip duplo acidental
        codInternoML.value = "";
    }
});

document.addEventListener('DOMContentLoaded', initTabela);