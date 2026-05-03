import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getWAHACredentials, getContacts, getSessionStatus } from '@/lib/whatsapp';

export async function GET() {
  const result: any = {
    timestamp: new Date().toISOString(),
    checks: {},
  };

  // Check WAHA credentials
  try {
    const { url, apiKey } = await getWAHACredentials();
    result.checks.wahaCredentials = {
      url,
      hasApiKey: !!apiKey,
      apiKeyPrefix: apiKey ? apiKey.slice(0, 8) + '...' : 'missing',
    };
  } catch (e: any) {
    result.checks.wahaCredentials = { error: e.message };
  }

  // Check WAHA session
  try {
    const statusRes = await getSessionStatus('default');
    result.checks.wahaSession = statusRes;
  } catch (e: any) {
    result.checks.wahaSession = { error: e.message };
  }

  // Check WAHA contacts
  try {
    const contactsRes = await getContacts();
    result.checks.wahaContacts = {
      success: contactsRes.success,
      count: contactsRes.success ? (contactsRes.data as any[])?.length : 0,
      error: contactsRes.error,
    };
  } catch (e: any) {
    result.checks.wahaContacts = { error: e.message };
  }

  // Check DB messages
  try {
    const { count, error } = await supabaseAdmin
      .from('whatsapp_messages')
      .select('*', { count: 'exact', head: true });
    result.checks.dbMessages = { count, error: error?.message };

    const { data: chats, error: chatsError } = await supabaseAdmin
      .from('whatsapp_messages')
      .select('chat_id');
    const uniqueChats = new Set((chats || []).map((c: any) => c.chat_id));
    result.checks.dbUniqueChats = { count: uniqueChats.size, error: chatsError?.message };
  } catch (e: any) {
    result.checks.dbMessages = { error: e.message };
  }

  return NextResponse.json(result);
}
