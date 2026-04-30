const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function uint8ArrayToBase64url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function stringToUint8Array(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

async function hmacSign(key: string, data: string): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    stringToUint8Array(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, stringToUint8Array(data));
  return new Uint8Array(signature);
}

export async function generateToken(adminId: string): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    adminId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
  };

  const encodedHeader = uint8ArrayToBase64url(stringToUint8Array(JSON.stringify(header)));
  const encodedPayload = uint8ArrayToBase64url(stringToUint8Array(JSON.stringify(payload)));

  const data = `${encodedHeader}.${encodedPayload}`;
  const signatureBytes = await hmacSign(JWT_SECRET, data);
  const encodedSignature = uint8ArrayToBase64url(signatureBytes);

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

export async function verifyToken(token: string): Promise<{ adminId: string } | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;
    const data = `${encodedHeader}.${encodedPayload}`;

    const expectedSignatureBytes = await hmacSign(JWT_SECRET, data);
    const expectedSignature = uint8ArrayToBase64url(expectedSignatureBytes);

    if (signature !== expectedSignature) return null;

    const payloadStr = atob(encodedPayload.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadStr);

    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    return { adminId: payload.adminId };
  } catch {
    return null;
  }
}

export function verifyPassword(password: string): boolean {
  return password === ADMIN_PASSWORD;
}

export async function verifyAdmin(request?: Request): Promise<{ authenticated: boolean; adminId?: string }> {
  try {
    // Check cookie
    let token: string | undefined;
    if (request) {
      const cookie = request.headers.get('cookie') || '';
      const match = cookie.match(/admin_token=([^;]+)/);
      if (match) token = match[1];
    }
    if (!token) {
      // Check Authorization header
      const auth = request?.headers.get('authorization') || '';
      if (auth.startsWith('Bearer ')) token = auth.slice(7);
    }
    if (!token) {
      // Check localStorage (client-side) - token might be in headers
      return { authenticated: false };
    }
    const result = await verifyToken(token);
    if (!result) return { authenticated: false };
    return { authenticated: true, adminId: result.adminId };
  } catch {
    return { authenticated: false };
  }
}
