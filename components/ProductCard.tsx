'use client';

import Link from 'next/link';
import { ShoppingCart, Package } from 'lucide-react';
import { ProductCache } from '@/lib/supabase';
import { useCart } from '@/lib/cartContext';

type Props = {
  product: ProductCache;
};

export default function ProductCard({ product }: Props) {
  const { addItem } = useCart();

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  const categoryColors: Record<string, string> = {
    devices: 'bg-blue-500/20 text-blue-400',
    liquids: 'bg-green-500/20 text-green-400',
    accessories: 'bg-orange-500/20 text-orange-400',
    disposables: 'bg-pink-500/20 text-pink-400',
  };

  const badgeClass = categoryColors[product.category] || 'bg-gray-500/20 text-gray-400';

  return (
    <div className="group bg-gray-800 border border-gray-700 rounded-xl overflow-hidden hover:border-amber-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/10 flex flex-col">
      <Link href={`/products/${product.id}`} className="relative overflow-hidden block">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-48 bg-gray-700 flex items-center justify-center">
            <Package className="w-12 h-12 text-gray-500" />
          </div>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white font-semibold text-sm bg-red-600 px-3 py-1 rounded-full">Out of Stock</span>
          </div>
        )}
        {product.stock > 0 && product.stock < 10 && (
          <div className="absolute top-2 right-2">
            <span className="text-xs bg-red-500/90 text-white px-2 py-0.5 rounded-full">Low Stock</span>
          </div>
        )}
      </Link>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${badgeClass}`}>
            {product.category}
          </span>
          <span className="text-xs text-gray-500">{product.stock} left</span>
        </div>

        <Link href={`/products/${product.id}`}>
          <h3 className="text-white font-semibold text-sm leading-snug mb-1 hover:text-amber-400 transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>

        <p className="text-gray-400 text-xs line-clamp-2 mb-3 flex-1">{product.description}</p>

        <div className="flex items-center justify-between mt-auto">
          <span className="text-amber-400 font-bold text-base">{formatPrice(product.price)}</span>
          <button
            onClick={() => addItem(product)}
            disabled={product.stock === 0}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-gray-900 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
