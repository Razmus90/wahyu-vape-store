import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdmin } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const chatId = params.chatId;

    // Get messages for this chat
    const { data, error } = await supabaseAdmin
      .from('whatsapp_messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('timestamp', { ascending: true });

    if (error) throw error;

    // Mark messages as read
    await supabaseAdmin
      .from('whatsapp_messages')
      .update({ is_read: true })
      .eq('chat_id', chatId)
      .eq('from_me', false);

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get messages';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
