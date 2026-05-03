import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getWAHACredentials } from '@/lib/whatsapp';

export async function POST(request: NextRequest) {
  try {
    // Validate API key (check DB + env)
    const apiKey = request.headers.get('X-Api-Key') || request.headers.get('x-api-key');
    const { apiKey: expectedKey } = await getWAHACredentials();

    if (expectedKey && apiKey !== expectedKey) {
      console.log('[WAHA-WEBHOOK] Unauthorized request, key:', apiKey?.slice(0, 8) + '...');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('[WAHA-WEBHOOK] Received event:', body.event, 'payload:', JSON.stringify(body.payload)?.slice(0, 200));

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
        console.log('[WAHA-WEBHOOK] Saving message:', { chatId, fromMe, message: message?.slice(0, 50) });
        const { error: insertError } = await supabaseAdmin.from('whatsapp_messages').insert({
          chat_id: chatId,
          from_me: fromMe,
          message: message,
          media_url: mediaUrl,
          timestamp: new Date(payload.timestamp ? payload.timestamp * 1000 : Date.now()).toISOString(),
          is_read: false,
        });
        if (insertError) {
          console.error('[WAHA-WEBHOOK] Failed to save message:', insertError);
        } else {
          console.log('[WAHA-WEBHOOK] Message saved successfully');
        }
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
