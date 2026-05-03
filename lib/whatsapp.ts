import { supabaseAdmin } from '@/lib/supabase';

export async function getWAHACredentials(): Promise<{ url: string; apiKey: string }> {
  try {
    const { data } = await supabaseAdmin
      .from('whatsapp_settings')
      .select('waha_api_url, waha_api_key')
      .order('id', { ascending: true })
      .limit(1)
      .maybeSingle();
    const url = data?.waha_api_url || process.env.WAHA_API_URL || 'http://localhost:3001';
    const apiKey = data?.waha_api_key || process.env.WAHA_API_KEY || '';
    return { url, apiKey };
  } catch {
    // ignore
  }
  return {
    url: process.env.WAHA_API_URL || 'http://localhost:3001',
    apiKey: process.env.WAHA_API_KEY || '',
  };
}

async function getWAHAUrl(): Promise<string> {
  const { url } = await getWAHACredentials();
  return url;
}

export interface WAHAResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  message?: string;
}

export async function wahaRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const { url, apiKey } = await getWAHACredentials();
  return fetch(`${url}/api/${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': apiKey,
      ...(options.headers || {}),
    },
  });
}

export async function startSession(name = 'default'): Promise<WAHAResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://wahyuvape.xyz';

  // Restart works whether running or stopped
  const restartRes = await wahaRequest(`sessions/${name}/restart`, {
    method: 'POST',
    body: JSON.stringify({
      webhookUrl: `${baseUrl}/api/webhooks/whatsapp`,
    }),
  });

  const restartData = await restartRes.json();

  // If session doesn't exist, create it
  if (restartRes.status === 404 || restartData?.statusCode === 404) {
    const createRes = await wahaRequest('sessions', {
      method: 'POST',
      body: JSON.stringify({
        name,
        webhookUrl: `${baseUrl}/api/webhooks/whatsapp`,
      }),
    });
    const createData = await createRes.json();
    if (createRes.ok) {
      return { success: true, data: createData };
    }
    return { success: false, error: createData?.message || createData?.error || 'Failed to start session' };
  }

  if (restartRes.ok) {
    return { success: true, data: restartData };
  }
  return { success: false, error: restartData?.message || restartData?.error || 'Failed to start session' };
}

export async function stopSession(name = 'default'): Promise<WAHAResponse> {
  const res = await wahaRequest(`sessions/${name}`, {
    method: 'DELETE',
  });
  const data = await res.json();
  if (res.ok) {
    return { success: true, data };
  }
  return { success: false, error: data?.message || data?.error || 'Failed to stop session' };
}

export async function getSessionStatus(name = 'default'): Promise<WAHAResponse> {
  const res = await wahaRequest(`sessions/${name}`);
  const data = await res.json();
  if (res.ok) {
    return { success: true, data };
  }
  return { success: false, error: data?.message || data?.error || 'Failed to get status' };
}

export async function getQR(): Promise<WAHAResponse> {
  const res = await wahaRequest(`default/auth/qr`, {
    headers: {
      'Accept': 'application/json',
    },
  });

  if (res.ok) {
    const data = await res.json();
    if (data?.data) {
      return { success: true, data: data.data };
    }
    return { success: true, data };
  }

  const errorData = await res.json().catch(() => ({}));
  return { success: false, error: errorData?.message || errorData?.error || 'Failed to get QR' };
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
  const data = await res.json();
  if (res.ok) {
    return { success: true, data };
  }
  return { success: false, error: data?.message || data?.error || 'Failed to send message' };
}

export async function getContacts(): Promise<WAHAResponse> {
  // WAHA contacts endpoint: GET /api/contacts/all?session={name}
  const res = await wahaRequest('contacts/all?session=default');
  const data = await res.json();
  if (res.ok) {
    return { success: true, data };
  }
  return { success: false, error: data?.message || data?.error || 'Failed to get contacts' };
}
