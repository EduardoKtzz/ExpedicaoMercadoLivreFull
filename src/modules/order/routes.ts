import {Router} from 'express';
import multer from 'multer';
import path, {dirname} from 'path';
import {fileURLToPath} from 'url';
import {uploadPedido, getPedidos, processarEANController, processarCodigoInternoMLController, getTodosPedidos, getUsuarioPedidoController} from './controller.ts';
import {ensureAuth} from '../../shared/middlewares/ensureAuth.ts';

// Configuração de paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuração Multer para receber arquivos
const upload = multer({ dest: path.join(__dirname, '../../../uploads') });

// definindo router
const routerOrder = Router();

// rota para receber o arquivo do frontend
routerOrder.post('/upload', ensureAuth, upload.single('pedido'), uploadPedido);

// rota para retornar todos os dados de um pedido
routerOrder.get('/pedidos', getPedidos);

// rota para retornar todos os pedidos
routerOrder.get('/todosPedidos', getTodosPedidos);

// rota para atualizar os pedidos separados pelo EAN
routerOrder.post('/processar-ean', processarEANController);

// rota para atualizar os pedidos separados pelo código interno ML
routerOrder.post('/processar-cod-interno-ml', processarCodigoInternoMLController);

// rota para pegar o usuário de um pedido específico
routerOrder.get('/usuarioPedido', getUsuarioPedidoController);

// export
export default routerOrder;
