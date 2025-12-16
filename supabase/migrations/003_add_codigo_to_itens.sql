-- ============================================================================
-- Migration: Adicionar campo código à tabela itens
-- ============================================================================

-- Adicionar coluna codigo à tabela itens (opcional, pode ser único se necessário)
ALTER TABLE public.itens 
ADD COLUMN IF NOT EXISTS codigo TEXT;

-- Opcional: Criar índice para busca rápida por código
CREATE INDEX IF NOT EXISTS idx_itens_codigo ON public.itens(codigo);

-- ============================================================================
-- NOTA: O campo codigo é opcional (pode ser NULL)
-- Se quiser tornar único, descomente a linha abaixo:
-- ALTER TABLE public.itens ADD CONSTRAINT itens_codigo_unique UNIQUE (codigo);
-- ============================================================================

