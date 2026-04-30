import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/services/aiService';
import { verifyAdmin } from '@/lib/auth';

const PROVIDER_MODELS: Record<string, string[]> = {
  openai: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'gpt-4o', 'gpt-4o-mini'],
  anthropic: ['claude-3-haiku-20240307', 'claude-3-sonnet-20240229', 'claude-3-opus-20240229', 'claude-3-5-sonnet-20241022'],
  openrouter: ['openai/gpt-3.5-turbo', 'openai/gpt-4', 'openai/gpt-4o', 'anthropic/claude-3-haiku', 'anthropic/claude-3-sonnet', 'meta-llama/llama-3-8b-instruct'],
};

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await aiService.getSettings();

    // Mask encrypted API keys before sending to client
    let safeSettings = settings ? {
      ...settings,
      guardrails: settings.guardrails || { blocked_words: [], blocked_topics: [], max_response_length: 500, block_profanity: true },
    } : null;

    if (safeSettings && safeSettings.encrypted_api_keys) {
      const masked: Record<string, string> = {};
      for (const [prov, key] of Object.entries(safeSettings.encrypted_api_keys as Record<string, string>)) {
        masked[prov] = key ? '••••••••' : '';
      }
      safeSettings = { ...safeSettings, encrypted_api_keys: masked };
    }

    return NextResponse.json({
      success: true,
      data: safeSettings,
      providers: Object.keys(PROVIDER_MODELS),
      models: PROVIDER_MODELS,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch chat settings';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { provider, model, system_prompt, guardrails, temperature, max_tokens, encrypted_api_keys } = body;

    const updates: Record<string, unknown> = {};
    if (provider !== undefined) updates.provider = provider;
    if (model !== undefined) updates.model = model;
    if (system_prompt !== undefined) updates.system_prompt = system_prompt;
    if (guardrails !== undefined) updates.guardrails = guardrails;
    if (temperature !== undefined) updates.temperature = Number(temperature);
    if (max_tokens !== undefined) updates.max_tokens = Number(max_tokens);
    if (encrypted_api_keys !== undefined) updates.encrypted_api_keys = encrypted_api_keys;

    const settings = await aiService.saveSettings(updates);

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save chat settings';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { provider, model, encrypted_api_keys } = body;

    const result = await aiService.testConnection(provider, model, encrypted_api_keys);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Connection test failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
