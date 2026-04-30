'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/lib/cartContext';
import { useRouter } from 'next/navigation';
import { CircleCheck, CircleAlert, Loader } from 'lucide-react';

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [paymentToken, setPaymentToken] = useState<string | null>(null);
  const [waitingPayment, setWaitingPayment] = useState(false);

  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    customer_address: '',
    notes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    if (!paymentToken) return;

    let interval: NodeJS.Timeout | null = null;
    let payCalled = false;

    const trySnapPay = () => {
      if (payCalled) return;
      if (typeof window === 'undefined' || !(window as any).snap) return;

      payCalled = true;
      if (interval) clearInterval(interval);

      setWaitingPayment(true);
      const snap = (window as any).snap;
      snap.pay(paymentToken, {
        onSuccess: function (result: any) {
          setWaitingPayment(false);
          clearCart();
          setSuccess(true);
        },
        onPending: function (result: any) {
          console.log('Payment pending:', result);
        },
        onError: function (result: any) {
          setWaitingPayment(false);
          setError('Payment failed: ' + (result.status_message || 'Unknown error'));
        },
        onClose: function () {
          setWaitingPayment(false);
          setError('Payment cancelled. Please try again.');
        },
      });
    };

    trySnapPay();

    if (typeof window !== 'undefined' && !(window as any).snap) {
      interval = setInterval(trySnapPay, 500);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [paymentToken]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      setError('Your cart is empty');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: form.customer_name,
          customer_email: form.customer_email,
          customer_phone: form.customer_phone,
          customer_address: form.customer_address,
          notes: form.notes,
          items: items.map((item) => ({
            product_id: item.product.id,
            product_name: item.product.name,
            quantity: item.quantity,
            unit_price: item.product.price,
          })),
        }),
      });

      const orderData = await orderRes.json();
      if (!orderData.success) {
        setError(orderData.error || 'Failed to create order');
        setLoading(false);
        return;
      }

      const createdOrderId = orderData.data.id;
      setOrderId(createdOrderId);

      try {
        const paymentRes = await fetch('/api/payment/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: createdOrderId }),
        });

        const paymentResult = await paymentRes.json();
        if (paymentResult.success) {
          setPaymentToken(paymentResult.data.token);
        } else {
          setError(paymentResult.error || 'Payment creation failed');
          setLoading(false);
        }
      } catch {
        setError('Payment creation failed. Please try placing the order again.');
        setLoading(false);
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  if (waitingPayment) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-amber-400 mx-auto mb-4 animate-spin" />
          <p className="text-white text-lg">Waiting for payment...</p>
          <p className="text-gray-400 text-sm mt-2">Please scan the QR code to complete payment</p>
        </div>
      </div>
    );
  }

  if (items.length === 0 && !success) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <CircleAlert className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Your cart is empty</p>
          <button
            onClick={() => router.push('/products')}
            className="mt-4 text-amber-400 hover:text-amber-300 text-sm transition-colors"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 text-center">
          <CircleCheck className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Order Created!</h2>
          <p className="text-gray-400 mb-2">Your order has been placed successfully.</p>
          <p className="text-gray-500 text-sm mb-6">Order ID: {orderId}</p>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/products')}
              className="w-full bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold py-3 rounded-xl transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-white mb-2">Checkout</h1>
        <p className="text-gray-400 mb-8">Complete your order</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  <CircleAlert className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
                <h2 className="text-white font-bold text-lg">Customer Information</h2>
                <div>
                  <label className="block text-gray-400 text-sm mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    name="customer_name"
                    value={form.customer_name}
                    onChange={handleChange}
                    required
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-colors"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1.5">Email *</label>
                  <input
                    type="email"
                    name="customer_email"
                    value={form.customer_email}
                    onChange={handleChange}
                    required
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-colors"
                    placeholder="Enter your email"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1.5">Phone Number</label>
                  <input
                    type="tel"
                    name="customer_phone"
                    value={form.customer_phone}
                    onChange={handleChange}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-colors"
                    placeholder="Enter your phone number"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1.5">Address</label>
                  <input
                    type="text"
                    name="customer_address"
                    value={form.customer_address}
                    onChange={handleChange}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-colors"
                    placeholder="Enter your delivery address"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1.5">Notes</label>
                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    rows={3}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-colors resize-none"
                    placeholder="Any special instructions?"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-gray-700 disabled:text-gray-500 text-gray-900 font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Place Order'
                )}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 sticky top-24">
              <h2 className="text-white font-bold text-lg mb-4">Order Summary</h2>
              <div className="space-y-3 mb-6">
                {items.map(({ product, quantity }) => (
                  <div key={product.id} className="flex justify-between text-sm">
                    <span className="text-gray-400 truncate pr-2">{product.name} x{quantity}</span>
                    <span className="text-white font-medium whitespace-nowrap">{formatPrice(product.price * quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-700 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-medium">Total</span>
                  <span className="text-white font-bold text-xl">{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
