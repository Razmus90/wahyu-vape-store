'use client';

import { useMemo, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Zap, Shield, Truck, Star, Package } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { ProductCache } from '@/lib/supabase';

export default function HomePage() {
  const [allProducts, setAllProducts] = useState<ProductCache[]>([]);
  const [loading, setLoading] = useState(true);
  const [featuredValue, setFeaturedValue] = useState('all');

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setAllProducts(data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  // Extract unique klasifikasi values
  const klasifikasiValues = useMemo(() => {
    const values = new Set<string>();
    allProducts.forEach((p) => {
      if (p.klasifikasi) values.add(p.klasifikasi);
    });
    return Array.from(values).sort();
  }, [allProducts]);

  // Find POD value (case-insensitive)
  const podValue = useMemo(() => {
    return klasifikasiValues.find((v) => v.toLowerCase() === 'pod') || klasifikasiValues[0] || '';
  }, [klasifikasiValues]);

  // Default featured to POD if exists
  useEffect(() => {
    if (podValue && featuredValue === 'all') {
      setFeaturedValue(podValue);
    }
  }, [podValue]);

  // Featured products
  const featuredProducts = useMemo(() => {
    const source = featuredValue === 'all'
      ? allProducts
      : allProducts.filter((p) => p.klasifikasi === featuredValue);
    return source.slice(0, 4);
  }, [allProducts, featuredValue]);

  // Generate consistent color for cards
  const getColorClass = (value: string): string => {
    const colors = [
      'from-blue-600 to-blue-800',
      'from-emerald-600 to-emerald-800',
      'from-orange-600 to-orange-800',
      'from-pink-600 to-pink-800',
      'from-purple-600 to-purple-800',
      'from-yellow-600 to-yellow-800',
      'from-cyan-600 to-cyan-800',
      'from-red-600 to-red-800',
    ];
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = value.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const getIcon = (value: string): string => {
    const icons = ['⚡', '💧', '🔧', '✨', '📦', '🎯', '🔥', '💎'];
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = value.charCodeAt(i) + ((hash << 5) - hash);
    }
    return icons[Math.abs(hash) % icons.length];
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 py-20 md:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1.5 mb-6">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 text-sm font-medium">Toko Vape Terpercaya</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-6">
              Temukan Vape<br />
              <span className="text-amber-400">Terbaik Untukmu</span>
            </h1>
            <p className="text-gray-400 text-lg mb-8 max-w-xl leading-relaxed">
              Koleksi lengkap perangkat vape, likuid, dan aksesoris berkualitas. Harga terbaik, kualitas terjamin.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/products" className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold px-6 py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-amber-500/25">
                Belanja Sekarang <ArrowRight className="w-4 h-4" />
              </Link>
              {podValue && (
                <Link href={`/products?klasifikasi=${encodeURIComponent(podValue)}`} className="inline-flex items-center gap-2 border border-gray-600 hover:border-amber-500 text-gray-300 hover:text-amber-400 font-medium px-6 py-3 rounded-xl transition-all">
                  Lihat POD
                </Link>
              )}
            </div>
            </div>
            <div className="relative h-[400px] hidden md:block">
              <Image src="/hero.png" alt="Wahyu Vape Store" fill className="object-contain" />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: 'Produk Original', desc: '100% produk asli bergaransi resmi' },
              { icon: Truck, title: 'Pengiriman Cepat', desc: 'Layanan pengiriman cepat & terpercaya' },
              { icon: Star, title: 'Kualitas Premium', desc: 'Dipercaya oleh ribuan vaper Indonesia' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
                <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{title}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white">Browse Klasifikasi</h2>
            <Link href="/products" className="text-amber-400 hover:text-amber-300 text-sm flex items-center gap-1 transition-colors">
              Semua Produk <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-800 rounded-xl h-32 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {klasifikasiValues.slice(0, 8).map((val) => (
                <Link
                  key={val}
                  href={`/products?klasifikasi=${encodeURIComponent(val)}`}
                  className={`bg-gradient-to-br ${getColorClass(val)} rounded-xl p-6 hover:scale-105 transition-transform duration-200 cursor-pointer group`}
                >
                  <div className="text-3xl mb-3">{getIcon(val)}</div>
                  <p className="text-white font-semibold">{val}</p>
                  <p className="text-white/60 text-xs mt-1 group-hover:text-white/80 transition-colors">Belanja sekarang</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Products */}
      <section className="pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white">
              {featuredValue === 'all' ? 'Produk Unggulan' : `Unggulan: ${featuredValue}`}
            </h2>
            {klasifikasiValues.length > 0 && (
              <select
                value={featuredValue}
                onChange={(e) => setFeaturedValue(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-gray-300 text-sm outline-none"
              >
                <option value="all" className="bg-gray-800">Semua</option>
                {klasifikasiValues.map((val) => (
                  <option key={val} value={val} className="bg-gray-800">{val}</option>
                ))}
              </select>
            )}
          </div>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-800 rounded-xl h-72 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {featuredProducts.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </section>

      {/* Banner */}
      <section className="pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-amber-600 to-amber-500 rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Siap menjelajah?</h3>
              <p className="text-gray-900/70">Lihat katalog lengkap produk vape premium kami.</p>
            </div>
            <Link href="/products" className="flex-shrink-0 bg-gray-900 hover:bg-gray-800 text-white font-semibold px-8 py-3 rounded-xl transition-colors flex items-center gap-2">
              <Package className="w-5 h-5" />
              Semua Produk
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
