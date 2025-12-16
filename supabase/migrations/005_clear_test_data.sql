-- ============================================================================
-- Script para limpar todos os dados de teste do banco de dados
-- ATENÇÃO: Este script deleta TODOS os dados das tabelas principais
-- Execute com cuidado e apenas em ambiente de desenvolvimento/teste
-- ============================================================================

-- Deletar dados em ordem reversa às dependências (filhos primeiro, depois pais)

-- 1. Tabelas de histórico e movimentações (dependem de várias tabelas)
DELETE FROM public.movimentacoes;
DELETE FROM public.onu_historico;
DELETE FROM public.devolucao_itens;
DELETE FROM public.devolucao_onus;
DELETE FROM public.devolucoes;

-- 2. Tabelas de relacionamento OS (dependem de ordens_servico, itens e onus)
DELETE FROM public.os_itens;
DELETE FROM public.os_onus;

-- 3. Ordens de Serviço (dependem de funcionarios e usuarios)
DELETE FROM public.ordens_servico;

-- 4. ONUs (dependem de funcionarios e podem ter referência a ordens_servico)
-- Resetar campos relacionados antes de deletar
UPDATE public.onus SET funcionario_atual_id = NULL, os_vinculada_id = NULL;
DELETE FROM public.onus;

-- 5. Itens (tabela independente, mas pode ter movimentações - já deletadas)
DELETE FROM public.itens;

-- 6. Funcionários (dependem apenas de si mesmos, mas podem ter referências)
DELETE FROM public.funcionarios;

-- 7. Usuários (mantém os usuários admin se necessário)
-- Se quiser deletar também os usuários admin, descomente a linha abaixo:
-- DELETE FROM public.usuarios WHERE username NOT IN ('admin1', 'admin2');

-- ============================================================================
-- Verificar contagem de registros após limpeza
-- ============================================================================
-- Execute estas queries para verificar:
-- SELECT COUNT(*) FROM public.itens;
-- SELECT COUNT(*) FROM public.onus;
-- SELECT COUNT(*) FROM public.funcionarios;
-- SELECT COUNT(*) FROM public.ordens_servico;
-- SELECT COUNT(*) FROM public.os_itens;
-- SELECT COUNT(*) FROM public.os_onus;
-- SELECT COUNT(*) FROM public.movimentacoes;
-- ============================================================================

