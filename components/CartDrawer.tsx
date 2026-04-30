'use client';

import { useRouter } from 'next/navigation';
import { X, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useCart } from '@/lib/cartContext';

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function CartDrawer({ open, onClose }: Props) {
  const { items, removeItem, updateQuantity, total, itemCount } = useCart();
  const router = useRouter();

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  const handleCheckout = () => {
    onClose();
    router.push('/checkout');
  };

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={onClose} />}
      <div className={`fixed right-0 top-0 h-full w-full max-w-sm bg-gray-900 border-l border-gray-700 z-50 transform transition-transform duration-300 flex flex-col ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-400" />
            <h2 className="text-white font-semibold">Cart ({itemCount})</h2>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag className="w-12 h-12 text-gray-600 mb-3" />
              <p className="text-gray-400">Your cart is empty</p>
              <button onClick={onClose} className="mt-4 text-amber-400 hover:text-amber-300 text-sm transition-colors">
                Continue Shopping
              </button>
            </div>
          ) : (
            items.map(({ product, quantity }) => (
              <div key={product.id} className="flex gap-3 bg-gray-800 rounded-lg p-3">
                {product.image_url && (
                  <img src={product.image_url} alt={product.name} className="w-16 h-16 object-cover rounded-md flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium line-clamp-2 leading-tight">{product.name}</p>
                  <p className="text-amber-400 text-sm font-semibold mt-1">
                    {formatPrice(product.price * quantity)}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQuantity(product.id, quantity - 1)}
                        className="w-6 h-6 bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center transition-colors"
                      >
                        <Minus className="w-3 h-3 text-gray-300" />
                      </button>
                      <span className="text-white text-sm w-6 text-center">{quantity}</span>
                      <button
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                        disabled={quantity >= product.stock}
                        className="w-6 h-6 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded flex items-center justify-center transition-colors"
                      >
                        <Plus className="w-3 h-3 text-gray-300" />
                      </button>
                    </div>
                    <button onClick={() => removeItem(product.id)} className="text-red-400 hover:text-red-300 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="p-4 border-t border-gray-700 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Total</span>
              <span className="text-white font-bold text-lg">{formatPrice(total)}</span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold py-3 rounded-xl transition-colors"
            >
              Checkout
            </button>
          </div>
        )}
      </div>
    </>
  );
}
