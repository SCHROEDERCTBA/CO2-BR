// =====================================================
// TIPOS TYPESCRIPT - CO2 BRASIL MANAGER v2.0
// Tipos atualizados para o novo schema otimizado
// =====================================================

// Enums base
export type UserRole = "ADMIN" | "CONSULTANT" | "ASSEMBLER";
export type OrderStatus = "APPROVED" | "SENT";
export type ProductStatus = "ACTIVE" | "INACTIVE" | "DISCONTINUED";
export type ActivityType = 
  | "ORDER_CREATED" 
  | "ORDER_UPDATED" 
  | "ORDER_STATUS_CHANGED" 
  | "PRODUCT_CREATED" 
  | "PRODUCT_UPDATED" 
  | "USER_CREATED" 
  | "USER_UPDATED" 
  | "LOGIN" 
  | "LOGOUT";

// Tipos para configurações do sistema
export type SystemSetting = {
  id: number;
  key: string;
  value: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
};

// Tipos de usuário
export type UserProfile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
};

// Tipos de categoria
export type Category = {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

// Tipos de produto
export type Product = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  category_id: number | null;
  image_url: string | null;
  status: ProductStatus;
  data_ai_hint: string | null;
  sku: string | null;
  weight: number | null;
  dimensions: string | null;
  stock_quantity: number;
  min_stock_level: number;
  created_at: string;
  updated_at: string;
  // Campos relacionados (joins)
  categories?: { 
    name: string; 
    description: string | null; 
    is_active: boolean; 
  } | null;
};

// Tipos de pedido
export type Order = {
  id: string;
  customer_name: string;
  customer_cpf: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  customer_address: string | null;
  customer_zip: string | null;
  customer_city: string | null;
  customer_state: string | null;
  status: OrderStatus;
  total_amount: number | null;
  estimated_delivery_date: string | null;
  actual_delivery_date: string | null;
  priority: number;
  created_at: string;
  updated_at: string;
  consultant_id: string | null;
  assembler_id: string | null;
  notes: string | null;
  internal_notes: string | null;
  payment_proof_urls: string[] | null;
  final_product_image_urls: string[] | null;
  shipping_tracking_code: string | null;
  // Campos relacionados (joins)
  users?: { 
    full_name: string | null; 
    email: string | null; 
  } | null;
  assembler?: { 
    full_name: string | null; 
    email: string | null; 
  } | null;
  order_items?: OrderItem[];
};

// Tipo estendido de pedido com detalhes completos
export type OrderWithDetails = Order & {
  order_items: (OrderItem & {
    products: { 
      name: string; 
      image_url: string | null;
      sku: string | null;
    } | null;
  })[];
  users: { 
    full_name: string | null; 
    email: string | null; 
  } | null;
  assembler: { 
    full_name: string | null; 
    email: string | null; 
  } | null;
};

// Tipos de item do pedido
export type OrderItem = {
  id: number;
  order_id: string;
  product_id: number | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes: string | null;
  created_at: string;
  // Campos relacionados (joins)
  products?: { 
    name: string; 
    image_url: string | null; 
    sku: string | null;
    status: ProductStatus;
  } | null;
};

// Tipos de log de atividade
export type ActivityLog = {
  id: number;
  user_id: string | null;
  activity_type: ActivityType;
  description: string;
  metadata: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  // Campos relacionados (joins)
  users?: { 
    full_name: string | null; 
    email: string | null; 
  } | null;
};

// Tipos para estatísticas e dashboards
export type DashboardStats = {
  total_orders: number;
  pending_orders: number;
  approved_orders: number;
  in_production_orders: number;
  sent_orders: number;
  canceled_orders: number;
  total_revenue: number;
  total_products: number;
  active_products: number;
  total_users: number;
  total_consultants: number;
  total_assemblers: number;
};

// Tipos para formulários
export type CreateOrderFormData = {
  customer_name: string;
  customer_cpf?: string;
  customer_phone?: string;
  customer_email?: string;
  customer_address?: string;
  customer_zip?: string;
  customer_city?: string;
  customer_state?: string;
  notes?: string;
  priority?: number;
  estimated_delivery_date?: string;
  items: {
    product_id: number;
    quantity: number;
    unit_price: number;
    notes?: string;
  }[];
};

export type CreateProductFormData = {
  name: string;
  description?: string;
  price: number;
  category_id: number;
  sku?: string;
  weight?: number;
  dimensions?: string;
  stock_quantity?: number;
  min_stock_level?: number;
  data_ai_hint?: string;
  status?: ProductStatus;
};

export type CreateUserFormData = {
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  password: string;
};

// Tipos para respostas de API
export type ApiResponse<T> = {
  data?: T;
  error?: string;
  success?: boolean;
};

export type PaginatedResponse<T> = {
  data: T[];
  count: number;
  page: number;
  per_page: number;
  total_pages: number;
};

// Tipos para filtros e ordenação
export type OrderFilter = {
  status?: OrderStatus[];
  consultant_id?: string;
  assembler_id?: string;
  priority?: number[];
  date_from?: string;
  date_to?: string;
  customer_name?: string;
};

export type ProductFilter = {
  category_id?: number[];
  status?: ProductStatus[];
  price_min?: number;
  price_max?: number;
  search?: string;
  in_stock?: boolean;
};

export type UserFilter = {
  role?: UserRole[];
  is_active?: boolean;
  search?: string;
};

// Tipos para uploads de arquivos
export type UploadedFile = {
  name: string;
  url: string;
  size: number;
  type: string;
  uploaded_at: string;
};

// Tipos para configurações de bucket
export type StorageBucket = {
  id: string;
  name: string;
  public: boolean;
  file_size_limit: number;
  allowed_mime_types: string[];
};

// Tipo para metadata de arquivos
export type FileMetadata = {
  bucket: 'products' | 'orders' | 'invoices';
  path: string;
  size: number;
  mimetype: string;
  created_at: string;
};
