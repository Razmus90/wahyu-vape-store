import { supabase, supabaseAdmin, ChatSession, ChatMessage } from '@/lib/supabase';
import { productService } from './productService';
import { logService } from './logService';
import { aiService } from './aiService';

export const chatService = {
  async getOrCreateSession(token?: string): Promise<ChatSession> {
    if (token) {
      const { data } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('session_token', token)
        .maybeSingle();
      if (data) {
        await supabaseAdmin.from('chat_sessions').update({ last_active_at: new Date().toISOString() }).eq('id', data.id);
        return data;
      }
    }

    const { data: session, error } = await supabase
      .from('chat_sessions')
      .insert({ customer_name: 'Guest' })
      .select()
      .single();
    if (error) throw error;
    return session;
  },

  async saveMessage(sessionId: string, role: 'user' | 'assistant', content: string): Promise<ChatMessage> {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({ session_id: sessionId, role, content })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async generateResponse(userMessage: string, sessionId: string): Promise<string> {
    // Try AI service first
    try {
      return await aiService.generateResponse(userMessage, sessionId);
    } catch (err) {
      await logService.create('WARN', 'AI_FALLBACK', `AI failed, using rule-based: ${err instanceof Error ? err.message : 'Unknown'}`, { sessionId });
      // Fallback to rule-based
    }

    try {
      const lowerMsg = userMessage.toLowerCase();
      const products = await productService.getAll();

    if (lowerMsg.includes('harga') || lowerMsg.includes('price') || lowerMsg.includes('berapa')) {
      const productMentioned = products.find((p) => lowerMsg.includes(p.name.toLowerCase().split(' ')[0]));
      if (productMentioned) {
        return `Harga **${productMentioned.name}** adalah **Rp ${productMentioned.price.toLocaleString('id-ID')}**. Stok tersedia: ${productMentioned.stock} unit. Mau saya bantu tambahkan ke keranjang?`;
      }
      const cheapest = [...products].sort((a, b) => a.price - b.price).slice(0, 3);
      return `Berikut beberapa produk terjangkau kami:\n${cheapest.map((p) => `• **${p.name}** - Rp ${p.price.toLocaleString('id-ID')}`).join('\n')}\n\nKetik nama produk untuk info lebih lanjut!`;
    }

    if (lowerMsg.includes('stok') || lowerMsg.includes('stock') || lowerMsg.includes('tersedia')) {
      const inStock = products.filter((p) => p.stock > 0);
      return `Saat ini kami memiliki **${inStock.length} produk** dengan stok tersedia dari total ${products.length} produk.\n\nProduk dengan stok tinggi:\n${inStock.sort((a, b) => b.stock - a.stock).slice(0, 3).map((p) => `• **${p.name}** - ${p.stock} unit`).join('\n')}`;
    }

    if (lowerMsg.includes('liquid') || lowerMsg.includes('juice')) {
      const liquids = products.filter((p) => p.category === 'liquids');
      return `Kami punya **${liquids.length} vape liquid** pilihan:\n${liquids.map((p) => `• **${p.name}** - Rp ${p.price.toLocaleString('id-ID')} (Stok: ${p.stock})`).join('\n')}\n\nSemua liquid berkualitas premium!`;
    }

    if (lowerMsg.includes('device') || lowerMsg.includes('mod') || lowerMsg.includes('pod')) {
      const devices = products.filter((p) => p.category === 'devices');
      return `Koleksi device kami:\n${devices.map((p) => `• **${p.name}** - Rp ${p.price.toLocaleString('id-ID')}`).join('\n')}\n\nButuh rekomendasi untuk pemula atau pengguna advanced?`;
    }

    if (lowerMsg.includes('pemula') || lowerMsg.includes('beginner') || lowerMsg.includes('baru')) {
      const starter = products.find((p) => p.name.toLowerCase().includes('starter') || p.name.toLowerCase().includes('pod'));
      if (starter) {
        return `Untuk pemula, kami sangat merekomendasikan **${starter.name}** seharga **Rp ${starter.price.toLocaleString('id-ID')}**!\n\n${starter.description}\n\nProduk ini mudah digunakan dan cocok untuk yang baru mulai. Stok tersisa: ${starter.stock} unit.`;
      }
    }

    if (lowerMsg.includes('disposable') || lowerMsg.includes('sekali pakai')) {
      const disposables = products.filter((p) => p.category === 'disposables');
      return `Produk disposable kami:\n${disposables.map((p) => `• **${p.name}** - Rp ${p.price.toLocaleString('id-ID')}`).join('\n')}\n\nPraktis dan langsung pakai, cocok untuk on-the-go!`;
    }

    if (lowerMsg.includes('rekomendasi') || lowerMsg.includes('recommend') || lowerMsg.includes('terbaik') || lowerMsg.includes('bagus')) {
      const topProducts = products.slice(0, 4);
      return `Rekomendasi produk terlaris kami:\n${topProducts.map((p) => `• **${p.name}** - Rp ${p.price.toLocaleString('id-ID')}`).join('\n')}\n\nSemua produk bergaransi kualitas. Ada yang ingin Anda ketahui lebih lanjut?`;
    }

    if (lowerMsg.includes('promo') || lowerMsg.includes('diskon') || lowerMsg.includes('sale')) {
      return `Saat ini kami memiliki promo spesial:\n• Pembelian min. Rp 300.000 gratis ongkir\n• Bundle liquid 3 botol diskon 10%\n• Gratis coil untuk pembelian device\n\nHubungi kami untuk info promo lebih lanjut!`;
    }

    if (lowerMsg.includes('pengiriman') || lowerMsg.includes('kirim') || lowerMsg.includes('delivery')) {
      return `Info pengiriman:\n• Estimasi 1-3 hari kerja\n• Tersedia pengiriman same-day untuk area Jakarta\n• Semua produk dikemas aman dan rapi`;
    }

    if (lowerMsg.includes('halo') || lowerMsg.includes('hai') || lowerMsg.includes('hello') || lowerMsg.includes('hi')) {
      return `Halo! Selamat datang di **Wahyu Vape Store**!\n\nSaya asisten virtual kami. Saya bisa membantu Anda dengan:\n• Info produk dan harga\n• Rekomendasi produk\n• Cek stok\n• Info pengiriman\n• Promo terkini\n\nAda yang bisa saya bantu?`;
    }

    await logService.create('DEBUG', 'CHAT_UNMATCHED', `Unmatched query: ${userMessage.substring(0, 100)}`, { sessionId });

    return `Terima kasih sudah menghubungi **Wahyu Vape Store**!\n\nSaat ini kami memiliki **${products.length} produk** pilihan. Anda bisa tanya tentang:\n• Harga produk tertentu\n• Stok tersedia\n• Rekomendasi untuk pemula\n• Info liquid, device, atau accessories\n\nAda yang ingin Anda tanyakan?`;
  } catch (err) {
    await logService.create('ERROR', 'CHAT_RULE_FALLBACK_FAILED', err instanceof Error ? err.message : 'Unknown', { sessionId });
    return 'Maaf, sistem sedang gangguan. Silakan coba lagi nanti atau hubungi admin.';
  }
  },

  async getAllSessions(limit = 50): Promise<ChatSession[]> {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*, chat_messages(*)')
      .order('last_active_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  },
};
