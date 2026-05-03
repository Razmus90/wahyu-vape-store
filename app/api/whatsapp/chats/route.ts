import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { getContacts } from '@/lib/whatsapp';

// In-memory contact cache (5 min TTL)
let contactCache: { map: Map<string, string>; expires: number } | null = null;
const CONTACT_CACHE_TTL = 5 * 60 * 1000;

async function getContactNameMap(): Promise<Map<string, string>> {
  const now = Date.now();
  if (contactCache && contactCache.expires > now) {
    return contactCache.map;
  }

  const result = new Map<string, string>();
  try {
    const res = await getContacts();
    if (res.success) {
      ((res.data as any[]) || []).forEach((c: any) => {
        const name = c.name || c.pushname || '';
        if (name) {
          result.set(c.id, name);
        }
      });
    }
  } catch (e: any) {
    console.error('[CHATS-API] Failed to fetch contacts:', e.message);
  }

  contactCache = { map: result, expires: now + CONTACT_CACHE_TTL };
  return result;
}

export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get contact name map (cached)
    const contactNameMap = await getContactNameMap();

    let chatIds: string[] = [];

    if (search) {
      // Search mode: search in messages table + contact names
      const lowerSearch = search.toLowerCase();

      const [msgChatIds, contactMatchedIds] = await Promise.all([
        // Search in messages table (chat_id)
        supabaseAdmin
          .from('whatsapp_messages')
          .select('chat_id')
          .ilike('chat_id', `%${search}%`)
          .then(({ data }) => [...new Set((data || []).map((r: any) => r.chat_id))]),

        // Search in contact names
        (async () => {
          const matched: string[] = [];
          for (const [id, name] of contactNameMap.entries()) {
            if (name.toLowerCase().includes(lowerSearch)) {
              matched.push(id);
            }
          }
          return matched;
        })(),
      ]);

      // Merge and deduplicate
      let merged = [...new Set([...msgChatIds, ...contactMatchedIds])];

      // Deduplicate by name: if same name with @c.us and @lid, prefer @c.us
      const nameToIds = new Map<string, string[]>();
      merged.forEach(id => {
        const name = contactNameMap.get(id) || '';
        if (!nameToIds.has(name)) nameToIds.set(name, []);
        nameToIds.get(name)!.push(id);
      });

      chatIds = [];
      for (const [name, ids] of nameToIds.entries()) {
        if (ids.length === 1) {
          chatIds.push(ids[0]);
        } else {
          // Prefer @c.us over @lid, prefer ones with messages in DB
          const withMessages = ids.filter(id => msgChatIds.includes(id));
          if (withMessages.length > 0) {
            // Has messages: prefer @c.us format
            const cUs = withMessages.find(id => id.endsWith('@c.us'));
            chatIds.push(cUs || withMessages[0]);
          } else {
            // No messages: prefer @c.us format
            const cUs = ids.find(id => id.endsWith('@c.us'));
            chatIds.push(cUs || ids[0]);
          }
        }
      }

      console.log('[CHATS-API] Search "' + search + '":', chatIds.length, 'results (messages:', msgChatIds.length, ', contacts:', contactMatchedIds.length, ')');
    } else {
      // No search: get all chat_ids from messages table (unique, latest first)
      const { data: chatRows, error: chatError } = await supabaseAdmin
        .from('whatsapp_messages')
        .select('chat_id')
        .order('timestamp', { ascending: false });

      if (chatError) throw chatError;

      const seen = new Set<string>();
      (chatRows || []).forEach((row: any) => {
        if (!seen.has(row.chat_id)) {
          seen.add(row.chat_id);
          chatIds.push(row.chat_id);
        }
      });
    }

    if (chatIds.length === 0) {
      return NextResponse.json({ success: true, data: [], total: 0 });
    }

    // Filter out LID IDs (causes duplicates, prefer @c.us)
    const beforeFilter = chatIds.length;
    chatIds = chatIds.filter(id => !id.endsWith('@lid'));
    if (beforeFilter !== chatIds.length) {
      console.log('[CHATS-API] Filtered', beforeFilter - chatIds.length, '@lid IDs');
    }

    // Apply pagination
    const paginatedChats = chatIds.slice(offset, offset + limit);

    // Get last message for each chat from DB
    const { data: lastMessages, error: msgError } = await supabaseAdmin
      .from('whatsapp_messages')
      .select('chat_id, message, timestamp, from_me, is_read')
      .in('chat_id', paginatedChats)
      .order('timestamp', { ascending: false });

    if (msgError) throw msgError;

    // Build chat data map + unread count
    const chatDataMap = new Map<string, any>();
    const unreadCountMap = new Map<string, number>();

    (lastMessages || []).forEach((msg: any) => {
      if (!chatDataMap.has(msg.chat_id)) {
        chatDataMap.set(msg.chat_id, {
          lastMessage: msg.message,
          lastTimestamp: msg.timestamp,
          fromMe: msg.from_me,
        });
      }
      if (!msg.from_me && !msg.is_read) {
        unreadCountMap.set(msg.chat_id, (unreadCountMap.get(msg.chat_id) || 0) + 1);
      }
    });

    // Format chat list with contact names
    const chats = paginatedChats.map(chatId => {
      const data = chatDataMap.get(chatId) || { lastMessage: '', lastTimestamp: '', fromMe: false };
      const contactName = contactNameMap.get(chatId) || '';
      return {
        id: chatId,
        name: contactName || chatId.replace('@c.us', '').replace('@g.us', ''),
        lastMessage: data.lastMessage || '',
        lastTimestamp: data.lastTimestamp || '',
        fromMe: data.fromMe || false,
        unreadCount: unreadCountMap.get(chatId) || 0,
      };
    });

    console.log('[CHATS-API] Returning', chats.length, 'chats, sample:', chats.slice(0, 3).map(c => ({ id: c.id, name: c.name })));

    return NextResponse.json({
      success: true,
      data: chats,
      total: chatIds.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get chats';
    console.error('[CHATS-API] Error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
