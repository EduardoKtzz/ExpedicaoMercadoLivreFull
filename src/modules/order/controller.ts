// importações do projeto
import type { Request, Response } from 'express';
import { importarPedidos, processarEAN, processarCodigoInternoML} from './service.ts';
import { listarPedidos, listarTodosPedidos, getUsuarioDoPedido} from './repository.ts';

// função para receber o upload do frontend
export async function uploadPedido(req: Request, res: Response) {

  // tratamento de erro caso não tenha os dados
  if (!req.file) return res.status(400).json({error: 'Nenhum arquivo enviado'});
  if (!req.body.numeroPedido) return res.status(400).json({error: 'Número do pedido não enviado'});

  try {

    // definindo as variaveis conforme os dados do frontend
    const caminhoArquivo = req.file.path;
    const numeroPedido = req.body.numeroPedido;

    // pega o Auth do middleware
    const userId = (req as any).user.id;

    // chama função para puxar os dados do pedido importado
    const pedidosImportados = await importarPedidos(caminhoArquivo, numeroPedido, userId);

    // retorno de dados
    res.json(pedidosImportados);

    // tratamento de erros
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// GET - pegar todos os dados de um pedido especifico
export async function getPedidos(req: Request, res: Response) {

  try {

    // definindo o número do pedido
    const { pedido } = req.query;
    
    // tratamento de erro caso o pedido não tenha sido informado
    if (!pedido) {return res.status(400).json({ error: "Pedido não informado" });}

    // chamado função de listarPedidos para passar os dados
    const pedidos = await listarPedidos(String (pedido));

    // retornando dados para o front
    res.json(pedidos);

  // tratramendo de erros
  } 
  catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// GET - pegar todos os pedidos do banco de dados
export async function getTodosPedidos(req: Request, res: Response) {
  try {
    // Se não vier pedido, retorna todos os pedidos
    const pedidos = req.query.pedido
      ? await listarPedidos(String(req.query.pedido))
      : await listarTodosPedidos(); // nova função que retorna todos

    res.json(pedidos);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// GET - filtrar um produto pelo pedido e pelo codigo EAN dele, e depois retornar os dados para o front
export async function processarEANController(req: Request, res: Response) {

  try {

    // definindo as variaveis com o corpo do request e fazendo um tratamento de erros
    const { ean, numeroPedido } = req.body;
    if (!ean || !numeroPedido) return res.status(400).json({ error: "EAN ou Pedido não enviado" });

    // chamando função de processarEAN e salvando os dados na variavel
    const pedido = await processarEAN(ean, numeroPedido);

    // retornando dados
    return res.json(pedido);

    // tratamento de erros
  } catch (error: any) {
    const status = error.message === "Produto não encontrado" ? 404 : 400;
    return res.status(status).json({ error: error.message });
  }

}

// GET - filtrar um produto pelo pedido e pelo codigo interno do ML e depois retornar os dados para o front
export async function processarCodigoInternoMLController(req: Request, res: Response) {

  try {

    // definindo variavel com o request do body e tratamento de erros
    const { codInternoML, numeroPedido } = req.body;
    if (!codInternoML || !numeroPedido) {return res.status(400).json({ error: "Código interno ML ou pedido não enviado" });}

    // chamando função para processar os dados e guardando resultado em uma variavel
    const pedido = await processarCodigoInternoML(codInternoML, numeroPedido);
    if (!pedido.EAN) pedido.EAN = ""; // tratamento de erros

    // retornando os dados
    return res.json(pedido);

    // tratamento de erros
  } catch (error: any) {
    const status = error.message === "Produto não encontrado" ? 404 : 400;
    return res.status(status).json({ error: error.message });
  }
}

// GET - controller pra pegar o usuario que realizou o pedido
export async function getUsuarioPedidoController(req: Request, res: Response) {
  try {
    const { pedido } = req.query;
    if (!pedido) return res.status(400).json({ error: 'Pedido não informado' });

    const usuario = await getUsuarioDoPedido(String(pedido));
    res.json(usuario);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
}




