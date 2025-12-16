-- ============================================================================
-- Script de Criação do Banco de Dados - Stock Guardian Pro
-- ============================================================================
-- Este script cria toda a estrutura do banco de dados necessário para o
-- sistema de gestão de estoque e ordens de serviço.
--
-- IMPORTANTE: Este script é IDEMPOTENTE - pode ser executado múltiplas vezes
-- sem causar erros. Ele verifica se os objetos já existem antes de criar.
--
-- Execute este script no SQL Editor do Supabase Dashboard
-- ============================================================================

-- ============================================================================
-- LIMPAR ESTRUTURA EXISTENTE (OPCIONAL)
-- ============================================================================
-- Descomente as linhas abaixo se quiser limpar tudo e começar do zero
-- ⚠️ ATENÇÃO: Isso apagará TODOS os dados!
-- ============================================================================
-- DROP SCHEMA public CASCADE;
-- CREATE SCHEMA public;
-- GRANT ALL ON SCHEMA public TO postgres;
-- GRANT ALL ON SCHEMA public TO public;

-- ============================================================================
-- ENUMS (Tipos Enum)
-- ============================================================================

DO $$ BEGIN
  -- Status possíveis para uma ONU
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'onu_status') THEN
    CREATE TYPE public.onu_status AS ENUM (
      'em_estoque',
      'em_uso',
      'extraviada',
      'devolvida'
    );
  END IF;

  -- Status possíveis para uma Ordem de Serviço
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'os_status') THEN
    CREATE TYPE public.os_status AS ENUM (
      'rascunho',
      'confirmada',
      'cancelada',
      'devolucao_parcial',
      'encerrada'
    );
  END IF;

  -- Tipos de movimentação no estoque
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'movimento_tipo') THEN
    CREATE TYPE public.movimento_tipo AS ENUM (
      'saida',
      'entrada',
      'devolucao',
      'cancelamento'
    );
  END IF;
END $$;

-- ============================================================================
-- TABELAS PRINCIPAIS
-- ============================================================================

-- Tabela de usuários do sistema (administradores)
CREATE TABLE IF NOT EXISTS public.usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  nome TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de funcionários
CREATE TABLE IF NOT EXISTS public.funcionarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cargo TEXT,
  documento TEXT,
  matricula TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de itens de estoque (genéricos)
CREATE TABLE IF NOT EXISTS public.itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT,
  nome TEXT NOT NULL,
  categoria TEXT,
  unidade TEXT DEFAULT 'un',
  qtd_atual INTEGER DEFAULT 0,
  estoque_minimo INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de ONUs (equipamentos específicos)
CREATE TABLE IF NOT EXISTS public.onus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_unico TEXT UNIQUE NOT NULL,
  modelo TEXT,
  serial TEXT,
  status onu_status DEFAULT 'em_estoque',
  funcionario_atual_id UUID REFERENCES public.funcionarios(id),
  os_vinculada_id UUID, -- FK será adicionada após criar a tabela ordens_servico
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Ordens de Serviço
CREATE TABLE IF NOT EXISTS public.ordens_servico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero SERIAL UNIQUE NOT NULL,
  funcionario_id UUID NOT NULL REFERENCES public.funcionarios(id),
  status os_status DEFAULT 'rascunho',
  observacoes TEXT,
  assinatura_base64 TEXT,
  assinatura_data TIMESTAMPTZ,
  assinatura_usuario_id UUID REFERENCES public.usuarios(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- FOREIGN KEYS (Relacionamentos)
-- ============================================================================

-- FK da ONU para OS (adicionada apenas se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'onus_os_vinculada_fk'
  ) THEN
    ALTER TABLE public.onus 
      ADD CONSTRAINT onus_os_vinculada_fk 
      FOREIGN KEY (os_vinculada_id) 
      REFERENCES public.ordens_servico(id);
  END IF;
END $$;

-- ============================================================================
-- TABELAS DE RELACIONAMENTO
-- ============================================================================

-- Tabela de itens associados a uma OS
CREATE TABLE IF NOT EXISTS public.os_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id UUID NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.itens(id),
  quantidade INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de ONUs associadas a uma OS
CREATE TABLE IF NOT EXISTS public.os_onus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id UUID NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
  onu_id UUID NOT NULL REFERENCES public.onus(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- TABELAS DE HISTÓRICO E AUDITORIA
-- ============================================================================

-- Tabela de histórico de movimentações do estoque
CREATE TABLE IF NOT EXISTS public.movimentacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo movimento_tipo NOT NULL,
  item_id UUID REFERENCES public.itens(id),
  onu_id UUID REFERENCES public.onus(id),
  quantidade INTEGER,
  os_id UUID REFERENCES public.ordens_servico(id),
  funcionario_id UUID REFERENCES public.funcionarios(id),
  usuario_id UUID REFERENCES public.usuarios(id),
  descricao TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de histórico de mudanças de status de ONUs
CREATE TABLE IF NOT EXISTS public.onu_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  onu_id UUID NOT NULL REFERENCES public.onus(id),
  status_anterior onu_status,
  status_novo onu_status NOT NULL,
  funcionario_id UUID REFERENCES public.funcionarios(id),
  os_id UUID REFERENCES public.ordens_servico(id),
  usuario_id UUID REFERENCES public.usuarios(id),
  descricao TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- TABELAS DE DEVOLUÇÃO
-- ============================================================================

-- Tabela de devoluções
CREATE TABLE IF NOT EXISTS public.devolucoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id UUID NOT NULL REFERENCES public.ordens_servico(id),
  usuario_id UUID REFERENCES public.usuarios(id),
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de itens devolvidos
CREATE TABLE IF NOT EXISTS public.devolucao_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  devolucao_id UUID NOT NULL REFERENCES public.devolucoes(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.itens(id),
  quantidade INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de ONUs devolvidas
CREATE TABLE IF NOT EXISTS public.devolucao_onus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  devolucao_id UUID NOT NULL REFERENCES public.devolucoes(id) ON DELETE CASCADE,
  onu_id UUID NOT NULL REFERENCES public.onus(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Habilitar RLS em todas as tabelas (idempotente)
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordens_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.os_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.os_onus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onu_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devolucoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devolucao_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devolucao_onus ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLÍTICAS RLS (Permissões)
-- ============================================================================
-- Remove políticas existentes e recria (para garantir que estão corretas)

-- Remover políticas antigas se existirem
DO $$ 
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- Criar políticas
CREATE POLICY "Allow all for usuarios" 
  ON public.usuarios 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Allow all for funcionarios" 
  ON public.funcionarios 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Allow all for itens" 
  ON public.itens 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Allow all for onus" 
  ON public.onus 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Allow all for ordens_servico" 
  ON public.ordens_servico 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Allow all for os_itens" 
  ON public.os_itens 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Allow all for os_onus" 
  ON public.os_onus 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Allow all for movimentacoes" 
  ON public.movimentacoes 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Allow all for onu_historico" 
  ON public.onu_historico 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Allow all for devolucoes" 
  ON public.devolucoes 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Allow all for devolucao_itens" 
  ON public.devolucao_itens 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Allow all for devolucao_onus" 
  ON public.devolucao_onus 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- ============================================================================
-- ÍNDICES (para melhorar performance)
-- ============================================================================

-- Índices para campos frequentemente consultados (usando IF NOT EXISTS via DO)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_funcionarios_ativo') THEN
    CREATE INDEX idx_funcionarios_ativo ON public.funcionarios(ativo);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_itens_categoria') THEN
    CREATE INDEX idx_itens_categoria ON public.itens(categoria);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_itens_codigo') THEN
    CREATE INDEX idx_itens_codigo ON public.itens(codigo);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_onus_status') THEN
    CREATE INDEX idx_onus_status ON public.onus(status);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_onus_codigo_unico') THEN
    CREATE INDEX idx_onus_codigo_unico ON public.onus(codigo_unico);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_ordens_servico_status') THEN
    CREATE INDEX idx_ordens_servico_status ON public.ordens_servico(status);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_ordens_servico_numero') THEN
    CREATE INDEX idx_ordens_servico_numero ON public.ordens_servico(numero);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_movimentacoes_tipo') THEN
    CREATE INDEX idx_movimentacoes_tipo ON public.movimentacoes(tipo);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_movimentacoes_created_at') THEN
    CREATE INDEX idx_movimentacoes_created_at ON public.movimentacoes(created_at);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_onu_historico_onu_id') THEN
    CREATE INDEX idx_onu_historico_onu_id ON public.onu_historico(onu_id);
  END IF;
END $$;

-- ============================================================================
-- USUÁRIOS ADMINISTRATIVOS INICIAIS
-- ============================================================================

-- Remover usuários existentes se necessário (descomente se quiser recriar)
-- DELETE FROM public.usuarios WHERE username IN ('admin1', 'admin2');

-- Inserir usuários administrativos padrão (usando ON CONFLICT para não duplicar)
INSERT INTO public.usuarios (username, password_hash, nome, ativo) VALUES
  ('admin1', 'admin123', 'Administrador 1', true),
  ('admin2', 'admin321', 'Administrador 2', true)
ON CONFLICT (username) DO UPDATE
SET 
  password_hash = EXCLUDED.password_hash,
  nome = EXCLUDED.nome,
  ativo = EXCLUDED.ativo;

-- ============================================================================
-- SCRIPT CONCLUÍDO
-- ============================================================================
-- 
-- PRÓXIMOS PASSOS:
-- 1. Os usuários administrativos já foram criados (admin1/admin123 e admin2/admin321)
-- 2. Importe os tipos TypeScript gerados pelo Supabase (se usar CLI)
-- 3. Configure as variáveis de ambiente no arquivo .env
-- 4. Inicie a aplicação e faça login com um dos usuários acima
--
-- ⚠️ ATENÇÃO: Este sistema armazena senhas em texto plano. 
-- Para produção, considere implementar hash de senhas (bcrypt, etc.)
--
-- ============================================================================

