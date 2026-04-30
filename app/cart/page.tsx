'use client';

import Link from 'next/link';
import { useCart } from '@/lib/cartContext';
import { Plus, Minus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';

export default function CartPage() {
  const { items, removeItem, updateQuantity, total, itemCount } = useCart();

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Your cart is empty</h2>
          <p className="text-gray-400 mb-6">Looks like you have not added anything to your cart yet.</p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Browse Products
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-white mb-2">Shopping Cart</h1>
        <p className="text-gray-400 mb-8">{itemCount} item{itemCount !== 1 ? 's' : ''} in your cart</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map(({ product, quantity }) => (
              <div key={product.id} className="flex gap-4 bg-gray-900 border border-gray-800 rounded-xl p-4">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ShoppingBag className="w-8 h-8 text-gray-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <Link href={`/products/${product.id}`} className="text-white font-semibold hover:text-amber-400 transition-colors line-clamp-2">
                    {product.name}
                  </Link>
                  <p className="text-amber-400 font-bold mt-1">{formatPrice(product.price)}</p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(product.id, quantity - 1)}
                        className="w-8 h-8 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors border border-gray-700"
                      >
                        <Minus className="w-3 h-3 text-gray-300" />
                      </button>
                      <span className="text-white text-sm font-medium w-8 text-center">{quantity}</span>
                      <button
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                        disabled={quantity >= product.stock}
                        className="w-8 h-8 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 rounded-lg flex items-center justify-center transition-colors border border-gray-700"
                      >
                        <Plus className="w-3 h-3 text-gray-300" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(product.id)}
                      className="text-red-400 hover:text-red-300 transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
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
              <div className="border-t border-gray-700 pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-medium">Total</span>
                  <span className="text-white font-bold text-xl">{formatPrice(total)}</span>
                </div>
              </div>
              <Link
                href="/checkout"
                className="block w-full bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold py-3 rounded-xl text-center transition-colors"
              >
                Proceed to Checkout
              </Link>
              <Link
                href="/products"
                className="block w-full text-center text-gray-400 hover:text-amber-400 text-sm mt-3 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
