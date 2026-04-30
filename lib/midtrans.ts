import { supabaseAdmin } from '@/lib/supabase';

type MidtransSnap = {
  createTransaction(param: Record<string, unknown>): Promise<{ token: string; redirect_url: string }>;
};

let snapInstance: MidtransSnap | null = null;
let cachedSettings: {
  is_production: boolean;
  server_key: string;
  client_key: string;
} | null = null;
let settingsFetched = false;

async function getMidtransSettings() {
  if (settingsFetched && cachedSettings) return cachedSettings;

  try {
    const { data, error } = await supabaseAdmin
      .from('midtrans_settings')
      .select('is_production, server_key, client_key, sb_server_key, sb_client_key')
      .order('id', { ascending: true })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (data) {
      const isProd = data.is_production || false;
      cachedSettings = {
        is_production: isProd,
        server_key: isProd ? (data.server_key || '') : (data.sb_server_key || ''),
        client_key: isProd ? (data.client_key || '') : (data.sb_client_key || ''),
      };
    } else {
      const isProd = process.env.MIDTRANS_IS_PRODUCTION === 'true';
      cachedSettings = {
        is_production: isProd,
        server_key: isProd
          ? (process.env.MIDTRANS_SERVER_KEY || '')
          : (process.env.SANDBOX_MIDTRANS_SERVER_KEY || process.env.MIDTRANS_SERVER_KEY || ''),
        client_key: isProd
          ? (process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '')
          : (process.env.SANDBOX_MIDTRANS_CLIENT_KEY || process.env.NEXT_PUBLIC_SANDBOX_MIDTRANS_CLIENT_KEY || process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || ''),
      };
    }

    settingsFetched = true;
    return cachedSettings;
  } catch (err) {
    const isProd = process.env.MIDTRANS_IS_PRODUCTION === 'true';
    return {
      is_production: isProd,
      server_key: isProd
        ? (process.env.MIDTRANS_SERVER_KEY || '')
        : (process.env.SANDBOX_MIDTRANS_SERVER_KEY || ''),
      client_key: isProd
        ? (process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '')
        : (process.env.SANDBOX_MIDTRANS_CLIENT_KEY || ''),
    };
  }
}

export async function createTransaction(params: {
  orderId: string;
  grossAmount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}): Promise<{
  token: string;
  redirect_url: string;
}> {
  const settings = await getMidtransSettings();

  if (!settings.server_key || !settings.client_key) {
    throw new Error('Midtrans keys not configured');
  }

  // Both sandbox + production use Snap
  // Only difference: isProduction flag + keys
  if (!snapInstance) {
    const midtransClient = require('midtrans-client');
    snapInstance = new midtransClient.Snap({
      isProduction: settings.is_production,
      serverKey: settings.server_key,
      clientKey: settings.client_key,
    });
  }

  const parameter = {
    transaction_details: {
      order_id: params.orderId,
      gross_amount: params.grossAmount,
    },
    item_details: [
      {
        id: 'order-' + params.orderId,
        price: params.grossAmount,
        quantity: 1,
        name: 'Order ' + params.orderId,
        category: 'Vape Products',
      },
    ],
    customer_details: {
      first_name: params.customerName,
      email: params.customerEmail,
      phone: params.customerPhone || '',
    },
  };

  const transaction = await snapInstance!.createTransaction(parameter);
  return {
    token: transaction.token,
    redirect_url: transaction.redirect_url,
  };
}

export async function verifyMidtransSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  signature: string
): Promise<boolean> {
  const settings = await getMidtransSettings();
  const serverKey = settings.server_key;

  if (!serverKey) {
    console.warn('Midtrans server key not set, skipping signature verification');
    return true;
  }

  const data = `${orderId}${statusCode}${grossAmount}${serverKey}`;
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-512', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const expectedSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return expectedSignature === signature;
}

export function clearMidtransCache() {
  cachedSettings = null;
  settingsFetched = false;
  snapInstance = null;
}
