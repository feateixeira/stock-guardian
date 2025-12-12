# ⚡ Guia Rápido de Início

Guia rápido para configurar o projeto em 5 minutos.

## 🚀 Setup Rápido

### 1. Instalar Dependências
```bash
bun install
```

### 2. Configurar Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Copie as credenciais:
   - Vá em **Settings** → **API**
   - Copie **Project URL** e **anon/public key**

### 3. Executar SQL

1. No Supabase Dashboard, vá em **SQL Editor**
2. Abra o arquivo: `supabase/migrations/001_initial_schema.sql`
3. Copie TODO o conteúdo
4. Cole no SQL Editor e clique em **Run**

### 4. Configurar .env

```bash
# Copiar arquivo de exemplo
cp env.example .env
```

Edite `.env`:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-anon
```

### 5. Iniciar Aplicação

```bash
bun run dev
```

Acesse: http://localhost:5173

## ✅ Checklist

- [ ] Dependências instaladas (`bun install`)
- [ ] Projeto Supabase criado
- [ ] Script SQL executado com sucesso
- [ ] Arquivo `.env` configurado
- [ ] Aplicação iniciada sem erros

## 📚 Documentação Completa

Para instruções detalhadas, consulte:
- **[SETUP_DATABASE.md](./SETUP_DATABASE.md)** - Guia completo do banco de dados
- **[README.md](./README.md)** - Documentação completa do projeto

## 🆘 Problemas Comuns

**Erro de conexão?**
- Verifique se `.env` está na raiz do projeto
- Confirme que as credenciais estão corretas
- Reinicie o servidor após alterar `.env`

**Erro no SQL?**
- Verifique se todas as tabelas foram criadas
- Veja a seção Troubleshooting em SETUP_DATABASE.md

---

**Pronto!** Agora você pode começar a usar o sistema. 🎉


