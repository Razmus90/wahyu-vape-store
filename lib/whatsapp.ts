const WAHA_URL = process.env.WAHA_API_URL || 'http://localhost:3000';
const WAHA_KEY = process.env.WAHA_API_KEY!;

export interface WAHAResponse {
  success: boolean;
  data?: unknown;
  message?: string;
}

export async function wahaRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(`${WAHA_URL}/api/${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': WAHA_KEY,
      ...(options.headers || {}),
    },
  });
}

export async function startSession(name = 'default'): Promise<WAHAResponse> {
  const res = await wahaRequest('sessions', {
    method: 'POST',
    body: JSON.stringify({
      name,
      webhookUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/whatsapp`,
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
