import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const WAHA_KEY = process.env.WAHA_API_KEY || '';

export async function POST(request: NextRequest) {
  try {
    // Verify API key
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== WAHA_KEY) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const event = body.event;
    const payload = body.payload;

    // Handle message events
    if (event === 'message.any') {
      const chatId = payload?.key?.remoteJid || '';
      const fromMe = payload?.key?.fromMe || false;
      const text = payload?.message?.conversation || payload?.message?.extendedTextMessage?.text || '';
      const mediaUrl = payload?.message?.imageMessage?.url || payload?.message?.audioMessage?.url || '';

      if (!chatId) {
        return NextResponse.json({ success: false, error: 'Missing chatId' }, { status: 400 });
      }

      // Save to DB
      const { error } = await supabaseAdmin.from('whatsapp_messages').insert({
        chat_id: chatId,
        from_me: fromMe,
        message: text,
        media_url: mediaUrl,
      });

      if (error) throw error;

      return NextResponse.json({ success: true, message: 'Message saved' });
    }

    // Handle session status events
    if (event === 'session.status') {
      const status = payload?.status || 'UNKNOWN';
      const sessionName = payload?.name || 'default';

      await supabaseAdmin
        .from('whatsapp_sessions')
        .upsert({
          session_name: sessionName,
          status: status,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'session_name' });

      return NextResponse.json({ success: true, message: 'Status updated' });
    }

    return NextResponse.json({ success: true, message: 'Event ignored' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook failed';
    console.error('[WHATSAPP WEBHOOK]', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
