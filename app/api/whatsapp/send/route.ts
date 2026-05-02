import { NextRequest, NextResponse } from 'next/server';
import { sendMessage } from '@/lib/whatsapp';
import { verifyAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { chatId, text, session = 'default' } = body;

    if (!chatId || !text) {
      return NextResponse.json(
        { success: false, error: 'chatId and text are required' },
        { status: 400 }
      );
    }

    // Send via waha
    const result = await sendMessage(chatId, text, session);

    // Save outgoing message to DB (best effort)
    if (result.success) {
      await supabaseAdmin.from('whatsapp_messages').insert({
        chat_id: chatId,
        from_me: true,
        message: text,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send message';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
