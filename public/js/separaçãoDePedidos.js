const tableBody = document.querySelector('#pedidosTable tbody');
const rowTemplate = document.getElementById('pedidoRowTemplate');
const eanInput = document.getElementById("eanInput");

// variaveis globais
let processandoEAN = false;
let dataTableInstance = null;
let pedidosMap = new Map();

// Ícones SVG para os status (Check e Relógio)
const iconCheck = '<svg class="icon-status" viewBox="0 0 20 20"><path d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 011.4-1.4L8 12.58l7.3-7.3a1 1 0 011.4 0z"/></svg>';
const iconClock = '<svg class="icon-status" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/></svg>';

// Função para atualizar a barra de progresso no topo
function atualizarBarraProgresso() {
    // Pega todas as linhas que NÃO são de loading
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
        texto.textContent = porcentagem + "% CONCLUÍDO";
        
        // Se 100%, barra fica verde
        if (porcentagem === 100) {
            barra.style.background = "#059669"; // Verde
            texto.style.color = "white";
        } else {
            barra.style.background = "linear-gradient(90deg, #3b82f6, #2563eb)"; // Azul
            texto.style.color = "#374151";
        }
    }
}

// função para preencher a tabela com os produtos no pedido atual
function preencherTabela(pedidos) {

    tableBody.innerHTML = '';

    pedidos.forEach((pedido) => {
        const clone = rowTemplate.content.cloneNode(true);

        clone.querySelector('.pedido').textContent = pedido.pedido || '';

        // ocultando colunas de EAN e CODIGOML da tabela

        //clone.querySelector('.ean').textContent = pedido.EAN || '';
        //clone.querySelector('.codigoML').textContent = pedido.codInternoML || '';

        clone.querySelector('.nome').textContent = pedido.nomeProduto;
        clone.querySelector('.gs').textContent = pedido.GS;
        clone.querySelector('.qtdTotal').textContent = pedido.quantidadeTotal;
        clone.querySelector('.qtdSeparada').textContent = pedido.quantidadeSeparada;

        // Lógica Visual do Status (com Ícones)
        const statusCell = clone.querySelector('.status');
        const isFinalizado = pedido.status === 'Finalizado';
        
        // Insere o ícone + texto
        statusCell.innerHTML = (isFinalizado ? iconCheck : iconClock) + pedido.status;
        statusCell.className = isFinalizado ? 'status status-true' : 'status status-false';

        const row = clone.querySelector('tr');

        // guarda o EAN invisivelmente na linha
        row.dataset.ean = pedido.EAN
        
        // Se já estiver finalizado, aplica o visual verde sólido
        if (isFinalizado) {
            row.classList.add('linha-concluida');
        }

        tableBody.appendChild(clone);
    });

    const tabelaElement = document.getElementById("pedidosTable");
    if (dataTableInstance) dataTableInstance.destroy();

    dataTableInstance = new simpleDatatables.DataTable(tabelaElement, {
        paging: false,
        searchable: false,
        sortable: true,
        fixedHeight: false,
        labels: {
            placeholder: "Pesquisar...",
            perPage: "Por pág.",
            noRows: "Nenhum pedido",
            info: "{start}–{end} de {rows}"
        }
    });

    // Calcula a barra assim que carregar
    atualizarBarraProgresso();
}

// função para atualizar o status da linha e verificar 
function atualizarLinhaNaTabela(pedido) {
    const linhas = document.querySelectorAll("#pedidosTable tbody tr");

    linhas.forEach(linha => {

        if (linha.dataset.ean === pedido.EAN) {

            // 1. Atualiza números
            const celulaSeparada = linha.querySelector(".qtdSeparada");
            celulaSeparada.textContent = pedido.quantidadeSeparada;
            
            // 2. Atualiza Status Badge e Ícone
            const statusCell = linha.querySelector(".status");
            const isFinalizado = pedido.status === "Finalizado";
            
            statusCell.innerHTML = (isFinalizado ? iconCheck : iconClock) + pedido.status;
            statusCell.className = isFinalizado ? "status status-true" : "status status-false";

            // 3. Estilo da Linha
            if (isFinalizado) {
                linha.classList.add("linha-concluida");
                linha.classList.remove("animacao-bip");
            } else {
                // Flash Animation
                linha.classList.remove("animacao-bip");
                void linha.offsetWidth; 
                linha.classList.add("animacao-bip");
                linha.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    });

    // Atualiza a barra de progresso após o bip
    atualizarBarraProgresso();

    // Checa se tudo acabou
    const todasProdutosFinalizados = Array.from(linhas).every(linha => {
        const statusText = linha.querySelector(".status")?.textContent;
        // Verifica se o texto contem "Finalizado" (pois agora tem ícone junto)
        return statusText && statusText.includes("Finalizado");
    });

    if (todasProdutosFinalizados && linhas.length > 0) {
        const pedidoAtual = sessionStorage.getItem('pedidoNumero');
        if (pedidoAtual) {
            sessionStorage.setItem('faseAtual_' + pedidoAtual, 'verificacao');
        }
        abrirModalFinalizado();
    }
}

// função para processar o EAN e passar ele para o BACKEND
async function processarEAN(ean) {

    // verifica se o EAN já está sendo processado
    if (processandoEAN) {
        console.warn("⏳ EAN já está sendo processado");
        return;
    }

    processandoEAN = true;

    try {

        // pegando o número atual do pedido
        const pedidoAtual = sessionStorage.getItem('pedidoNumero'); 

        // tratamento de erro caso não tenha um número do pedido
        if (!pedidoAtual) {
            alert("Número do pedido não definido");
            return;
        }

        // chama o BACKEND para realizar as validações no EAN
        const res = await fetch('/order/processar-ean', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ean, numeroPedido: pedidoAtual })
        });

        // tratamento de erro caso aconteça alguma coisa
        if (!res.ok) {
            const errorData = await res.json();
            alert(errorData.error || "Erro inesperado");
            return;
        }

        // caso o backend retorne status positivo
        const pedidoAtualizado = await res.json();

        //conectando no QZ
        if (!qz.websocket.isActive()) {
            await qz.websocket.connect();
        }

        await imprimirZPL(pedidoAtualizado.ZPLfull);

        // chamando função para atualizar as linhas da tabela
        atualizarLinhaNaTabela(pedidoAtualizado);

    } catch (error) {
        console.error('Erro no processo de EAN:', error);
        alert('Erro inesperado no processamento do EAN');
    } finally {
        processandoEAN = false;
        eanInput.value = "";
        setTimeout(() => eanInput.focus(), 50);
    }
}

// Modal e Navegação
function abrirModalFinalizado() {
    const modal = document.getElementById("modalFinalizado");
    modal.classList.add("ativo");
}

function irParaCheckup() {
    window.location.href = "checkOut.html"
}

// Fetch Inicial
async function fetchPedidos(pedido) {
    const res = await fetch(`/order/pedidos?pedido=${pedido}`);
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erro ao buscar pedidos');
    }
    return await res.json();
}

// Inicialização
async function initTabela() {
    try {
        const pedido = (sessionStorage.getItem('pedidoNumero') || '').replace(/[^0-9]/g, '');
        if (!pedido) throw new Error('Pedido não encontrado no sessionStorage');

        const pedidos = await fetchPedidos(pedido);

        pedidosMap.clear();
        pedidos.forEach(p => pedidosMap.set(p.EAN, p));

        preencherTabela(pedidos);
    } catch (err) {
        console.error('Erro ao inicializar tabela:', err);
        alert(err.message);
    }
}

function voltarMenu() {
    window.location.href = "/main.html"; // ajuste para sua rota real
}

// Evento de Bipagem
eanInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        const ean = eanInput.value.trim();
        if (ean === "") return;

        const pedido = pedidosMap.get(ean);
        if (!pedido) {
            alert("Produto não encontrado no pedido atual");
            eanInput.value = "";
            return;
        }

        processarEAN(ean);

        eanInput.value = "";
        setTimeout(() => eanInput.focus(), 50);
    }
});

document.addEventListener('DOMContentLoaded', initTabela);