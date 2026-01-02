// importações no projeto
import {Router} from 'express'
import {ensureAuth} from '../../shared/middlewares/ensureAuth.ts'
import {loginController, verificarUsuario, registerController} from './controller.ts'

// definindo variavel de router dos users
const routerUsers = Router()

// rota para receber o login do frontend
routerUsers.post('/login', loginController)

// rota para receber o login do frontend
routerUsers.post('/register', registerController)

// rota para verificar o login
routerUsers.get('/me', ensureAuth, verificarUsuario)

// export
export default routerUsers

