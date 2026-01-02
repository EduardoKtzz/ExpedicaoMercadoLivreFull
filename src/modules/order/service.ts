// importações do projeto
import {lerArquivoZPL, coletaDadosEtiqueta} from './parsers.ts'
import {fecharPedidoSeCompleto, inserirPedidos, preencherEANs, getPedidoByEAN, updatePedidoSeparada, updatePedidoVerificado, getPedidoByCodInternoML, atualizarFasePedido} from './repository.ts'
import {ProdutoFinalizadoError, ProdutoNaoEncontradoError} from '../../shared/errors.ts';

// função responsavel por coordenar o processo de separação, e formatação de pedidos
export async function importarPedidos(caminhoArquivo: string, numeroPedido: string, userId: number) {

    // pegando o caminho do arquivo que foi passado no frontend
    const zplData = lerArquivoZPL(caminhoArquivo);

    // converter ZPL em dados
    // filtra apenas pedidos válidos e adiciona status "Em andamento"
        const pedidos = coletaDadosEtiqueta(zplData)
        .filter(
            (p): p is {
                nomeProduto: string;
                codInternoML: string;
                GS: string;
                quantidadeTotal: number;
                ZPLfull: string;
            } => p.nomeProduto !== null && p.GS !== null
        )
        .map(p => {
            // extrai quantidade e ajusta ZPL
            const { quantidadeTotal, zplAjustado } = separarQuantidadeZPL(p.ZPLfull);

            return {
                ...p,
                quantidadeTotal,       // quantidade total original da etiqueta
                ZPLfull: zplAjustado, // ZPL ajustado para imprimir apenas 1
                status: "Em andamento" as const,
                fase: "separacao" as const,
                pedido: numeroPedido,
                userId
            };
        });

    // salva os pedidos no banco de dados
    await inserirPedidos(pedidos);

    // atualiza automaticamente os EANs
    await preencherEANs();

    // retorno da função
    return pedidos;

}

// função para extrair a quantidade do ZPL e ajustar para 1
function separarQuantidadeZPL(zpl: string): { quantidadeTotal: number; zplAjustado: string } {
    const match = zpl.match(/\^PQ(\d+)/);
    const quantidadeTotal = match ? parseInt(match[1], 10) : 1;
    // substitui qualquer ^PQ<number> por ^PQ1
    const zplAjustado = zpl.replace(/\^PQ\d+,[^\^]*/g, '^PQ1,0,1,Y');
    return { quantidadeTotal, zplAjustado };
}

// função para receber o EAN, limpar ele e consultar no banco de dados, incrementar +1 no produtoSeparado e muda o status do pedido
export async function processarEAN(ean: string, numeroPedido: string) {

    // limpando String, removendo caracteres e espaços
    const cleanEAN = String(ean).trim();

    // chamando função para puxar o produto com o EAN dele, e tratando erro
    const pedido = await getPedidoByEAN(cleanEAN, numeroPedido);
    if (!pedido) throw new ProdutoNaoEncontradoError("Produto não encontrado");

    //quantidadeSeparadaAtual pode vir null
    const quantidadeSeparadaAtual = pedido.quantidadeSeparada ?? 0

    // verificando se a quantidade separa é maior que a quantidade total
    if (quantidadeSeparadaAtual >= pedido.quantidadeTotal) {
        throw new ProdutoFinalizadoError("Produto já finalizado, não é possível gerar mais etiquetas.");
    }

    // adicionando +1 na quantidade separada do produtoe mudando status
    const novaQtd = pedido.quantidadeSeparada + 1;
    const status = novaQtd >= pedido.quantidadeTotal ? "Finalizado" : "Em andamento";

    // atualizando no banco de dados
    const atualizado = await updatePedidoSeparada(cleanEAN, novaQtd, status, numeroPedido);
    await atualizarFasePedido(numeroPedido);

    // retorna os dados + ZPL
    return { ...atualizado, ZPL: pedido.ZPLfull };
}

// função para receber o GS, limpar ele e consultar no banco de dados, incrementar +1 no produtoVerificado e muda o status do pedido
export async function processarCodigoInternoML(codInternoML: string, numeroPedido: string) {

    // limpando String e removendo espaços
    const cleancodInternoML = String(codInternoML).trim();
    const pedido = await getPedidoByCodInternoML(cleancodInternoML, numeroPedido);

    // tratamento de erro
    if (!pedido) throw new ProdutoNaoEncontradoError("Produto não encontrado");

    //quantidadeVerificadaAtual pode vir null
    const quantidadeVerificadaAtual = pedido.quantidadeVerificada ?? 0

    // verifica se a quantidade verificada é maior que a quantidade total
    if (quantidadeVerificadaAtual >= pedido.quantidadeTotal) {
        throw new ProdutoFinalizadoError("Produto finalizado, continue com o próximo!");
    }

    // incrementando +1 na coluna de quantidadeVerificada e mudando o status do chamado
    const novaQtd = pedido.quantidadeVerificada + 1;
    const status = novaQtd >= pedido.quantidadeTotal ? "Verificado" : "Sem Verificação";

    // atualizando dados no Supabase
    const atualizado = await updatePedidoVerificado(cleancodInternoML, novaQtd, status, numeroPedido);

    // depois de atualizar, verifica o status de todos os produtos
    await fecharPedidoSeCompleto(numeroPedido);

    // retorno dos dados atualizados
    return atualizado;
}








