-- ============================================================================
-- Migration 006: Sistema de Conferências
-- ============================================================================
-- Adiciona tabelas para o sistema de conferência semanal de itens e ONUs
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

DO $$ BEGIN
  -- Status possíveis para itens conferidos
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'conferencia_item_status') THEN
    CREATE TYPE public.conferencia_item_status AS ENUM (
      'ok',
      'faltando',
      'excedente'
    );
  END IF;

  -- Status possíveis para ONUs conferidas
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'conferencia_onu_status') THEN
    CREATE TYPE public.conferencia_onu_status AS ENUM (
      'ok',
      'faltando',
      'extraviada'
    );
  END IF;
END $$;

-- ============================================================================
-- TABELAS
-- ============================================================================

-- Tabela principal de conferências
CREATE TABLE IF NOT EXISTS public.conferencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funcionario_id UUID NOT NULL REFERENCES public.funcionarios(id),
  usuario_id UUID REFERENCES public.usuarios(id),
  data_conferencia TIMESTAMPTZ NOT NULL DEFAULT now(),
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de itens conferidos
CREATE TABLE IF NOT EXISTS public.conferencia_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conferencia_id UUID NOT NULL REFERENCES public.conferencias(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.itens(id),
  os_id UUID REFERENCES public.ordens_servico(id),
  quantidade_esperada INTEGER NOT NULL DEFAULT 0,
  quantidade_conferida INTEGER NOT NULL DEFAULT 0,
  status conferencia_item_status NOT NULL DEFAULT 'ok',
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de ONUs conferidas
CREATE TABLE IF NOT EXISTS public.conferencia_onus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conferencia_id UUID NOT NULL REFERENCES public.conferencias(id) ON DELETE CASCADE,
  onu_id UUID NOT NULL REFERENCES public.onus(id),
  status conferencia_onu_status NOT NULL DEFAULT 'ok',
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- ÍNDICES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_conferencias_funcionario_id 
  ON public.conferencias(funcionario_id);

CREATE INDEX IF NOT EXISTS idx_conferencias_data 
  ON public.conferencias(data_conferencia);

CREATE INDEX IF NOT EXISTS idx_conferencia_itens_conferencia_id 
  ON public.conferencia_itens(conferencia_id);

CREATE INDEX IF NOT EXISTS idx_conferencia_onus_conferencia_id 
  ON public.conferencia_onus(conferencia_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.conferencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conferencia_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conferencia_onus ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLÍTICAS RLS
-- ============================================================================

CREATE POLICY "Allow all for conferencias" 
  ON public.conferencias 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Allow all for conferencia_itens" 
  ON public.conferencia_itens 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Allow all for conferencia_onus" 
  ON public.conferencia_onus 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- ============================================================================
-- MIGRATION CONCLUÍDA
-- ============================================================================
