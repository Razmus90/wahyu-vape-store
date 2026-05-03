import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Validate API key
    const apiKey = request.headers.get('X-Api-Key') || request.headers.get('x-api-key');
    const expectedKey = process.env.WAHA_API_KEY;

    if (expectedKey && apiKey !== expectedKey) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Handle WAHA webhook events
    // WAHA sends: { event: 'message.any', payload: { id, body, from, fromMe, timestamp, ... } }
    const event = body.event || '';
    const payload = body.payload || body;

    if (event.startsWith('message') || payload.body) {
      const chatId = payload.from || payload.chatId || payload.id?.remote;
      const fromMe = payload.fromMe || false;
      const message = payload.body || payload.text || '';
      const mediaUrl = payload.media?.url || null;

      if (chatId) {
        await supabaseAdmin.from('whatsapp_messages').insert({
          chat_id: chatId,
          from_me: fromMe,
          message: message,
          media_url: mediaUrl,
          timestamp: new Date(payload.timestamp ? payload.timestamp * 1000 : Date.now()).toISOString(),
          is_read: false,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook error';
    console.error('WhatsApp webhook error:', error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
