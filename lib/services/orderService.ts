import { supabase, Order, OrderItem } from '@/lib/supabase';
import { logService } from './logService';

export type CreateOrderInput = {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  notes?: string;
  items: {
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
  }[];
};

export const orderService = {
  async create(input: CreateOrderInput): Promise<Order> {
    const total_price = input.items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_name: input.customer_name,
        customer_email: input.customer_email,
        customer_phone: input.customer_phone,
        customer_address: input.customer_address,
        notes: input.notes || '',
        total_price,
        status: 'PENDING_PAYMENT',
      })
      .select()
      .single();

    if (orderError) throw orderError;

    const orderItems = input.items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.unit_price * item.quantity,
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
    if (itemsError) throw itemsError;

    await logService.create('INFO', 'ORDER_CREATED', `Order ${order.id} created for ${input.customer_name}`, { order_id: order.id, total_price });

    return order;
  },

  async getById(id: string): Promise<Order | null> {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async getAll(status?: string): Promise<Order[]> {
    let query = supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false });
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async updateStatus(id: string, status: Order['status']): Promise<void> {
    const { error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    await logService.create('INFO', 'ORDER_STATUS_UPDATED', `Order ${id} status updated to ${status}`, { order_id: id, status });
  },

  async updatePaymentToken(id: string, token: string, url: string): Promise<void> {
    const { error } = await supabase
      .from('orders')
      .update({ payment_token: token, payment_url: url, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  async getStats(): Promise<{ totalOrders: number; totalRevenue: number; pendingOrders: number; paidOrders: number }> {
    const { data, error } = await supabase.from('orders').select('status, total_price');
    if (error) throw error;

    const orders = data || [];
    return {
      totalOrders: orders.length,
      totalRevenue: orders.filter((o) => o.status === 'PAID').reduce((sum, o) => sum + Number(o.total_price), 0),
      pendingOrders: orders.filter((o) => o.status === 'PENDING_PAYMENT').length,
      paidOrders: orders.filter((o) => o.status === 'PAID').length,
    };
  },
};
