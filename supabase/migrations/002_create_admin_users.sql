-- ============================================================================
-- Script para criar usuários administrativos
-- ============================================================================
-- Este script pode ser executado separadamente caso você já tenha criado
-- o banco de dados e precise apenas adicionar os usuários.
-- ============================================================================

-- Remover usuários existentes (caso queira recriar)
-- DELETE FROM public.usuarios WHERE username IN ('admin1', 'admin2');

-- Inserir usuários administrativos padrão
INSERT INTO public.usuarios (username, password_hash, nome, ativo) VALUES
  ('admin1', 'admin123', 'Administrador 1', true),
  ('admin2', 'admin321', 'Administrador 2', true)
ON CONFLICT (username) DO UPDATE
SET 
  password_hash = EXCLUDED.password_hash,
  nome = EXCLUDED.nome,
  ativo = EXCLUDED.ativo;

-- ============================================================================
-- ⚠️ IMPORTANTE: Este sistema armazena senhas em texto plano
-- ============================================================================
-- O código atual compara a senha diretamente com password_hash (sem hash).
-- Para produção, considere implementar:
-- - Hash de senhas usando bcrypt ou Argon2
-- - Atualizar o código de autenticação para comparar hashes
-- ============================================================================

