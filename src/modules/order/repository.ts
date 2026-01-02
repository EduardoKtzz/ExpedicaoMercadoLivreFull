// importações do projeto
import {supabase} from '../../config/supabase.js'

// definindo o tipo dos dados das variaveis
export type Pedido = {
    GS: string;
    nomeProduto: string;
    codInternoML: string;
    ZPLfull: string;
    quantidadeTotal: number;
    userId?: number;
    usuario_nome?: string;
    quantidadeSeparada?: number | null;
    EAN?: string | null;
    status?: string | null;
    pedido?: string | null;
}

// INSERT - função para insert de uma nova linha no banco de dados, na tabela "pedidoMLFULL"
export async function inserirPedidos(pedidos: Pedido[]) {

    // insert no supabase
    const {error} = await supabase.from('pedidoMLFULL').insert(pedidos)

    // tratamento de erro
    if (error) {
        throw new Error(`Erro ao inserir pedidos: ${error.message}`)
    }
}

// GET - função que faz uma consulta na tabela e retorna os dados da etiqueta de um pedido
export async function listarPedidos(pedido: string) {

    // consulta no banco de dados para retornar os pedidos que foram criados
    const {data, error} = await supabase.from('pedidoMLFULL').select('*').eq('pedido', pedido);
    if (error) throw new Error(error.message);

    // retorno dos dados
    return data;
}

// GET - função que faz uma consulta na tabela e retorna todos os pedidos e seus dados
export async function listarTodosPedidos() {

    // consulta no banco de dados para retornar os pedidos que foram criados
    const {data, error} = await supabase.from('pedidoMLFULL').select('*')
    if (error) throw new Error(error.message);

    // retorno dos dados
    return data;
}

// GET - função que faz uma consulta nos pedidos pelo EAN
export async function getPedidoByEAN(ean: string, numeroPedido: string) {

    // limpando String e removendo espaços
    const cleanEAN = String(ean).trim();
    const cleanPedido = String(numeroPedido).trim();

    // consultando banco de dados Supabase com dois filtros, um de EAN e outro do pedido atual
    const {data, error} = await supabase.from('pedidoMLFULL').select('*').eq('EAN', cleanEAN).eq('pedido', cleanPedido)

    // tratamento de erro
    if (error) throw error;
    if (!data || data.length === 0) return null;

    // retorno dos dados, pega o primeiro da lista de array
    return data[0];
}

// GET - função que faz uma consulta nos pedidos pelo código interno do Mercado Livre
export async function getPedidoByCodInternoML(codInternoML: string, numeroPedido: string) {

    // limpando as Strings, para remover espaços
    const cleanCodInternoML = String(codInternoML).trim();
    const cleanPedido = String(numeroPedido).trim();

    // consultando banco de dados Supabase com dois filtros:
    // código interno ML + pedido atual
    const { data, error } = await supabase.from('pedidoMLFULL').select('*').eq('codInternoML', cleanCodInternoML).eq('pedido', cleanPedido);

    // tratamento de erro
    if (error) throw error;
    if (!data || data.length === 0) return null;

    // retorna o primeiro registro encontrado
    return data[0];
}

// UPDATE - função para aumentar +1 no número de pedidos separados
export async function updatePedidoSeparada(ean: string, quantidadeSeparada: number, status: "Em andamento" | "Finalizado", numeroPedido: string) {

    // limpando as Strings, para remover espaços
    const cleanEAN = String(ean).trim();
    const cleanPedido = String(numeroPedido).trim();

    // fazendo update na coluna de quantidadeSeparada e status, e filtrando pelo pedido atual + EAN
    const {data, error} = await supabase.from('pedidoMLFULL').update({quantidadeSeparada, status}).eq('EAN', cleanEAN).eq('pedido', cleanPedido).select();
    if (error) throw error;

    // retorna o primeiro item atualizado (padrão)
    return data && data.length > 0 ? data[0] : null;
}

// GET e UPDADE - atualizando a coluna de fase no banco de dados
export async function atualizarFasePedido(numeroPedido: string) {

    // pega todos os itens do pedido e faz o tratamento de erros
    const { data, error } = await supabase.from('pedidoMLFULL').select('quantidadeSeparada, quantidadeTotal, fase').eq('pedido', numeroPedido);
    if (error) throw error;

    // verifica se todos itens da separação estão finalizados
    const todosSeparados = data.every(item => item.quantidadeSeparada >= item.quantidadeTotal);

    // se todos já estiverem separados: 
    if (todosSeparados) {
        // atualiza a fase para "verificacao"
        const { error: updateError } = await supabase.from('pedidoMLFULL').update({fase: 'verificacao'}).eq('pedido', numeroPedido);
        if (updateError) throw updateError;
    }
}

// UPDATE - função para aumentar +1 no número de pedidos verificados
export async function updatePedidoVerificado(codInternoML: string, quantidadeVerificada: number, status: "Sem Verificação" | "Verificado", numeroPedido: string) {

    // limpando String, removendo espaços
    const cleanCodInternoML = String(codInternoML).trim();
    const cleanPedido = String(numeroPedido).trim();

    // consultando o banco de dados e dando um UPDATE na coluna de quantidadeVerificada e status, utilizando dois filtros, de codigo interno do ML e de pedido atual
    const {data, error} = await supabase.from('pedidoMLFULL').update({quantidadeVerificada, status}).eq('codInternoML', cleanCodInternoML).eq('pedido', cleanPedido).select();
    if (error) throw error;

    // retorna o primeiro item atualizado (padrão)
    return data && data.length > 0 ? data[0] : null;
}

// GET e UPDATE - a função verifica se todos os produtos de um pedido foram finalizados com sucesso, caso sim, ele fecha o pedido
export async function fecharPedidoSeCompleto( pedido: string) {

    // consulta no banco de dados e verifica a coluna de status com base no pedido
    const {data, error} = await supabase.from('pedidoMLFULL').select('status, data_fechamento').eq('pedido', pedido); 
    if (error) throw new Error (error.message); 

    // Se já estiver fechado, não faz nada
    const jaFechado = data.every(item => item.status === 'Fechado');
    if (jaFechado) return true;

    // verificando o status dos produtos
    const todosFinalizados = data.every(item => item.status === "Verificado")
    if (!todosFinalizados) return false;

    // se todos estiverem finalizados, ele fecha o pedido
    if (todosFinalizados) {

        // pegando a data e hora atual 
        const dataFechamento = new Date();

        // fazendo um update na coluna de status e data_fechamento com o filtro de pedido
        const { data: updatedData, error: updateError } = await supabase.from('pedidoMLFULL').update({ status: 'Fechado', data_fechamento: dataFechamento.toISOString }).eq('pedido', pedido).select();
        if (updateError) throw new Error(updateError.message);

        // calcular o SLA e atualiza no banco de dados
        for (const item of updatedData) {
            const dataCriacao = new Date(item.data_criacao as string);
            const diffMs = dataFechamento.getTime() - dataCriacao.getTime();

            const horas = Math.floor(diffMs / (1000 * 60 * 60));
            const minutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            const segundos = Math.floor((diffMs % (1000 * 60)) / 1000);

            const SLA = `${horas}h ${minutos}m ${segundos}s`;

            // fazendo um update na coluna de SLA
            const { error: slaError } = await supabase.from('pedidoMLFULL').update({SLA}).eq('codInternoML', item.codInternoML).eq('pedido', pedido);
            if (slaError) throw new Error(slaError.message);
        }
    }
 
    // retorno dos dados
    return todosFinalizados;

};


// GET - função para pegar o nome do usuário de um pedido, ele faz consulta em duas tabelas
export async function getUsuarioDoPedido(numeroPedido: string) {

    // consulta no banco de dados e pega o ID do usuario
    const {data: pedido, error: pedidoError} = await supabase.from('pedidoMLFULL').select('userId').eq('pedido', numeroPedido).limit(1).single();

    // tratamento de erros
    if (pedidoError) throw pedidoError;
    if (!pedido) return { userId: null, nome: '-' };

    // consulta a tabela de users e filtra pelo ID do usuarios que pegamos na ultima consulta
    const {data: user, error: userError} = await supabase.from('users').select('nome').eq('id', pedido.userId).single();

    // tratamento de erro
    if (userError || !user) return { userId: pedido.userId, nome: '-' };

    // retorno dos dados
    return {userId: pedido.userId, nome: user.nome};
}

// função que chama a função do supabase e atualiza a coluna de EAN
export async function preencherEANs() {
    const {data, error} = await supabase.rpc('atualizar_ean');

    if (error) throw new Error(`Erro ao atualizar EAN: ${error.message}`);

    return data;
}
