# 🚀 Guia de Deploy na Vercel

Este guia explica como configurar e fazer deploy do Stock Guardian Pro na Vercel.

## 📋 Pré-requisitos

- Projeto já configurado localmente
- Conta na [Vercel](https://vercel.com)
- Repositório no GitHub conectado à Vercel

## ⚙️ Configuração das Variáveis de Ambiente

### Passo 1: Acessar Configurações do Projeto

1. Acesse o [Dashboard da Vercel](https://vercel.com/dashboard)
2. Clique no seu projeto **stock-guardian-pro**
3. Vá em **Settings** (Configurações)
4. No menu lateral, clique em **Environment Variables** (Variáveis de Ambiente)

### Passo 2: Adicionar Variáveis

Você precisa adicionar **2 variáveis de ambiente**:

#### 1. `VITE_SUPABASE_URL`
- **Nome**: `VITE_SUPABASE_URL`
- **Valor**: A URL do seu projeto Supabase
  - Formato: `https://xxxxxxxxxxxxx.supabase.co`
  - Você encontra isso no Supabase Dashboard → Settings → API → Project URL

#### 2. `VITE_SUPABASE_PUBLISHABLE_KEY`
- **Nome**: `VITE_SUPABASE_PUBLISHABLE_KEY`
- **Valor**: A chave pública (anon key) do Supabase
  - Você encontra isso no Supabase Dashboard → Settings → API → Project API keys → `anon` `public`

### Passo 3: Configurar Ambientes

⚠️ **IMPORTANTE**: Selecione os ambientes onde essas variáveis estarão disponíveis:

- ✅ **Production** (Produção)
- ✅ **Preview** (Preview - opcional, mas recomendado)
- ✅ **Development** (Desenvolvimento - opcional)

### Passo 4: Salvar e Reimplantar

1. Clique em **Save** (Salvar) para cada variável
2. Vá em **Deployments** (Implantações)
3. Clique nos três pontos (...) do último deployment
4. Selecione **Redeploy** (Reimplantar)
5. Ou faça um novo commit e push para o GitHub

## 🔍 Como Obter as Credenciais do Supabase

1. Acesse [supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **Settings** (⚙️ no menu lateral)
4. Clique em **API**
5. Você verá:
   - **Project URL**: Use para `VITE_SUPABASE_URL`
   - **Project API keys**: 
     - Seção **anon** `public` → Use para `VITE_SUPABASE_PUBLISHABLE_KEY`

## ✅ Verificação

Após configurar as variáveis e reimplantar:

1. Acesse seu site na Vercel
2. Abra o Console do navegador (F12)
3. Não deve aparecer o erro `supabaseUrl is required`
4. A aplicação deve carregar normalmente

## 🐛 Troubleshooting

### Erro: "supabaseUrl is required"

**Causa**: Variáveis de ambiente não configuradas ou nomes incorretos.

**Solução**:
1. Verifique se os nomes das variáveis estão **exatamente** como:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
2. Certifique-se de que selecionou os ambientes corretos
3. Faça um **Redeploy** após adicionar as variáveis

### Erro: "Invalid API key"

**Causa**: Chave do Supabase incorreta.

**Solução**:
1. Verifique se copiou a chave `anon` `public` completa
2. Não copie a chave `service_role` (ela é secreta e não deve ser usada no frontend)
3. Verifique se não há espaços extras no início ou fim da chave

### Variáveis não aparecem após o deploy

**Causa**: Variáveis foram adicionadas após o build.

**Solução**:
1. Sempre faça um **Redeploy** após adicionar/modificar variáveis
2. Ou faça um novo commit e push (isso triggerará um novo deploy automaticamente)

## 📝 Notas Importantes

- ⚠️ **Nunca** commite o arquivo `.env` no Git (ele já está no `.gitignore`)
- ✅ Use sempre as variáveis de ambiente na Vercel para produção
- 🔒 As chaves são seguras na Vercel e não aparecem no código compilado
- 🔄 Qualquer alteração nas variáveis requer um novo deploy

## 🎯 Checklist de Deploy

- [ ] Repositório conectado à Vercel
- [ ] Variável `VITE_SUPABASE_URL` configurada
- [ ] Variável `VITE_SUPABASE_PUBLISHABLE_KEY` configurada
- [ ] Variáveis configuradas para Production (e Preview, se necessário)
- [ ] Deploy realizado com sucesso
- [ ] Site funcionando sem erros no console
- [ ] Login funcionando corretamente

---

**Pronto!** Seu projeto está configurado na Vercel. 🎉

