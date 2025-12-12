# 🛡️ Stock Guardian Pro

Sistema de gestão de estoque e ordens de serviço desenvolvido para controle de itens e ONUs (equipamentos de rede).

## 📋 Sobre o Projeto

O **Stock Guardian Pro** é uma aplicação web completa para gerenciar:
- ✅ **Estoque de itens** (itens genéricos e ONUs)
- ✅ **Funcionários** (cadastro e gestão)
- ✅ **Ordens de Serviço (OS)** com assinatura digital
- ✅ **Movimentações** de estoque (entrada, saída, devolução)
- ✅ **Histórico** completo de todas as operações
- ✅ **Devoluções** de itens e ONUs

## 🚀 Tecnologias

- **Frontend**: React 19, TypeScript, Vite
- **UI**: shadcn/ui, Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **Runtime**: Bun 1.3.4
- **Roteamento**: React Router DOM
- **Formulários**: React Hook Form + Zod

## 📦 Pré-requisitos

- [Bun](https://bun.sh/docs/installation) 1.3.4 ou superior
- Conta no [Supabase](https://supabase.com)
- Node.js 18+ (caso não use Bun)

## ⚙️ Instalação e Configuração

### 1. Clonar o Repositório

```bash
git clone <seu-repositorio-url>
cd stock-guardian-pro-main
```

### 2. Instalar Dependências

```bash
bun install
```

### 3. Configurar Banco de Dados

⚠️ **IMPORTANTE**: Antes de iniciar a aplicação, você precisa configurar o banco de dados Supabase.

Siga o guia completo em: **[SETUP_DATABASE.md](./SETUP_DATABASE.md)**

**Resumo rápido:**
1. Crie um projeto no Supabase
2. Execute o script SQL em `supabase/migrations/001_initial_schema.sql`
3. Obtenha suas credenciais (URL e anon key)

### 4. Configurar Variáveis de Ambiente

1. Copie o arquivo de exemplo:
```bash
# Windows (PowerShell)
Copy-Item env.example .env

# Linux/Mac
cp env.example .env
```

2. Edite o arquivo `.env` e preencha com suas credenciais do Supabase:

```env
VITE_SUPABASE_URL=https://seu-projeto-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-anon-publica
```

### 5. Iniciar o Servidor de Desenvolvimento

```bash
bun run dev
```

A aplicação estará disponível em `http://localhost:5173`

## 🗄️ Estrutura do Banco de Dados

O banco de dados possui as seguintes tabelas principais:

- **usuarios**: Usuários do sistema (administradores)
- **funcionarios**: Funcionários cadastrados
- **itens**: Itens de estoque genéricos
- **onus**: ONUs (equipamentos específicos)
- **ordens_servico**: Ordens de serviço
- **movimentacoes**: Histórico de movimentações
- **devolucoes**: Devoluções de itens/ONUs

Para mais detalhes, consulte o arquivo `supabase/migrations/001_initial_schema.sql` ou o guia [SETUP_DATABASE.md](./SETUP_DATABASE.md).

## 📁 Estrutura do Projeto

```
stock-guardian-pro-main/
├── src/
│   ├── components/       # Componentes React
│   │   ├── ui/          # Componentes shadcn/ui
│   │   ├── Layout.tsx
│   │   └── ...
│   ├── contexts/        # Contextos React (Auth, etc)
│   ├── hooks/           # Custom hooks
│   ├── integrations/    # Integrações (Supabase)
│   │   └── supabase/
│   │       ├── client.ts
│   │       └── types.ts
│   ├── pages/           # Páginas da aplicação
│   │   ├── Login.tsx
│   │   ├── Estoque.tsx
│   │   ├── Funcionarios.tsx
│   │   ├── ONUs.tsx
│   │   ├── CriarOS.tsx
│   │   └── ...
│   └── lib/             # Utilitários
├── supabase/
│   ├── migrations/      # Scripts SQL de migração
│   └── config.toml      # Configuração do Supabase
├── public/              # Arquivos estáticos
└── ...
```

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
bun run dev              # Inicia servidor de desenvolvimento

# Build
bun run build            # Build para produção
bun run build:dev        # Build em modo desenvolvimento

# Lint
bun run lint             # Executa o ESLint

# Preview
bun run preview          # Preview do build de produção
```

## 🔒 Segurança

### Variáveis de Ambiente

⚠️ **NUNCA** commite o arquivo `.env` no Git. Ele já está no `.gitignore`.

### Autenticação

O sistema usa autenticação customizada através da tabela `usuarios`. Para produção, considere:
- Implementar hash seguro de senhas (bcrypt/Argon2)
- Adicionar recuperação de senha
- Refinar políticas RLS no Supabase

## 🚢 Deploy

### Preparação para Produção

1. Configure as variáveis de ambiente no seu provedor de hospedagem
2. Execute o build: `bun run build`
3. Os arquivos estarão na pasta `dist/`

### Opções de Deploy

- **Vercel**: Conecte o repositório e configure as variáveis de ambiente
- **Netlify**: Similar ao Vercel
- **Supabase Hosting**: Integração nativa com Supabase
- **Qualquer servidor**: Sirva os arquivos da pasta `dist/` com um servidor web

## 📝 Notas Importantes

- O banco de dados está configurado para uma conta Supabase específica
- Para usar outra conta, siga as instruções em [SETUP_DATABASE.md](./SETUP_DATABASE.md)

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é privado. Todos os direitos reservados.

## 🆘 Suporte

Para problemas ou dúvidas:
- Consulte o guia [SETUP_DATABASE.md](./SETUP_DATABASE.md) para questões de banco de dados
- Abra uma issue no repositório
- Consulte a [documentação do Supabase](https://supabase.com/docs)

---

**Desenvolvido com ❤️ usando React, TypeScript e Supabase**
