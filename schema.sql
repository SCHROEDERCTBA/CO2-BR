-- =====================================================
-- CO2 BRASIL - SCHEMA OTIMIZADO E MELHORADO
-- Sistema de Gerenciamento de Pedidos para Armas de Pressão
-- =====================================================

-- 1. LIMPEZA COMPLETA (Executar em ordem)
-- =====================================================

-- 1.1. Remover Policies de Storage (se existirem)
DROP POLICY IF EXISTS "products_public_read" ON storage.objects;
DROP POLICY IF EXISTS "products_admin_manage" ON storage.objects;
DROP POLICY IF EXISTS "orders_admin_assembler_read" ON storage.objects;
DROP POLICY IF EXISTS "orders_public_read" ON storage.objects;
DROP POLICY IF EXISTS "orders_admin_assembler_manage" ON storage.objects;
DROP POLICY IF EXISTS "invoices_admin_consultant_read" ON storage.objects;
DROP POLICY IF EXISTS "invoices_admin_consultant_manage" ON storage.objects;

-- 1.2. Remover Buckets e Objetos (se existirem)
DELETE FROM storage.objects WHERE bucket_id IN ('products', 'orders', 'invoices');
DELETE FROM storage.buckets WHERE id IN ('products', 'orders', 'invoices');

-- 1.3. Remover Tabelas (em ordem de dependência reversa)
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.system_settings CASCADE;
DROP TABLE IF EXISTS public.activity_logs CASCADE;

-- 1.4. Remover Funções
DROP FUNCTION IF EXISTS public.get_my_role() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_user_activity() CASCADE;
DROP FUNCTION IF EXISTS public.log_activity() CASCADE;
DROP FUNCTION IF EXISTS public.calculate_order_total() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_orders_count() CASCADE;

-- 1.5. Remover Tipos (Enums)
DROP TYPE IF EXISTS public.order_status CASCADE;
DROP TYPE IF EXISTS public.user_role CASCADE;
DROP TYPE IF EXISTS public.activity_type CASCADE;
DROP TYPE IF EXISTS public.product_status CASCADE;

-- 1.6. Remover Índices customizados (se existirem)
DROP INDEX IF EXISTS idx_orders_status;
DROP INDEX IF EXISTS idx_orders_consultant_id;
DROP INDEX IF EXISTS idx_orders_created_at;
DROP INDEX IF EXISTS idx_products_category_id;
DROP INDEX IF EXISTS idx_products_status;
DROP INDEX IF EXISTS idx_order_items_order_id;
DROP INDEX IF EXISTS idx_order_items_product_id;
DROP INDEX IF EXISTS idx_activity_logs_user_id;
DROP INDEX IF EXISTS idx_activity_logs_created_at;

-- =====================================================
-- 2. CRIAÇÃO DE TIPOS (ENUMS)
-- =====================================================

CREATE TYPE public.user_role AS ENUM (
    'ADMIN',
    'CONSULTANT',
    'ASSEMBLER'
);

CREATE TYPE public.order_status AS ENUM (
    'PENDENTE',
    'ENVIADO',
    'CANCELADO'
);

CREATE TYPE public.product_status AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'DISCONTINUED'
);

CREATE TYPE public.activity_type AS ENUM (
    'ORDER_CREATED',
    'ORDER_UPDATED',
    'ORDER_STATUS_CHANGED',
    'PRODUCT_CREATED',
    'PRODUCT_UPDATED',
    'USER_CREATED',
    'USER_UPDATED',
    'LOGIN',
    'LOGOUT'
);

-- =====================================================
-- 3. CRIAÇÃO DE TABELAS
-- =====================================================

-- 3.1. Tabela de Configurações do Sistema
CREATE TABLE public.system_settings (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    key text NOT NULL UNIQUE,
    value text,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.system_settings IS 'Configurações globais do sistema';

-- 3.2. Tabela de Usuários (vinculada ao auth.users)
CREATE TABLE public.users (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text,
    avatar_url text,
    role user_role NOT NULL DEFAULT 'CONSULTANT'::public.user_role,
    email text,
    phone text,
    is_active boolean DEFAULT true NOT NULL,
    last_login timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.users IS 'Perfis de usuário do sistema';
COMMENT ON COLUMN public.users.email IS 'Email sincronizado do auth.users via trigger';

-- 3.3. Tabela de Categorias
CREATE TABLE public.categories (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL UNIQUE,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.categories IS 'Categorias de produtos';

-- 3.4. Tabela de Produtos
CREATE TABLE public.products (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL,
    description text,
    price numeric(12, 2) NOT NULL CHECK (price >= 0),
    category_id bigint REFERENCES public.categories(id) ON DELETE SET NULL,
    image_url text,
    status product_status DEFAULT 'ACTIVE'::public.product_status NOT NULL,
    data_ai_hint text,
    sku text UNIQUE,
    weight numeric(8, 3),
    dimensions text,
    stock_quantity integer DEFAULT 0,
    min_stock_level integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.products IS 'Catálogo de produtos';

-- 3.5. Tabela de Pedidos
CREATE TABLE public.orders (
    id text PRIMARY KEY,
    customer_name text NOT NULL,
    customer_cpf text,
    customer_phone text,
    customer_email text,
    customer_address text,
    customer_zip text,
    customer_city text,
    customer_state text,
    status order_status NOT NULL DEFAULT 'PENDENTE'::public.order_status,
    total_amount numeric(12, 2),
    estimated_delivery_date date,
    actual_delivery_date date,
    priority integer DEFAULT 1 CHECK (priority BETWEEN 1 AND 5),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    consultant_id uuid,
    assembler_id uuid,
    notes text,
    internal_notes text,
    payment_proof_urls text[],
    final_product_image_urls text[],
    shipping_tracking_code text,
    -- Foreign keys com nomes específicos para evitar ambiguidade
    CONSTRAINT fk_orders_consultant FOREIGN KEY (consultant_id) REFERENCES public.users(id) ON DELETE SET NULL,
    CONSTRAINT fk_orders_assembler FOREIGN KEY (assembler_id) REFERENCES public.users(id) ON DELETE SET NULL
);
COMMENT ON TABLE public.orders IS 'Pedidos de clientes';

-- 3.6. Tabela de Itens do Pedido
CREATE TABLE public.order_items (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    order_id text NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id bigint REFERENCES public.products(id) ON DELETE SET NULL,
    product_name text NOT NULL, -- Snapshot do nome do produto
    quantity integer NOT NULL CHECK (quantity > 0),
    unit_price numeric(12, 2) NOT NULL CHECK (unit_price >= 0),
    total_price numeric(12, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.order_items IS 'Itens individuais dos pedidos';

-- 3.7. Tabela de Logs de Atividade
CREATE TABLE public.activity_logs (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    activity_type activity_type NOT NULL,
    description text NOT NULL,
    metadata jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.activity_logs IS 'Log de atividades do sistema';

-- =====================================================
-- 4. CRIAÇÃO DE ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para Orders
CREATE INDEX idx_orders_status ON public.orders (status);
CREATE INDEX idx_orders_consultant_id ON public.orders (consultant_id);
CREATE INDEX idx_orders_assembler_id ON public.orders (assembler_id);
CREATE INDEX idx_orders_created_at ON public.orders (created_at DESC);
CREATE INDEX idx_orders_customer_name ON public.orders (customer_name);

-- Índices para Products
CREATE INDEX idx_products_category_id ON public.products (category_id);
CREATE INDEX idx_products_status ON public.products (status);
CREATE INDEX idx_products_name ON public.products (name);

-- Índices para Order Items
CREATE INDEX idx_order_items_order_id ON public.order_items (order_id);
CREATE INDEX idx_order_items_product_id ON public.order_items (product_id);

-- Índices para Activity Logs
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs (user_id);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs (created_at DESC);
CREATE INDEX idx_activity_logs_activity_type ON public.activity_logs (activity_type);

-- =====================================================
-- 5. FUNÇÕES UTILITÁRIAS
-- =====================================================

-- 5.1. Função para obter role do usuário
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS user_role AS $$
DECLARE
  user_role_output user_role;
BEGIN
  SELECT role INTO user_role_output FROM public.users WHERE id = auth.uid();
  RETURN user_role_output;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.2. Função para calcular total do pedido
CREATE OR REPLACE FUNCTION public.calculate_order_total(order_id_param text)
RETURNS numeric AS $$
DECLARE
  total_amount numeric(12, 2);
BEGIN
  SELECT COALESCE(SUM(total_price), 0) 
  INTO total_amount 
  FROM public.order_items 
  WHERE order_id = order_id_param;
  
  RETURN total_amount;
END;
$$ LANGUAGE plpgsql;

-- 5.3. Função para contar pedidos do usuário
CREATE OR REPLACE FUNCTION public.get_user_orders_count(user_id_param uuid)
RETURNS integer AS $$
DECLARE
  orders_count integer;
BEGIN
  SELECT COUNT(*) 
  INTO orders_count 
  FROM public.orders 
  WHERE consultant_id = user_id_param;
  
  RETURN orders_count;
END;
$$ LANGUAGE plpgsql;

-- 5.4. Função para registrar atividade
CREATE OR REPLACE FUNCTION public.log_activity(
  activity_type_param activity_type,
  description_param text,
  metadata_param jsonb DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.activity_logs (user_id, activity_type, description, metadata)
  VALUES (auth.uid(), activity_type_param, description_param, metadata_param);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.5. Função para obter pedidos por período (para gráficos)
CREATE OR REPLACE FUNCTION public.get_orders_by_period(
  from_date timestamp with time zone,
  trunc_by text DEFAULT 'day'
)
RETURNS TABLE(
  period text,
  order_count bigint,
  total_amount numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    date_trunc(trunc_by, orders.created_at)::text as period,
    COUNT(*)::bigint as order_count,
    COALESCE(SUM(orders.total_amount), 0)::numeric as total_amount
  FROM public.orders
  WHERE orders.created_at >= from_date
  GROUP BY date_trunc(trunc_by, orders.created_at)
  ORDER BY date_trunc(trunc_by, orders.created_at);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.6. Função para atualizar timestamp de updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. TRIGGERS
-- =====================================================

-- 6.1. Trigger para criar perfil de usuário automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, full_name, email, role)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.email), 
    new.email, 
    'CONSULTANT'::public.user_role
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6.2. Triggers para atualizar updated_at automaticamente
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON public.users 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_categories_updated_at 
  BEFORE UPDATE ON public.categories 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at 
  BEFORE UPDATE ON public.products 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at 
  BEFORE UPDATE ON public.orders 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6.3. Trigger para atualizar total do pedido automaticamente
CREATE OR REPLACE FUNCTION public.update_order_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.orders 
  SET total_amount = public.calculate_order_total(
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.order_id
      ELSE NEW.order_id
    END
  )
  WHERE id = (
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.order_id
      ELSE NEW.order_id
    END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_order_total_on_items_change
  AFTER INSERT OR UPDATE OR DELETE ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.update_order_total();

-- =====================================================
-- 7. HABILITAR ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 8. POLÍTICAS DE SEGURANÇA (RLS POLICIES)
-- =====================================================

-- 8.1. Políticas para 'users'
CREATE POLICY "users_select_own_or_admin" ON public.users FOR SELECT
  TO authenticated USING (
    auth.uid() = id OR 
    public.get_my_role() = 'ADMIN'::user_role
  );

CREATE POLICY "users_update_own_or_admin" ON public.users FOR UPDATE
  TO authenticated USING (
    auth.uid() = id OR 
    public.get_my_role() = 'ADMIN'::user_role
  );

CREATE POLICY "users_insert_admin_only" ON public.users FOR INSERT
  TO authenticated WITH CHECK (
    public.get_my_role() = 'ADMIN'::user_role
  );

CREATE POLICY "users_delete_admin_only" ON public.users FOR DELETE
  TO authenticated USING (
    public.get_my_role() = 'ADMIN'::user_role
  );

-- 8.2. Políticas para 'categories'
CREATE POLICY "categories_select_authenticated" ON public.categories FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "categories_modify_admin_only" ON public.categories FOR ALL
  TO authenticated USING (
    public.get_my_role() = 'ADMIN'::user_role
  );

-- 8.3. Políticas para 'products'
CREATE POLICY "products_select_authenticated" ON public.products FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "products_modify_admin_only" ON public.products FOR ALL
  TO authenticated USING (
    public.get_my_role() = 'ADMIN'::user_role
  );

-- 8.4. Políticas para 'orders'
-- MODIFICADO: Políticas de Pedidos abertas para todos os perfis
CREATE POLICY "orders_select_all" ON public.orders FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "orders_insert_all" ON public.orders FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "orders_update_all" ON public.orders FOR UPDATE
  TO authenticated USING (true);

CREATE POLICY "orders_delete_all" ON public.orders FOR DELETE
  TO authenticated USING (true);

-- 8.5. Políticas para 'order_items'
CREATE POLICY "order_items_select_if_order_visible" ON public.order_items FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE id = order_items.order_id
    )
  );

CREATE POLICY "order_items_modify_if_order_editable" ON public.order_items FOR ALL
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE id = order_items.order_id 
      AND (
        public.get_my_role() = 'ADMIN' OR
        (public.get_my_role() = 'CONSULTANT' AND consultant_id = auth.uid())
      )
    )
  );

-- 8.6. Políticas para 'activity_logs'
CREATE POLICY "activity_logs_select_admin_or_own" ON public.activity_logs FOR SELECT
  TO authenticated USING (
    public.get_my_role() = 'ADMIN' OR 
    user_id = auth.uid()
  );

CREATE POLICY "activity_logs_insert_authenticated" ON public.activity_logs FOR INSERT
  TO authenticated WITH CHECK (true);

-- 8.7. Políticas para 'system_settings'
CREATE POLICY "system_settings_select_authenticated" ON public.system_settings FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "system_settings_modify_admin_only" ON public.system_settings FOR ALL
  TO authenticated USING (
    public.get_my_role() = 'ADMIN'::user_role
  );

-- 8.8. Habilitar RLS nas views (Views herdam políticas das tabelas base)
-- As views usarão as políticas das tabelas orders e users automaticamente

-- =====================================================
-- 9. CONFIGURAÇÃO DE STORAGE BUCKETS
-- =====================================================

-- 9.1. Criar Buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('products', 'products', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('orders', 'orders', true, 104857600, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg', 'image/heic']),
  ('invoices', 'invoices', false, 104857600, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'image/jpg'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 9.2. Políticas de Storage para Products (público para leitura)
CREATE POLICY "products_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'products');

CREATE POLICY "products_admin_manage" ON storage.objects FOR ALL
  USING (
    bucket_id = 'products' AND 
    (storage.foldername(name))[1] = 'products' AND
    auth.role() = 'authenticated' AND
    public.get_my_role() = 'ADMIN'
  );

-- 9.3. Políticas de Storage para Orders (público para leitura, todos autenticados para gerenciar)
CREATE POLICY "orders_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'orders');

CREATE POLICY "orders_manage_all_authenticated" ON storage.objects FOR ALL
  USING (bucket_id = 'orders' AND auth.role() = 'authenticated');

-- 9.4. Políticas de Storage para Invoices (todos autenticados para ler e gerenciar)
CREATE POLICY "invoices_manage_all_authenticated" ON storage.objects FOR ALL
  USING (bucket_id = 'invoices' AND auth.role() = 'authenticated');

-- =====================================================
-- 10. DADOS INICIAIS
-- =====================================================

-- 10.1. Configurações do Sistema
INSERT INTO public.system_settings (key, value, description) VALUES
  ('app_name', 'CO2 Brasil Manager', 'Nome da aplicação'),
  ('app_version', '2.0.0', 'Versão atual da aplicação'),
  ('default_currency', 'BRL', 'Moeda padrão do sistema'),
  ('order_id_prefix', 'CO2', 'Prefixo para IDs de pedidos'),
  ('max_file_size_mb', '50', 'Tamanho máximo de arquivo em MB'),
  ('admin_email', 'admin@co2brasil.com', 'Email do administrador principal'),
  ('company_name', 'CO2 Brasil', 'Nome da empresa'),
  ('company_phone', '(11) 99999-9999', 'Telefone da empresa'),
  ('company_address', 'São Paulo, SP', 'Endereço da empresa')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = now();

-- 10.2. Categorias Iniciais
INSERT INTO public.categories (name, description) VALUES
  ('Rifles PCP', 'Rifles de ar comprimido PCP (Pre-Charged Pneumatic)'),
  ('Pistolas PCP', 'Pistolas de ar comprimido PCP'),
  ('Arbaletes', 'Arbaletes e bestas para caça e esporte'),
  ('Acessórios', 'Acessórios diversos para armas de pressão'),
  ('Munições', 'Chumbinhos e projéteis para armas de pressão'),
  ('Manutenção', 'Produtos para limpeza e manutenção')
ON CONFLICT (name) DO NOTHING;

-- 10.3. Views para resolver ambiguidade de relacionamentos
-- View para orders com consultor
CREATE OR REPLACE VIEW public.orders_with_consultant AS
SELECT 
    o.*,
    c.full_name as consultant_name,
    c.email as consultant_email
FROM public.orders o
LEFT JOIN public.users c ON o.consultant_id = c.id;

-- View para orders com montador
CREATE OR REPLACE VIEW public.orders_with_assembler AS
SELECT 
    o.*,
    a.full_name as assembler_name,
    a.email as assembler_email
FROM public.orders o
LEFT JOIN public.users a ON o.assembler_id = a.id;

-- View completa com ambos os relacionamentos
CREATE OR REPLACE VIEW public.orders_complete AS
SELECT 
    o.*,
    c.full_name as consultant_name,
    c.email as consultant_email,
    a.full_name as assembler_name,
    a.email as assembler_email
FROM public.orders o
LEFT JOIN public.users c ON o.consultant_id = c.id
LEFT JOIN public.users a ON o.assembler_id = a.id;

-- =====================================================
-- SCHEMA CRIADO COM SUCESSO!
-- =====================================================

-- Para finalizar a configuração:
-- 1. Execute este script completo no SQL Editor do Supabase
-- 2. Configure as variáveis de ambiente no seu projeto
-- 3. Crie o primeiro usuário admin manualmente
-- 4. Os buckets de storage já foram configurados automaticamente