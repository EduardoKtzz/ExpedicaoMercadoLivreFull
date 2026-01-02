// src/modules/users/service.ts
// importações do projeto
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import {createUsers, findUserByEmail, type User, type UserRole} from './repository.ts'

//JWT processando ENV e tratamento de erro
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) { 
    throw new Error('JWT_SECRET não configurado no .env')
}

// criação de uma senha hash e um novo usuario no banco de dados
export async function registerUser(input: {nome: string, email: string, password: string}) {

    // verifica se já existe e caso exista, da a mensagem de erro
    const userExists = await findUserByEmail(input.email)
    if (userExists) {throw new Error('E-mail já cadastrado')}

    // gera hash da senha
    const senha_hash = await bcrypt.hash(input.password, 10)

    // chama função para criação de usuarios e passando os parametros e definindo o valor do retorno dentro da variavel 'user'
    const user = await createUsers({nome: input.nome,email: input.email, senha_hash})

    // retorno dos dados do novo usuario
    return {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role
    }
}

// autenticamendo usuarios no login
export async function authenticateUser(input: {email: string, password: string}) {

    // chamando função para encontrar usuario por email
    const user = await findUserByEmail(input.email)

    // usuário não existe ou está inativo
    if (!user || user.ativo === false) {
        throw new Error('Usuário ou senha inválidos')
    }

    // compara senha digitada com o hash do banco
    const senhaOk = await bcrypt.compare(input.password, user.senha_hash)

    // tratamento de erro caso a senha esteja errada
    if (!senhaOk) {
        throw new Error('Usuário ou senha inválidos')
    }

    // garante um role válido
    const role: UserRole = (user.role as UserRole) ?? 'OPERADOR'
    const token = jwt.sign ({sub: user.id, role, nome: user.nome},JWT_SECRET!,{expiresIn: '8h'})

    // retorno dos dados
    return {
        user: {...user, role},
        token
    }
}

