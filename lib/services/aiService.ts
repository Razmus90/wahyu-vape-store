import { supabaseAdmin, ChatSettings } from '@/lib/supabase';
import { logService } from './logService';
import { encrypt, decrypt } from '@/lib/crypto';

// Provider SDKs
let OpenAI: any;
let Anthropic: any;

async function getOpenAI() {
  if (!OpenAI) {
    const mod = await import('openai');
    OpenAI = mod.default;
  }
  return OpenAI;
}

async function getAnthropic() {
  if (!Anthropic) {
    const mod = await import('@anthropic-ai/sdk');
    Anthropic = mod.default;
  }
  return Anthropic;
}

// Resolve API key: DB encrypted -> env var fallback
async function getApiKey(provider: string, encryptedKeys?: Record<string, string>): Promise<string> {
  // Try DB first
  if (encryptedKeys && encryptedKeys[provider]) {
    try {
      return await decrypt(encryptedKeys[provider]);
    } catch {
      // fall through to env
    }
  }
  // Fallback to env vars
  const envMap: Record<string, string> = {
    openai: process.env.OPENAI_API_KEY || '',
    anthropic: process.env.ANTHROPIC_API_KEY || '',
    openrouter: process.env.OPENROUTER_API_KEY || '',
  };
  return envMap[provider] || '';
}

export const aiService = {
  async getSettings(): Promise<ChatSettings | null> {
    const { data, error } = await supabaseAdmin
      .from('chat_settings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async saveSettings(settings: Partial<ChatSettings>): Promise<ChatSettings> {
    const current = await this.getSettings();
    // Encrypt API keys if provided
    if (settings.encrypted_api_keys) {
      const encrypted: Record<string, string> = {};
      for (const [provider, key] of Object.entries(settings.encrypted_api_keys)) {
        if (key && key !== '••••••••' && !key.startsWith('enc_')) {
          encrypted[provider] = await encrypt(key);
        } else if (key === '••••••••' || key.startsWith('enc_')) {
          // Keep existing
          const existing = current?.encrypted_api_keys as Record<string, string> || {};
          if (existing[provider]) encrypted[provider] = existing[provider];
        }
      }
      settings.encrypted_api_keys = encrypted;
    }
    // Encrypt embedding API key if provided
    if (settings.embedding_api_key && settings.embedding_api_key !== '••••••••') {
      settings.embedding_api_key = await encrypt(settings.embedding_api_key);
    } else if (settings.embedding_api_key === '••••••••') {
      // Keep existing
      if (current?.embedding_api_key) {
        settings.embedding_api_key = current.embedding_api_key;
      }
    }
    if (current) {
      const { data, error } = await supabaseAdmin
        .from('chat_settings')
        .update({ ...settings, updated_at: new Date().toISOString() })
        .eq('id', current.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabaseAdmin
        .from('chat_settings')
        .insert({ ...settings })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  async generateResponse(userMessage: string, sessionId: string): Promise<string> {
    const settings = await this.getSettings();
    if (!settings) {
      return 'Maaf, pengaturan chat belum dikonfigurasi. Silakan hubungi admin.';
    }

    const guardrails: Record<string, unknown> = (settings.guardrails as Record<string, unknown>) || {};

    // Check blocked words
    const blockedWords = (guardrails['blocked_words'] as string[]) || [];
    for (const word of blockedWords) {
      if (userMessage.toLowerCase().includes(word.toLowerCase())) {
        await logService.create('WARN', 'CHAT_BLOCKED_WORD', `Blocked word detected: ${word}`, { sessionId, word });
        return 'Maaf, pesan Anda mengandung kata yang tidak diizinkan.';
      }
    }

    // Check blocked topics
    const blockedTopics = (guardrails['blocked_topics'] as string[]) || [];
    for (const topic of blockedTopics) {
      if (userMessage.toLowerCase().includes(topic.toLowerCase())) {
        await logService.create('WARN', 'CHAT_BLOCKED_TOPIC', `Blocked topic detected: ${topic}`, { sessionId, topic });
        return 'Maaf, topik tersebut tidak bisa kami bahas. Ada hal lain yang bisa saya bantu?';
      }
    }

    // Fetch product list for context (limit to 10 to avoid overwhelming AI)
    let productContext = '';
    let productList = '';
    try {
      const { data: products, error, count } = await supabaseAdmin
        .from('products_cache')
        .select('name, price, stock, klasifikasi, brand_name', { count: 'exact' })
        .limit(10);
      if (!error && products && products.length > 0) {
        productList = products
          .map(p => `- ${p.name}: Rp${p.price.toLocaleString('id-ID')}, stok ${p.stock}, ${p.klasifikasi || ''} ${p.brand_name || ''}`)
          .join('\n');
        productContext = `DAFTAR PRODUK:
${productList}

CONTOH:
User: "apa saja pod yang tersedia?"
Sasa: "Maaf, kita gak jual pod nih. Produk kita:
${products.slice(0, 3).map(p => `- ${p.name} (Rp${p.price.toLocaleString('id-ID')})`).join('\n')}"

User: "berapa harga liquid X?"
Sasa: "Liquid X gak ada di toko kita ya."

User: "JUUL/SMOK/Vaporesso ada?"
Sasa: "Itu gak ada di kita nih."`;
      }
    } catch (e) {
      console.error('[AI Service] Failed to fetch products:', e);
    }

    // Build conversational system prompt - natural but product-only
    const strictSystemPrompt = productContext
      ? `Kamu Sasa, asisten toko vape WAHYU VAPE STORE.

Tugasmu bantu customer cari produk vape. Jawab santai, ramah, pakai bahasa Indonesia sehari-hari (kayak orang toko ngomong, bukan robot).

ATURAN PENTING:
- Jawab HANYA pakai data produk di bawah. Jangan pakai pengetahuan luar/training.
- Kalau ditanya produk yang gak ada di daftar: "Maaf, produk itu gak ada di toko kita ya."
- Jangan sebut merek luar (JUUL, SMOK, Vaporesso, dll) kecuali masuk daftar.
- Kalau sebut produk, kasih tahu harga (Rp) sama stoknya.
- KALAU USER CUMA SAPA (halo/hi/hello/permisi), jawab singkat aja. JANGAN sebutin daftar produk!

DAFTAR PRODUK KAMI (pakai KALAU user tanya produk):
${productContext}`
      : `Kamu Sasa, asisten toko vape WAHYU VAPE STORE. Jawab: "Maaf, produk kita lagi kosong nih. Coba lagi nanti ya."`;

    const settingsWithCtx = { ...settings, system_prompt: strictSystemPrompt };

    try {
      switch (settings.provider) {
        case 'openai':
          return await this.callOpenAI(userMessage, settingsWithCtx, productContext);
        case 'anthropic':
          return await this.callAnthropic(userMessage, settingsWithCtx, productContext);
        case 'openrouter':
          return await this.callOpenRouter(userMessage, settingsWithCtx, productContext);
        default:
          return 'Provider tidak dikenal.';
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      await logService.create('ERROR', 'AI_GENERATE_FAILED', msg, { provider: settings.provider, sessionId });
      return 'Maaf, terjadi kendala pada sistem AI. Coba lagi nanti.';
    }
  },

  async callOpenAI(userMessage: string, settings: ChatSettings, productContext?: string): Promise<string> {
    const apiKey = await getApiKey('openai', settings.encrypted_api_keys as Record<string, string>);
    if (!apiKey) return 'OpenAI API key belum diatur. Silakan masukkan di Chat Settings.';

    const OpenAIClass = await getOpenAI();
    const client = new OpenAIClass({ apiKey });

    // User message is clean - product context already in system prompt
    const fullUserMessage = userMessage;

    const model = settings.model || 'gpt-3.5-turbo';
    console.log('[OpenAI] Calling model:', model, 'Key length:', apiKey?.length);

    const response = await client.chat.completions.create({
      model: model,
      temperature: settings.temperature || 0.7,
      max_tokens: settings.max_tokens || 500,
      messages: [
        { role: 'system', content: settings.system_prompt },
        { role: 'user', content: fullUserMessage },
      ],
    });

    console.log('[OpenAI] Response:', JSON.stringify(response).substring(0, 500));
    return response.choices[0]?.message?.content || 'Tidak ada respon.';
  },

  async callAnthropic(userMessage: string, settings: ChatSettings, productContext?: string): Promise<string> {
    const apiKey = await getApiKey('anthropic', settings.encrypted_api_keys as Record<string, string>);
    if (!apiKey) return 'Anthropic API key belum diatur. Silakan masukkan di Chat Settings.';

    const AnthropicClass = await getAnthropic();
    const client = new AnthropicClass({ apiKey });

    const fullUserMessage = userMessage;

    const response = await client.messages.create({
      model: settings.model || 'claude-3-haiku-20240307',
      max_tokens: settings.max_tokens || 500,
      temperature: settings.temperature || 0.7,
      system: settings.system_prompt,
      messages: [{ role: 'user', content: fullUserMessage }],
    });

    const textBlock = response.content.find((b: any) => b.type === 'text');
    return (textBlock as any)?.text || 'Tidak ada respon.';
  },

  async callOpenRouter(userMessage: string, settings: ChatSettings, productContext?: string): Promise<string> {
    const apiKey = await getApiKey('openrouter', settings.encrypted_api_keys as Record<string, string>);
    if (!apiKey) return 'OpenRouter API key belum diatur. Silakan masukkan di Chat Settings.';

    const fullUserMessage = userMessage;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'Wahyu Vape Store',
      },
      body: JSON.stringify({
        model: settings.model || 'openai/gpt-3.5-turbo',
        messages: [
          { role: 'system', content: settings.system_prompt },
          { role: 'user', content: fullUserMessage },
        ],
        temperature: settings.temperature || 0.7,
        max_tokens: settings.max_tokens || 500,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenRouter error: ${response.status} ${err}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'Tidak ada respon.';
  },

  async testConnection(provider: string, model: string, encryptedKeys?: Record<string, string>): Promise<{ success: boolean; message: string }> {
    try {
      let keysToUse = encryptedKeys;
      const providedKey = encryptedKeys?.[provider];
      if (!providedKey || providedKey === '••••••••') {
        const dbSettings = await this.getSettings();
        if (dbSettings?.encrypted_api_keys) {
          keysToUse = dbSettings.encrypted_api_keys as Record<string, string>;
        }
      }

      const apiKey = await getApiKey(provider, keysToUse);
      if (!apiKey) return { success: false, message: 'API key belum diatur untuk provider ini.' };

      const testSettings: ChatSettings = {
        id: 'test',
        provider: provider as 'openai' | 'anthropic' | 'openrouter',
        model,
        system_prompt: 'You are a helpful assistant. Reply briefly.',
        encrypted_api_keys: keysToUse || {},
        temperature: 0.7,
        max_tokens: 100,
        created_at: '',
        updated_at: '',
      };

      const testMessage = 'Say "test ok" in one word.';
      let result = '';

      switch (provider) {
        case 'openai':
          result = await this.callOpenAI(testMessage, testSettings);
          break;
        case 'anthropic':
          result = await this.callAnthropic(testMessage, testSettings);
          break;
        case 'openrouter':
          result = await this.callOpenRouter(testMessage, testSettings);
          break;
        default:
          return { success: false, message: 'Provider tidak dikenal' };
      }

      return { success: true, message: `Koneksi berhasil! Respon: ${result.slice(0, 100)}` };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, message: `Koneksi gagal: ${msg}` };
    }
  },

  async generateEmbedding(text: string, settings: ChatSettings): Promise<number[] | null> {
    if (!settings.embedding_api_key) {
      console.error('[Embedding] No API key configured');
      return null;
    }

    let apiKey: string;
    try {
      apiKey = await decrypt(settings.embedding_api_key);
    } catch {
      apiKey = settings.embedding_api_key; // already plain
    }

    const model = settings.embedding_model || 'openai/text-embedding-ada-002';

    try {
      // Use OpenRouter API (OpenAI-compatible) for embeddings
      const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
          'X-Title': 'Wahyu Vape Store',
        },
        body: JSON.stringify({
          model,
          input: text,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`OpenRouter embedding error: ${response.status} ${err}`);
      }

      const data = await response.json();
      return data.data[0].embedding as number[];
    } catch (err) {
      console.error('[Embedding] Failed to generate:', err);
      return null;
    }
  },
};
