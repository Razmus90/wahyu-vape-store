'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ShoppingCart, Package, Tag, CircleAlert } from 'lucide-react';
import { ProductCache } from '@/lib/supabase';
import { useCart } from '@/lib/cartContext';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addItem } = useCart();
  const [product, setProduct] = useState<ProductCache | null>(null);
  const [loading, setLoading] = useState(true);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  useEffect(() => {
    fetch(`/api/products/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setProduct(data.data);
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-6 w-24 bg-gray-800 rounded mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-gray-800 rounded-xl h-96" />
              <div className="space-y-4">
                <div className="h-8 w-24 bg-gray-800 rounded" />
                <div className="h-8 bg-gray-800 rounded w-3/4" />
                <div className="h-6 bg-gray-800 rounded w-1/2" />
                <div className="h-24 bg-gray-800 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <CircleAlert className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Product not found</p>
          <button
            onClick={() => router.push('/products')}
            className="mt-4 text-amber-400 hover:text-amber-300 text-sm transition-colors"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  const categoryColors: Record<string, string> = {
    devices: 'bg-blue-500/20 text-blue-400',
    liquids: 'bg-green-500/20 text-green-400',
    accessories: 'bg-orange-500/20 text-orange-400',
    disposables: 'bg-pink-500/20 text-pink-400',
  };

  const badgeClass = categoryColors[product.category] || 'bg-gray-500/20 text-gray-400';

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-amber-400 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-96 object-cover"
              />
            ) : (
              <div className="w-full h-96 bg-gray-800 flex items-center justify-center">
                <Package className="w-24 h-24 text-gray-600" />
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full capitalize font-medium ${badgeClass}`}>
                <Tag className="w-3 h-3" />
                {product.category}
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-white">{product.name}</h1>

            <p className="text-amber-400 text-2xl font-bold">{formatPrice(product.price)}</p>

            <p className="text-gray-400 leading-relaxed">{product.description || 'No description available.'}</p>

            {/* Stock */}
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-400">Stock:</span>
              {product.stock > 0 ? (
                <span className={`text-sm font-medium ${product.stock < 10 ? 'text-red-400' : 'text-green-400'}`}>
                  {product.stock < 10 ? `Only ${product.stock} left` : `${product.stock} available`}
                </span>
              ) : (
                <span className="text-sm font-medium text-red-400">Out of stock</span>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => addItem(product)}
                disabled={product.stock === 0}
                className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-gray-900 font-semibold py-3 px-6 rounded-xl transition-all"
              >
                <ShoppingCart className="w-5 h-5" />
                Add to Cart
              </button>
              <button
                onClick={() => {
                  addItem(product);
                  router.push('/checkout');
                }}
                disabled={product.stock === 0}
                className="flex-1 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl border border-gray-700 hover:border-amber-500 transition-all"
              >
                Buy Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
