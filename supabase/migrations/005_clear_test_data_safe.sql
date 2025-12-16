-- ============================================================================
-- Script SEGURO para limpar dados de teste (preserva usuários admin)
-- Execute este script para limpar apenas dados de teste, mantendo:
-- - Usuários administrativos (admin1, admin2)
-- ============================================================================

-- Desabilitar temporariamente as verificações de foreign key (se necessário)
SET session_replication_role = 'replica';

-- 1. Deletar histórico e movimentações
TRUNCATE TABLE public.movimentacoes CASCADE;
TRUNCATE TABLE public.onu_historico CASCADE;
TRUNCATE TABLE public.devolucao_itens CASCADE;
TRUNCATE TABLE public.devolucao_onus CASCADE;
TRUNCATE TABLE public.devolucoes CASCADE;

-- 2. Deletar relacionamentos de OS
TRUNCATE TABLE public.os_itens CASCADE;
TRUNCATE TABLE public.os_onus CASCADE;

-- 3. Deletar Ordens de Serviço
TRUNCATE TABLE public.ordens_servico CASCADE;

-- 4. Deletar ONUs (resetando referências primeiro)
UPDATE public.onus SET funcionario_atual_id = NULL, os_vinculada_id = NULL WHERE TRUE;
TRUNCATE TABLE public.onus CASCADE;

-- 5. Deletar Itens
TRUNCATE TABLE public.itens CASCADE;

-- 6. Deletar Funcionários
TRUNCATE TABLE public.funcionarios CASCADE;

-- Reabilitar verificações de foreign key
SET session_replication_role = 'origin';

-- Resetar sequências (para que os próximos IDs sejam 1 novamente)
ALTER SEQUENCE IF EXISTS public.ordens_servico_numero_seq RESTART WITH 1;

-- ============================================================================
-- NOTA: Os usuários administrativos (admin1, admin2) foram preservados
-- Se quiser deletá-los também, execute:
-- DELETE FROM public.usuarios;
-- ============================================================================

