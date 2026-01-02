// pegando elementos do HTML e armazenando
const tabelaElement = document.querySelector('#pedidosTable');
const tableBody = tabelaElement.querySelector('tbody');
const template = document.querySelector('#pedidoRowTemplate');

// variaveis globais 
let dataTableInstance = null;

// função para preencher a tabela com todos pedidos
async function todosPedidosTabela() {

  try {

    tableBody.innerHTML = `
        <tr class="loading-row">
            <td colspan="6">
                <div class="spinner"></div>
                <div class="loading-text">Carregando dados dos Pedidos...</div>
            </td>
        </tr>
    `;

    // rota para puxar todos os pedidos
    const response = await fetch('/order/todosPedidos');

    // retorno dos dados tratados do backend
    const data = await response.json();

    // criando lista e SET para remover duplicados
    const pedidosUnicos = [];
    const seenPedidos = new Set()
    
    // lopp para remover pedidos duplicados
    for (const pedido of data) {
      if (!seenPedidos.has(pedido.pedido)) {
        seenPedidos.add(pedido.pedido);
        pedidosUnicos.push(pedido);
      }
    }

    // prepara os nomes de usuário para cada pedido
    const nomesUsuariosMap = {};
    await Promise.all(
      pedidosUnicos.map(async pedido => {
        const nome = await pegarNomeUsuario(pedido.pedido);
        nomesUsuariosMap[pedido.pedido] = nome;
      })
    );

    // Limpa tabela
    tableBody.innerHTML = '';

    // Preenche as linhas da tabela
    pedidosUnicos.forEach(pedido => {
      const clone = template.content.cloneNode(true);

      clone.querySelector('.pedido').textContent = pedido.pedido;
      clone.querySelector('.dataAbertura').textContent = formatarData(pedido.data_criacao);
      clone.querySelector('.SLA').textContent = pedido.SLA ?? '-';

      // logica para definir o status do pedido
      const statusCell = clone.querySelector('.status');
      const statusExibido = statusPedidoParaTabela(pedido.status);
      statusCell.textContent = statusExibido;
      statusCell.classList.add(statusParaClasse(statusExibido));

      // Preenche o usuário que abriu o pedido
      clone.querySelector('.usuario').textContent = nomesUsuariosMap[pedido.pedido];

      // logica para aparecer o botão de ação
      const usuarioLogadoId = Number(localStorage.getItem('userId'));
      const açãoCell = clone.querySelector('.botãoAcao');
      
      if (statusExibido === 'Em andamento') {
          const fasePedido = pedido.fase ?? 'separacao'; // pega do backend
          
          if (pedido.userId !== usuarioLogadoId) {
              // se não for o dono, botão desabilitado
              açãoCell.innerHTML = `<button class ="btn-disable" disabled title ="Você não pode continuar este pedido"">Continuar</button>`;
          } else {
              // se for o dono, botão habilitado
              açãoCell.innerHTML = `<button class="btn-continuar" onclick="continuarPedido('${pedido.pedido}', '${fasePedido}')">Continuar</button>`;
          }
      } else {
          // se o pedido não estiver em andamento, não mostra botão
          açãoCell.textContent = '-';
      }

      tableBody.appendChild(clone);
    });

    // Inicializa DataTable
    if (dataTableInstance) dataTableInstance.destroy();
    dataTableInstance = new simpleDatatables.DataTable(tabelaElement, {
      perPage: 25,
      perPageSelect: [25, 50, 75, 100],
      searchable: true,
      sortable: true,
      fixedHeight: false,
      labels: {
        placeholder: "Pesquisar...",
        perPage: "Pedidos por página",
        noRows: "Nenhum pedido encontrado",
        info: "Mostrando {start}–{end} de {rows}",
        next: "Próximo",
        prev: "Anterior",
        first: "Primeiro",
        last: "Último",
        page: "Página",
        of: "de"
      }
    });

    // tratamento de erros
  } catch (error) {
    console.error('Erro ao carregar pedidos:', error);
  }
}

// formatando a data para exibir no frontend
function formatarData(dataString) {

  const data = new Date(dataString);
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const ano = data.getFullYear();
  const hora = String(data.getHours()).padStart(2, '0');
  const minuto = String(data.getMinutes()).padStart(2, '0');

  return `${dia}/${mes}/${ano} ${hora}:${minuto}`;
}

// formatação para o status dos pedidos, permitindo nome composto
function statusParaClasse(status) {
  return status
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-');
}

// definindo somente 2 status por pedido
function statusPedidoParaTabela(status) {
  return status === 'Fechado' ? 'Fechado' : 'Em andamento';
}

// função para pegar o nome do usuario que fez o pedido
async function pegarNomeUsuario(numeroPedido) {

  try {

    // rota para pegar os dados
    const response = await fetch(`/order/usuarioPedido?pedido=${numeroPedido}`);
    if (!response.ok) throw new Error('Erro ao buscar usuário');

    // retorno dos dados tratados
    const data = await response.json();
    return data.nome ?? '-';

    // tratamento de erro
  } catch (err) {
    console.error(err);
    return '-';
  }
}

// função para conitnuação do pedido, caso esteja em andamento
function continuarPedido(numeroPedido, fase) {

    sessionStorage.setItem('pedidoNumero', numeroPedido);

    if (fase === 'separacao') {
        window.location.href = "/separaçãoDePedidos.html";
    } else if (fase === 'verificacao') {
        window.location.href = "/checkOut.html";
    }
}



// Carrega tabela apenas uma vez
todosPedidosTabela();
