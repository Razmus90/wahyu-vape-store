/**
 * iPaymu v2 API Client
 * Based on tested QRIS implementation
 */

import crypto from 'crypto';

interface PaymentResult {
  Status?: number;
  Success?: boolean;
  Message?: string;
  Data?: {
    TransactionId?: number;
    ReferenceId?: string;
    Via?: string;
    Channel?: string;
    QrString?: string;
    QrImage?: string;
    QrTemplate?: string;
    PaymentNo?: string;
    SubTotal?: number;
    Fee?: number;
    Total?: number;
    Expired?: string;
  };
}

interface CreateQRISParams {
  amount: number;
  referenceId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notifyUrl: string;
}

function getConfig() {
  // User's spec: IPAYMU_MODE=true = PRODUCTION, IPAYMU_MODE=false = SANDBOX
  const mode = process.env.IPAYMU_MODE || 'false';
  const isProduction = mode === 'true';
  return {
    apiKey: isProduction
      ? process.env.IPAYMU_PR_API_KEY!
      : process.env.IPAYMU_SB_API_KEY!,
    va: isProduction
      ? process.env.IPAYMU_PR_VA!
      : process.env.IPAYMU_SB_VA!,
    baseUrl: isProduction
      ? 'https://my.ipaymu.com/api/v2'
      : 'https://sandbox.ipaymu.com/api/v2',
  };
}

/**
 * Generate signature for iPaymu v2
 * Formula: HMAC-SHA256("HTTP_METHOD:VA:SHA256(body):API_KEY", apiKey)
 */
function generateSignature(method: string, va: string, body: any, apiKey: string): string {
  const bodyHash = crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');
  const stringToSign = `${method}:${va}:${bodyHash}:${apiKey}`;
  const hmac = crypto.createHmac('sha256', apiKey);
  hmac.update(stringToSign);
  return hmac.digest('hex');
}

/**
 * Get timestamp in YYYYMMDDHHmmss format
 */
function getTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    now.getFullYear() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds())
  );
}

/**
 * Create QRIS payment (returns QR string/image)
 */
export async function createQRISPayment(params: CreateQRISParams): Promise<PaymentResult> {
  const { apiKey, va, baseUrl } = getConfig();

  const body = {
    name: params.customerName,
    phone: params.customerPhone,
    email: params.customerEmail,
    amount: params.amount,
    comments: 'Payment via iPaymu QRIS',
    notifyUrl: params.notifyUrl,
    referenceId: params.referenceId,
    paymentMethod: 'qris',
    paymentChannel: 'linkaja', // REQUIRED for QRIS
  };

  const signature = generateSignature('POST', va, body, apiKey);
  const timestamp = getTimestamp();

  try {
    const response = await fetch(`${baseUrl}/payment/direct`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'va': va,
        'signature': signature,
        'timestamp': timestamp,
      },
      body: JSON.stringify(body),
    });

    return await response.json();
  } catch (error) {
    return {
      Success: false,
      Message: error instanceof Error ? error.message : 'Request failed',
    };
  }
}

/**
 * Verify iPaymu webhook signature
 */
export function verifyIPaymuSignature(
  method: string,
  va: string,
  body: any,
  apiKey: string,
  receivedSignature: string
): boolean {
  const expectedSignature = generateSignature(method, va, body, apiKey);
  return expectedSignature === receivedSignature;
}

export const ipaymuConfig = getConfig;
