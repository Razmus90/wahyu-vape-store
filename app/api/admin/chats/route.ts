import { NextRequest, NextResponse } from 'next/server';
import { chatService } from '@/lib/services/chatService';

export async function GET(request: NextRequest) {
  try {
    const sessions = await chatService.getAllSessions();

    return NextResponse.json({ success: true, data: sessions });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch chat sessions';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
