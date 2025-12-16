-- ============================================================================
-- Migration: Substituir campo fornecedor por serial na tabela onus
-- ============================================================================

-- Adicionar coluna serial
ALTER TABLE public.onus 
ADD COLUMN IF NOT EXISTS serial TEXT;

-- Remover coluna fornecedor (se existir)
ALTER TABLE public.onus 
DROP COLUMN IF EXISTS fornecedor;

-- Criar índice para busca rápida por serial
CREATE INDEX IF NOT EXISTS idx_onus_serial ON public.onus(serial);

