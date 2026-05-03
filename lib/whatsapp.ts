import { supabaseAdmin } from '@/lib/supabase';

const WAHA_KEY = process.env.WAHA_API_KEY!;

async function getWAHAUrl(): Promise<string> {
  // Read from settings table first, fall back to env var
  try {
    const { data } = await supabaseAdmin
      .from('whatsapp_settings')
      .select('waha_api_url')
      .order('id', { ascending: true })
      .limit(1)
      .single();
    if (data?.waha_api_url) return data.waha_api_url;
  } catch {
    // ignore, fall back to env
  }
  return process.env.WAHA_API_URL || 'http://localhost:3001';
}

export interface WAHAResponse {
  success: boolean;
  data?: unknown;
  message?: string;
}

export async function wahaRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const baseUrl = await getWAHAUrl();
  return fetch(`${baseUrl}/api/${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': WAHA_KEY,
      ...(options.headers || {}),
    },
  });
}

export async function startSession(name = 'default'): Promise<WAHAResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://wahyuvape.xyz';
  const res = await wahaRequest('sessions', {
    method: 'POST',
    body: JSON.stringify({
      name,
      webhookUrl: `${baseUrl}/api/webhooks/whatsapp`,
    }),
  });
  return res.json();
}

export async function stopSession(name = 'default'): Promise<WAHAResponse> {
  const res = await wahaRequest(`sessions/${name}`, {
    method: 'DELETE',
  });
  return res.json();
}

export async function getSessionStatus(name = 'default'): Promise<WAHAResponse> {
  const res = await wahaRequest(`sessions/${name}`);
  return res.json();
}

export async function getQR(): Promise<WAHAResponse> {
  const res = await wahaRequest('screenshot');
  return res.json();
}

export async function sendMessage(
  chatId: string,
  text: string,
  session = 'default'
): Promise<WAHAResponse> {
  const res = await wahaRequest('sendText', {
    method: 'POST',
    body: JSON.stringify({ chatId, text, session }),
  });
  return res.json();
}

export async function getContacts(): Promise<WAHAResponse> {
  const res = await wahaRequest('contacts');
  return res.json();
}
