# 🗄️ Guia de Configuração do Banco de Dados

Este guia explica como configurar o banco de dados Supabase para o projeto **Stock Guardian Pro**.

## 📋 Pré-requisitos

- Conta no [Supabase](https://supabase.com)
- Um projeto Supabase criado
- Acesso ao dashboard do Supabase

## 🚀 Passo a Passo

### 1. Criar um Novo Projeto no Supabase

1. Acesse [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Faça login na sua conta
3. Clique em **"New Project"**
4. Preencha os dados:
   - **Name**: Nome do seu projeto (ex: `stock-guardian-pro`)
   - **Database Password**: Anote essa senha em local seguro
   - **Region**: Escolha a região mais próxima
5. Aguarde a criação do projeto (pode levar alguns minutos)

### 2. Obter as Credenciais do Projeto

1. No dashboard do projeto, vá em **Settings** (⚙️) → **API**
2. Você encontrará:
   - **Project URL**: URL do seu projeto (ex: `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon/public key**: Chave pública anônima
3. **Anote essas informações** - você precisará delas no próximo passo

### 3. Executar o Script SQL

Existem duas formas de executar o script SQL:

#### Opção A: Via SQL Editor do Supabase (Recomendado)

1. No dashboard do Supabase, vá em **SQL Editor** no menu lateral
2. Clique em **"New Query"**
3. Abra o arquivo `supabase/migrations/001_initial_schema.sql`
4. Copie TODO o conteúdo do arquivo
5. Cole no editor SQL do Supabase
6. Clique em **"Run"** ou pressione `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)
7. Aguarde a execução (deve aparecer "Success" no resultado)

#### Opção B: Via Supabase CLI (Avançado)

Se você tem o Supabase CLI instalado:

```bash
# Instalar Supabase CLI (se ainda não tiver)
npm install -g supabase

# Login no Supabase
supabase login

# Linkar o projeto local ao remoto
supabase link --project-ref seu-project-ref

# Executar a migration
supabase db push
```

### 4. Configurar Variáveis de Ambiente

1. Copie o arquivo `env.example` para `.env`:

```bash
# Windows (PowerShell)
Copy-Item env.example .env

# Linux/Mac
cp env.example .env
```

2. Abra o arquivo `.env` e preencha com suas credenciais:

```env
VITE_SUPABASE_URL=https://seu-projeto-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-anon-publica-aqui
```

**⚠️ IMPORTANTE**: Nunca commite o arquivo `.env` no Git! Ele já está no `.gitignore`.

### 5. Verificar a Instalação

1. No SQL Editor do Supabase, execute:

```sql
-- Verificar se as tabelas foram criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

Você deve ver todas as tabelas listadas:
- devolucao_itens
- devolucao_onus
- devolucoes
- funcionarios
- itens
- movimentacoes
- onu_historico
- onus
- ordens_servico
- os_itens
- os_onus
- usuarios

2. Verificar os tipos enum:

```sql
SELECT typname 
FROM pg_type 
WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND typtype = 'e';
```

Você deve ver:
- movimento_tipo
- onu_status
- os_status

### 6. Criar Usuário Administrador Inicial

Você precisará criar usuários através da aplicação, mas pode criar um manualmente para teste:

```sql
-- ⚠️ ATENÇÃO: Este é apenas um exemplo. Use uma senha em hash real!
-- Em produção, use bcrypt ou outro método seguro de hash
INSERT INTO public.usuarios (username, password_hash, nome, ativo) 
VALUES (
  'admin', 
  'hash_da_senha_aqui', -- Substitua por um hash real da senha
  'Administrador',
  true
);
```

**⚠️ NOTA**: O sistema usa autenticação customizada. Verifique como a senha é hasheada no código da aplicação antes de inserir usuários manualmente.

## 🔄 Migrando de Outra Conta Supabase

Se você já tem dados em outra conta e quer migrar:

### Exportar Dados da Conta Antiga

1. No projeto antigo, vá em **SQL Editor**
2. Execute para exportar cada tabela:

```sql
-- Exemplo para a tabela funcionarios
COPY funcionarios TO STDOUT WITH CSV HEADER;
```

Ou use a ferramenta de backup do Supabase:
1. Vá em **Settings** → **Database** → **Backups**
2. Faça um backup completo ou exporte tabelas específicas

### Importar Dados na Nova Conta

1. Execute o script `001_initial_schema.sql` primeiro (cria a estrutura)
2. Importe os dados usando `COPY` ou através da interface do Supabase

## 🔒 Segurança

### Row Level Security (RLS)

O banco está configurado com RLS habilitado, mas com políticas permissivas (permite tudo). Isso porque o sistema usa autenticação customizada através da tabela `usuarios`.

**Para produção**, considere:
- Refinar as políticas RLS baseadas nos usuários logados
- Implementar autenticação mais robusta (Supabase Auth ou JWT)
- Adicionar validações e triggers para integridade dos dados

### Senhas

⚠️ **ATENÇÃO**: O sistema atual armazena senhas como hash simples. Em produção, você deve:
- Usar bcrypt ou Argon2 para hash de senhas
- Implementar políticas de senha forte
- Adicionar recuperação de senha

## 📊 Estrutura do Banco de Dados

### Tabelas Principais

- **usuarios**: Usuários do sistema (administradores)
- **funcionarios**: Funcionários que recebem itens/ONUs
- **itens**: Itens de estoque genéricos
- **onus**: ONUs (equipamentos específicos)
- **ordens_servico**: Ordens de serviço

### Tabelas de Relacionamento

- **os_itens**: Itens associados a uma OS
- **os_onus**: ONUs associadas a uma OS
- **devolucao_itens**: Itens devolvidos
- **devolucao_onus**: ONUs devolvidas

### Tabelas de Histórico

- **movimentacoes**: Histórico de movimentações do estoque
- **onu_historico**: Histórico de mudanças de status de ONUs

## 🐛 Troubleshooting

### Erro: "relation already exists" ou "type already exists"

**Solução Rápida**: Use o script idempotente `001_initial_schema_clean.sql` que verifica se os objetos existem antes de criar.

**Ou**, se o erro persistir:

1. **Opção 1 - Usar script limpo**: Execute `supabase/migrations/001_initial_schema_clean.sql` ao invés do script original. Este script é idempotente e pode ser executado múltiplas vezes sem erros.

2. **Opção 2 - Limpar tudo e recomeçar** (⚠️ CUIDADO: Isso apaga TODOS os dados!):
```sql
-- CUIDADO: Isso apaga TODOS os dados!
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

Depois execute o script `001_initial_schema.sql` novamente.

### Erro: "permission denied"
Certifique-se de que está executando como superuser ou com permissões adequadas. No Supabase Dashboard, você já tem as permissões necessárias.

### Erro de conexão no código
1. Verifique se as variáveis de ambiente estão corretas no `.env`
2. Verifique se o arquivo `.env` está na raiz do projeto
3. Reinicie o servidor de desenvolvimento após alterar `.env`

## 📝 Próximos Passos

Após configurar o banco:
1. ✅ Configure as variáveis de ambiente
2. ✅ Execute o script SQL
3. ✅ Crie usuários iniciais
4. ✅ Inicie a aplicação: `bun run dev`
5. ✅ Teste o login e funcionalidades básicas

## 📚 Recursos Adicionais

- [Documentação do Supabase](https://supabase.com/docs)
- [SQL Editor Guide](https://supabase.com/docs/guides/database/tables)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

**Precisa de ajuda?** Abra uma issue no repositório ou consulte a documentação do Supabase.


