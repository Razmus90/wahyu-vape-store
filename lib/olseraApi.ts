const BASE_URL = process.env.OLSERA_BASE_URL || 'https://api-open.olsera.co.id/api/open-api/v1/id';
const APP_ID = process.env.OLSERA_APP_ID || '';
const SECRET_KEY = process.env.OLSERA_SECRET_KEY || '';
const OLSERA_SANDBOX = process.env.OLSERA_SANDBOX_MODE === 'true';

const TOKEN_URL = `${BASE_URL}/token`;

interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

interface OlseraProduct {
  id: number;
  name: string;
  sku: string | null;
  has_variant: number;
  stock_qty: string;
  sell_price_pos: string;
  buy_price: string;
  category_name?: string;
  brand_name?: string;
  klasifikasi?: string;
  published?: number;
  pos_hidden?: number;
  description?: string;
  notes?: string;
  photo_md?: string;
  variants?: OlseraVariant[];
  [key: string]: unknown;
}

interface OlseraVariant {
  id: number;
  name: string;
  sku: string;
  stock_qty: number | string;
  buy_price: string;
  sell_price_pos: string;
  variant_barcode?: string;
  photo_md?: string;
  is_default?: number;
  [key: string]: unknown;
}

function getImageUrl(variant: OlseraVariant | null, parent: OlseraProduct): string {
  const clean = (url: string | undefined): string => {
    if (!url || url.includes('no_data_item')) return '';
    return url;
  };
  if (variant) {
    return clean(variant.photo_md) || clean(parent.photo_md) || '';
  }
  return clean(parent.photo_md) || '';
}

export interface ExpandedProduct {
  id: string;
  olsera_product_id: string;
  name: string;
  sku: string;
  category: string;
  brand_name: string;
  klasifikasi: string;
  price: number;
  stock: number;
  image_url: string;
  description: string;
  has_variant: number;
}

let cachedToken: { token: string; refreshToken: string; expiresAt: number } | null = null;

async function getToken(forceRefresh = false): Promise<string> {
  if (!forceRefresh && cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  if (cachedToken?.refreshToken) {
    try {
      return await refreshAccessToken(cachedToken.refreshToken);
    } catch (e) {
      // Refresh failed, fall through to secret_key
    }
  }

  return await fetchInitialToken();
}

async function fetchInitialToken(): Promise<string> {
  const body = new URLSearchParams({
    app_id: APP_ID,
    secret_key: SECRET_KEY,
    grant_type: 'secret_key',
  }).toString();

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body,
  });

  if (!res.ok) {
    const responseText = await res.text();
    throw new Error(`Token request failed: ${res.status} ${responseText}`);
  }

  const data: TokenData = await res.json();
  if (!data.access_token) {
    throw new Error('No access_token in response');
  }

  cachedToken = {
    token: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };

  return cachedToken.token;
}

async function refreshAccessToken(refreshToken: string): Promise<string> {
  const body = new URLSearchParams({
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  }).toString();

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body,
  });

  if (!res.ok) {
    cachedToken = null;
    throw new Error(`Refresh token failed: ${res.status}`);
  }

  const data: TokenData = await res.json();

  cachedToken = {
    token: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };

  return cachedToken.token;
}

async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const method = (init?.method || 'GET').toUpperCase();

  // SAFETY: Block non-GET requests in sandbox mode
  if (OLSERA_SANDBOX && method !== 'GET') {
    throw new Error(`[OLSERA SANDBOX] Blocked ${method} request to ${path}. Set OLSERA_SANDBOX_MODE=false to allow writes.`);
  }

  const token = await getToken();
  const finalInit: RequestInit = {
    method: 'GET',
    ...init,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
  };

  const url = `${BASE_URL}${path}`;
  let res = await fetch(url, finalInit);

  if (res.status === 401) {
    console.warn('[Olsera API] 401 received, retrying with fresh token...');
    const token2 = await getToken(true);
    finalInit.headers = {
      ...(finalInit.headers || {}),
      Authorization: `Bearer ${token2}`,
    };
    res = await fetch(url, finalInit);
  }

  if (!res.ok) {
    const body = await res.text();
    console.error(`[Olsera API] ${res.status} ${res.statusText} @ ${url}`);
    console.error(`[Olsera API] Response: ${body}`);
    throw new Error(`Olsera API ${res.status}: ${body}`);
  }

  return res;
}

export async function fetchAllProducts(): Promise<ExpandedProduct[]> {
  let page = 1;
  const perPage = 100;
  let meta: { last_page: number } = { last_page: 1 };
  const parentProducts: OlseraProduct[] = [];

  do {
    const res = await apiFetch(`/product?page=${page}&per_page=${perPage}`);
    if (!res.ok) throw new Error(`Product fetch failed: ${res.status}`);
    const json = await res.json();
    const data: OlseraProduct[] = json.data || [];
    parentProducts.push(...data);
    meta = json.meta || { last_page: page };
    page++;
  } while (page <= meta.last_page);

  return expandProducts(parentProducts);
}

// NOTE: Olsera API returns variants as SEPARATE products (not nested).
// - Variant products appear as separate rows with `parent_id` field.
// - Naming uses '-' separator (e.g., "Parent Name - 3MG") - done by Olsera.
// - Nicotine variants (3MG, 6MG, etc.) follow this pattern.
// - This function handles nested variants (may not be triggered by list API).
// - Variants still sync correctly as separate products from API list.
function expandProducts(parents: OlseraProduct[]): ExpandedProduct[] {
  const rows: ExpandedProduct[] = [];

  for (const parent of parents) {
    const hasVariant = parent.has_variant > 0;
    const variants: OlseraVariant[] = (parent as any).variants || [];

    if (hasVariant && variants.length > 0) {
      for (const v of variants) {
        const variantStock = Number(v.stock_qty) || 0;
        rows.push({
          id: String(v.id),
          olsera_product_id: String(v.id),
          name: `${parent.name} - ${v.name}`,
          sku: v.sku || '',
          category: parent.klasifikasi || parent.category_name || 'Uncategorized',
          brand_name: parent.brand_name || '',
          klasifikasi: parent.klasifikasi || '',
          price: Math.round(Number(v.sell_price_pos) || 0),
          stock: variantStock,
          image_url: getImageUrl(v, parent),
          description: parent.description || '',
          has_variant: 1,
        });
      }
    } else {
      rows.push({
        id: String(parent.id),
        olsera_product_id: String(parent.id),
        name: parent.name,
        sku: parent.sku || '',
        category: parent.klasifikasi || parent.category_name || 'Uncategorized',
        brand_name: parent.brand_name || '',
        klasifikasi: parent.klasifikasi || '',
        price: Math.round(Number(parent.sell_price_pos) || 0),
        stock: Number(parent.stock_qty) || 0,
        image_url: getImageUrl(null, parent),
        description: parent.description || '',
        has_variant: 0,
      });
    }
  }

  return rows;
}
