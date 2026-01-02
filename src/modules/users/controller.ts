// importações do pedido
import { Request, Response } from 'express';
import { authenticateUser, registerUser } from './service.ts';

//  verificar os dados e fazer as validações de cadastro de usuario
export async function registerController(req: Request, res: Response) {

    try {
        // pegando dados do body
        const { nome, email, password } = req.body

        // dados obrigatorios faltando - erro 400
        if (!nome || !email || !password) {
            return res.status(400).json({ error: 'Dados obrigatórios faltando' })
        }

        // chamando função para registrar um novo usuario
        const user = await registerUser({ nome, email, password })

        // retorno em caso de sucesso, sucesso 201
        return res.status(201).json(user)

    } catch (err: any) {

        // retorno em cas ode erro, erro 400
        return res.status(400).json({ error: err.message })
    }
}

// verificar os dados e fazer as validações de login de usuario
export async function loginController(req: Request, res: Response) {

    try {
        // pegando dados do body
        const { email, password } = req.body;

        // autenticação, chamando função para realizar a autenticação
        const { user, token } = await authenticateUser({ email, password });

        // grava o token em cookie httpOnly
        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 8 * 60 * 60 * 1000 // 8h
        });

        // retorno dos dados
        return res.json({
            id: user.id,
            nome: user.nome,
            email: user.email,
            role: user.role
        });

      // tratamento de erro  
    } catch (err: any) {
        return res.status(401).json({ error: err.message });
    }
}

// função para verificar e saber quem é o user logado
export function verificarUsuario(req: Request, res: Response) {
    const user = (req as any).user;
    return res.json(user);
}
