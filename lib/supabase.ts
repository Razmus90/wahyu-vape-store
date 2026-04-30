import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client bypasses RLS — use only for server-side admin operations
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : supabase; // fallback to anon client if no service key

export type ProductCache = {
  id: string;
  olsera_product_id: string;
  name: string;
  sku: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  brand_name: string;
  klasifikasi: string;
  image_url: string;
  last_synced_at: string;
  created_at: string;
};

export type Order = {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  status: 'PENDING_PAYMENT' | 'PAID' | 'FAILED' | 'CANCELLED';
  total_price: number;
  payment_token: string;
  payment_url: string;
  notes: string;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: string;
};

export type ChatSession = {
  id: string;
  session_token: string;
  customer_name: string;
  customer_email: string;
  started_at: string;
  last_active_at: string;
  chat_messages?: ChatMessage[];
};

export type ChatMessage = {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
};

export type ChatSettings = {
  id: string;
  provider: 'openai' | 'anthropic' | 'openrouter';
  model: string;
  system_prompt: string;
  guardrails?: Record<string, unknown>;
  encrypted_api_keys?: Record<string, string>;
  embedding_api_key?: string;
  embedding_model?: string;
  temperature: number;
  max_tokens: number;
  created_at: string;
  updated_at: string;
};

export type Log = {
  id: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  action: string;
  message: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type MidtransSettings = {
  id: number;
  is_production: boolean;
  merchant_id: string;
  client_key: string;
  server_key: string;
  sb_merchant_id: string;
  sb_client_key: string;
  sb_server_key: string;
  created_at: string;
  updated_at: string;
};
