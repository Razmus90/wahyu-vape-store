import { NextRequest, NextResponse } from 'next/server';
import { chatService } from '@/lib/services/chatService';
import { rateLimit, getRateLimitKey } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const key = getRateLimitKey(req);
    if (!rateLimit(key, 50, 60000)) {
      return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
    }

    const body = await req.json();
    const { message, sessionToken } = body;

    if (!message?.trim()) {
      return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 });
    }

    const session = await chatService.getOrCreateSession(sessionToken);
    await chatService.saveMessage(session.id, 'user', message);
    const reply = await chatService.generateResponse(message, session.id);
    await chatService.saveMessage(session.id, 'assistant', reply);

    return NextResponse.json({
      success: true,
      data: { reply, sessionToken: session.session_token },
    });
  } catch (err) {
    // Supabase errors are plain objects with .message, not Error instances
    const errMsg = err instanceof Error ? err.message
      : (err && typeof err === 'object' && 'message' in err) ? (err as any).message
      : (typeof err === 'string' ? err : JSON.stringify(err));
    const errStack = err instanceof Error ? err.stack : undefined;
    console.error('[Chat API Error]', { message: errMsg, stack: errStack, raw: err });
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}
