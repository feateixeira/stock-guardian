-- Enum para status de ONU
CREATE TYPE public.onu_status AS ENUM ('em_estoque', 'em_uso', 'extraviada', 'devolvida');

-- Enum para status de OS
CREATE TYPE public.os_status AS ENUM ('rascunho', 'confirmada', 'cancelada', 'devolucao_parcial', 'encerrada');

-- Enum para tipo de movimentação
CREATE TYPE public.movimento_tipo AS ENUM ('saida', 'entrada', 'devolucao', 'cancelamento');

-- Tabela de usuários do sistema (admins)
CREATE TABLE public.usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  nome TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de funcionários
CREATE TABLE public.funcionarios (
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
CREATE TABLE public.itens (
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

-- Tabela de ONUs
CREATE TABLE public.onus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_unico TEXT UNIQUE NOT NULL,
  modelo TEXT,
  serial TEXT,
  status onu_status DEFAULT 'em_estoque',
  funcionario_atual_id UUID REFERENCES public.funcionarios(id),
  os_vinculada_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Ordens de Serviço
CREATE TABLE public.ordens_servico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero SERIAL,
  funcionario_id UUID NOT NULL REFERENCES public.funcionarios(id),
  status os_status DEFAULT 'rascunho',
  observacoes TEXT,
  assinatura_base64 TEXT,
  assinatura_data TIMESTAMPTZ,
  assinatura_usuario_id UUID REFERENCES public.usuarios(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Adicionar FK da ONU para OS após criar a tabela de OS
ALTER TABLE public.onus ADD CONSTRAINT onus_os_vinculada_fk 
  FOREIGN KEY (os_vinculada_id) REFERENCES public.ordens_servico(id);

-- Tabela de itens da OS
CREATE TABLE public.os_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id UUID NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.itens(id),
  quantidade INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de ONUs da OS
CREATE TABLE public.os_onus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id UUID NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
  onu_id UUID NOT NULL REFERENCES public.onus(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de histórico de movimentações
CREATE TABLE public.movimentacoes (
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

-- Tabela de histórico de ONU
CREATE TABLE public.onu_historico (
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

-- Tabela de devoluções
CREATE TABLE public.devolucoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id UUID NOT NULL REFERENCES public.ordens_servico(id),
  usuario_id UUID REFERENCES public.usuarios(id),
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Itens devolvidos
CREATE TABLE public.devolucao_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  devolucao_id UUID NOT NULL REFERENCES public.devolucoes(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.itens(id),
  quantidade INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ONUs devolvidas
CREATE TABLE public.devolucao_onus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  devolucao_id UUID NOT NULL REFERENCES public.devolucoes(id) ON DELETE CASCADE,
  onu_id UUID NOT NULL REFERENCES public.onus(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Desabilitar RLS para sistema simples de login interno
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

-- Políticas públicas (sistema interno sem auth complexo)
CREATE POLICY "Allow all for usuarios" ON public.usuarios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for funcionarios" ON public.funcionarios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for itens" ON public.itens FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for onus" ON public.onus FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for ordens_servico" ON public.ordens_servico FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for os_itens" ON public.os_itens FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for os_onus" ON public.os_onus FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for movimentacoes" ON public.movimentacoes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for onu_historico" ON public.onu_historico FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for devolucoes" ON public.devolucoes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for devolucao_itens" ON public.devolucao_itens FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for devolucao_onus" ON public.devolucao_onus FOR ALL USING (true) WITH CHECK (true);

-- Inserir usuários admin (senha em texto plano - sistema atual não usa hash)
-- ⚠️ ATENÇÃO: Para produção, implemente hash de senhas (bcrypt, etc.)
INSERT INTO public.usuarios (username, password_hash, nome, ativo) VALUES
  ('admin1', 'admin123', 'Administrador 1', true),
  ('admin2', 'admin321', 'Administrador 2', true);