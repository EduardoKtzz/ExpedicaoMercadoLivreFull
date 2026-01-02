// src/modules/users/repository.ts
// importações do projeto
import { supabase } from '../../config/supabase.js'

// enuns
export type UserRole = 'ADMIN' | 'OPERADOR' | 'VISUALIZADOR' // alinhar com o enum role_enum do banco

// tipo de dados das variaveis
export type User = {
    id: number
    nome: string
    email: string
    senha_hash: string
    ativo: boolean | null
    criado_em: string | null
    setor: string | null
    desativado_em: string | null
    setorUserId: number | null
    role: UserRole | null
}

// POST - criação de usuarios no banco de dados
export async function createUsers(input: {nome: string, email: string, senha_hash: string, role?: UserRole}) {

    // inserindo um novo usuario no banco de dados
    const {data, error} = await supabase.from('users').insert({
        nome: input.nome,
        email:input.email,
        senha_hash:input.senha_hash,
        role: input.role ?? 'OPERADOR',
        ativo: true
    }).select().single()

    // tratamento de erros
    if (error) {
        throw new Error (`Erro ao criar usuário: ${error.message}`)
    }

    // retorno dos dados
    return data
    
}

// GET - Buscar usuário por e-mail (login)
export async function findUserByEmail(email: string): Promise<User | null> {

    // consultando tabela de users para buscar um usuario pelo email dele
    const {data, error} = await supabase.from('users').select('*').eq('email', email).maybeSingle()

    // email não encontrado
    if (error) {
        throw new Error(`Erro ao buscar usuário por e-mail: ${error.message}`)
    }

    // retorno do usuario
    return data as User | null
}

// GET - Buscar usuário por id (middleware / logs)
export async function findUserById(id: number): Promise<User | null> {

    // consulta na tabela users para buscar um cliente pelo ID dele
    const { data, error } = await supabase.from('users').select('*').eq('id', id).maybeSingle()

    // erro ao buscar usuario
    if (error) {
        throw new Error(`Erro ao buscar usuário por id: ${error.message}`)
    }

    // retorno dos dados
    return data as User | null
}
