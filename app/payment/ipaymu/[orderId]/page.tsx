'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Loader2, QrCode } from 'lucide-react';

export default function IpaymuPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  const [loading, setLoading] = useState(true);
  const [qrData, setQrData] = useState<{
    qrString?: string;
    qrImage?: string;
    qrTemplate?: string;
    transactionId?: number;
    expired?: string;
  } | null>(null);
  const [error, setError] = useState('');
  const [polling, setPolling] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (!orderId) return;

    fetch('/api/payment/ipaymu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data) {
          setQrData(data.data);
        } else {
          setError(data.error || 'Failed to create QRIS payment');
        }
      })
      .catch((e) => {
        setError('Failed to create payment: ' + e.message);
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  // Poll for payment status
  useEffect(() => {
    if (!polling || !orderId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        const data = await res.json();
        if (data.success && data.data?.status === 'PAID') {
          setPolling(false);
          // Redirect to thank you page
          setTimeout(() => {
            router.push(`/thank-you?order_id=${orderId}`);
          }, 2000);
        }
      } catch (e) {
        console.error('Polling error:', e);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [polling, orderId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-red-500/30 rounded-xl p-8 max-w-md text-center">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Payment Failed</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => router.push('/checkout')}
            className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold rounded-lg"
          >
            Back to Checkout
          </button>
        </div>
      </div>
    );
  }

  if (!qrData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <QrCode className="w-12 h-12 text-amber-400 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-white mb-2">Scan QRIS Code</h1>
          <p className="text-gray-400 text-sm">
            Use OVO, GoPay, DANA, or LinkAja to scan this QR code
          </p>
        </div>

        {/* QR Code Display */}
        <div className="bg-white rounded-lg p-4 mb-6 flex justify-center">
          {!imageError && qrData.qrImage ? (
            <img
              src={qrData.qrImage}
              alt="iPaymu QRIS Code"
              className="w-48 h-48 object-contain"
              onError={() => setImageError(true)}
            />
          ) : !imageError && qrData.qrTemplate ? (
            <img
              src={qrData.qrTemplate}
              alt="iPaymu QRIS Code"
              className="w-48 h-48 object-contain"
              onError={() => setImageError(true)}
            />
          ) : qrData.qrString ? (
            <div className="text-center">
              <p className="text-xs text-gray-600 mb-2">QR Code from String:</p>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData.qrString)}`}
                alt="QR Code from String"
                className="w-48 h-48 object-contain mx-auto"
                onError={() => setImageError(true)}
              />
              <p className="text-xs text-gray-400 mt-2">Scan with OVO/GoPay/DANA/LinkAja</p>
            </div>
          ) : qrData.qrTemplate ? (
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-2">Open QR Page:</p>
              <a
                href={qrData.qrTemplate}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 hover:text-amber-300 text-sm"
              >
                {qrData.qrTemplate}
              </a>
            </div>
          ) : (
            <div className="text-gray-400">Loading QR code...</div>
          )}
        </div>

        {/* Transaction Info */}
        <div className="space-y-2 mb-6 text-sm">
          <div className="flex justify-between text-gray-400">
            <span>Transaction ID:</span>
            <span className="text-white">{qrData.transactionId}</span>
          </div>
          {qrData.expired && (
            <div className="flex justify-between text-gray-400">
              <span>Expires:</span>
              <span className="text-amber-400">{new Date(qrData.expired).toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Status */}
        {polling && (
          <div className="flex items-center justify-center gap-2 text-amber-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Waiting for payment...
          </div>
        )}

        {/* Fallback */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            QR code not showing?{' '}
            <button
              onClick={() => window.open(qrData.qrTemplate, '_blank')}
              className="text-amber-400 hover:text-amber-300"
            >
              Open QR Page
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
