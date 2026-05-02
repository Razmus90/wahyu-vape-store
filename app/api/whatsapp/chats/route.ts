import { NextRequest, NextResponse } from 'next/server';
import { getContacts } from '@/lib/whatsapp';
import { verifyAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get contacts from waha
    const contactsResult = await getContacts();
    if (!contactsResult.success) {
      return NextResponse.json(contactsResult);
    }

    const contacts = (contactsResult.data as any[]) || [];

    // Get last message for each chat from DB
    const { data: messages } = await supabaseAdmin
      .from('whatsapp_messages')
      .select('chat_id, message, timestamp, from_me')
      .order('timestamp', { ascending: false });

    // Group by chat_id, get last message
    const lastMessages: Record<string, { message: string; timestamp: string; from_me: boolean }> = {};
    (messages || []).forEach((msg: any) => {
      if (!lastMessages[msg.chat_id]) {
        lastMessages[msg.chat_id] = {
          message: msg.message,
          timestamp: msg.timestamp,
          from_me: msg.from_me,
        };
      }
    });

    // Merge contacts with last message
    const chats = contacts.map((contact: any) => ({
      id: contact.id,
      name: contact.name || contact.pushname || contact.id,
      lastMessage: lastMessages[contact.id]?.message || '',
      lastTimestamp: lastMessages[contact.id]?.timestamp || '',
      fromMe: lastMessages[contact.id]?.from_me || false,
    }));

    return NextResponse.json({ success: true, data: chats });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get chats';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
