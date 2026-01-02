// importações no projeto
import express from 'express'
import path from 'path'
import {fileURLToPath} from 'url'
import cookieParser from 'cookie-parser'
import routerOrder from './modules/order/routes.ts'
import routerUsers from './modules/users/routes.ts'
import routerCertificate from './modules/certificate/routes.ts';


// npx tsx src/server.ts 

// configurações de caminho do servidor
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// criando um servidor Express e definindo a porta que ele vai rodar
const app = express();
const port = 3000;

// Habilitar JSON
app.use(express.json());

// parse cookie pra objeto JS
app.use(cookieParser());

// codigo para exibir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '../public')));

// rotas relacionadas a pedidos
app.use('/order', routerOrder);

// rotas relacionadas a usuarios
app.use('/users', routerUsers)

// rota para QZ Tray
app.use('/', routerCertificate);

// arquivos de certificados
app.use('/certs', express.static('C:/qz-certs'));

// rodando o servidor
app.listen(port, () => {
    console.log(`Servidor em localhost:${port}`)
})