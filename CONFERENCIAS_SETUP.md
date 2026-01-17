# Guia de Instalação e Teste - Sistema de Conferências

## 1. Executar a Migration no Supabase

### Opção A: Via Supabase Dashboard (Recomendado)

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. No menu lateral, clique em **SQL Editor**
4. Clique em **New Query**
5. Copie todo o conteúdo do arquivo `supabase/migrations/006_conferencias_schema.sql`
6. Cole no editor SQL
7. Clique em **Run** (ou pressione Ctrl+Enter)
8. Verifique se aparece a mensagem de sucesso

### Opção B: Via Supabase CLI

```bash
# Se você tem o Supabase CLI instalado
supabase db push
```

## 2. Verificar a Instalação

Execute as seguintes queries no SQL Editor para confirmar que as tabelas foram criadas:

```sql
-- Verificar tabelas criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('conferencias', 'conferencia_itens', 'conferencia_onus');

-- Verificar ENUMs criados
SELECT typname 
FROM pg_type 
WHERE typname IN ('conferencia_item_status', 'conferencia_onu_status');
```

Você deve ver 3 tabelas e 2 tipos enum listados.

## 3. Iniciar o Servidor de Desenvolvimento

```bash
# No diretório do projeto
bun run dev
```

Ou se estiver usando npm:

```bash
npm run dev
```

## 4. Testar o Sistema

### 4.1. Acessar a Página de Conferências

1. Faça login no sistema
2. No menu lateral, clique em **Conferências**
3. Você deve ver a página com duas seções:
   - **Nova Conferência** (no topo)
   - **Histórico de Conferências** (abaixo)

### 4.2. Criar uma Conferência de Teste

1. **Selecione um Funcionário**
   - No dropdown "Funcionário", selecione um funcionário que tenha itens ou ONUs atribuídos
   - O sistema carregará automaticamente os dados

2. **Conferir ONUs** (se houver)
   - Marque o checkbox ao lado de cada ONU
   - Selecione o status: OK / Faltando / Extraviada
   - Adicione observações se necessário

3. **Conferir Itens** (se houver)
   - Marque o checkbox ao lado de cada item
   - Ajuste a quantidade conferida (se diferente da esperada)
   - O status será calculado automaticamente:
     - **OK**: quantidade conferida = esperada
     - **FALTANDO**: quantidade conferida < esperada
     - **EXCEDENTE**: quantidade conferida > esperada
   - Adicione observações se necessário

4. **Observações Gerais**
   - Adicione observações gerais sobre a conferência

5. **Salvar**
   - Clique em **Salvar Conferência**
   - Você deve ver uma mensagem de sucesso
   - A conferência aparecerá no histórico abaixo

### 4.3. Verificar o Histórico

1. Role para baixo até a seção **Histórico de Conferências**
2. Você deve ver a conferência recém-criada com:
   - Data e hora
   - Nome do funcionário
   - Seu nome (quem conferiu)
   - Quantidade de itens e ONUs conferidos
   - Observações

### 4.4. Testar com Funcionário sem Itens

1. Selecione um funcionário que não tenha itens ou ONUs atribuídos
2. Você deve ver mensagens apropriadas:
   - "Nenhuma ONU atribuída"
   - "Nenhum item fornecido"

## 5. Verificar no Banco de Dados

Execute as seguintes queries no Supabase SQL Editor para verificar os dados salvos:

```sql
-- Ver todas as conferências
SELECT 
  c.id,
  c.data_conferencia,
  f.nome as funcionario,
  u.nome as usuario,
  c.observacoes
FROM conferencias c
JOIN funcionarios f ON c.funcionario_id = f.id
LEFT JOIN usuarios u ON c.usuario_id = u.id
ORDER BY c.data_conferencia DESC
LIMIT 10;

-- Ver itens de uma conferência específica
-- (substitua 'ID_DA_CONFERENCIA' pelo ID real)
SELECT 
  ci.*,
  i.nome as item_nome,
  i.codigo as item_codigo,
  os.numero as os_numero
FROM conferencia_itens ci
JOIN itens i ON ci.item_id = i.id
LEFT JOIN ordens_servico os ON ci.os_id = os.id
WHERE ci.conferencia_id = 'ID_DA_CONFERENCIA';

-- Ver ONUs de uma conferência específica
-- (substitua 'ID_DA_CONFERENCIA' pelo ID real)
SELECT 
  co.*,
  o.codigo_unico,
  o.modelo
FROM conferencia_onus co
JOIN onus o ON co.onu_id = o.id
WHERE co.conferencia_id = 'ID_DA_CONFERENCIA';
```

## 6. Casos de Teste Recomendados

### Teste 1: Conferência Completa
- Funcionário com ONUs e itens
- Marcar tudo como OK
- Salvar e verificar

### Teste 2: Conferência com Problemas
- Funcionário com ONUs e itens
- Marcar algumas ONUs como "Faltando" ou "Extraviada"
- Ajustar quantidades de itens (criar status "Faltando" ou "Excedente")
- Adicionar observações detalhadas
- Salvar e verificar

### Teste 3: Conferência Vazia
- Funcionário sem ONUs ou itens
- Verificar se a interface mostra mensagens apropriadas

### Teste 4: Múltiplas Conferências
- Criar conferências para diferentes funcionários
- Verificar se todas aparecem no histórico
- Verificar ordenação por data (mais recente primeiro)

## 7. Problemas Comuns

### Erro ao Salvar Conferência
- Verifique se a migration foi executada corretamente
- Verifique as políticas RLS no Supabase
- Verifique o console do navegador para erros

### Dados não Carregam
- Verifique se há funcionários ativos no sistema
- Verifique se há ONUs com status "em_uso"
- Verifique se há OS confirmadas com itens

### Histórico Vazio
- Crie pelo menos uma conferência primeiro
- Verifique se não há erros no console

## 8. Próximos Passos (Opcional)

Se desejar melhorias futuras:
- Adicionar filtros no histórico (por funcionário, período)
- Adicionar modal de detalhes para ver conferências antigas
- Adicionar exportação para PDF/Excel
- Adicionar notificações quando itens estão faltando
- Adicionar dashboard com estatísticas de conferências
