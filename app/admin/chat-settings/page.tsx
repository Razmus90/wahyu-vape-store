'use client';

import { useEffect, useMemo, useState } from 'react';
import { Settings, Save, TestTube, Bot, Shield, MessageSquare, Plus, X, Eye, EyeOff } from 'lucide-react';

type Provider = 'openai' | 'anthropic' | 'openrouter';

const PROVIDER_LABELS: Record<Provider, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic Claude',
  openrouter: 'OpenRouter',
};

const defaultGuardrails = {
  blocked_words: [] as string[],
  blocked_topics: [] as string[],
  max_response_length: 500,
  block_profanity: true,
};

export default function ChatSettingsPage() {
  const [settings, setSettings] = useState<{
    provider: Provider;
    model: string;
    system_prompt: string;
    guardrails: typeof defaultGuardrails;
    encrypted_api_keys: Record<string, string>;
    temperature: number;
    max_tokens: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState('');
  const [testMessage, setTestMessage] = useState('Halo, siapa Anda?');
  const [newBlockedWord, setNewBlockedWord] = useState('');
  const [newBlockedTopic, setNewBlockedTopic] = useState('');
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});

  // API key input state (not saved to settings.encrypted_api_keys directly)
  const [apiKeyInputs, setApiKeyInputs] = useState<Record<string, string>>({
    openai: '',
    anthropic: '',
    openrouter: '',
  });

  const hasApiKey = (provider: string): boolean => {
    return !!(settings?.encrypted_api_keys?.[provider] && settings.encrypted_api_keys[provider] !== '');
  };

  const getApiKeyDisplay = (provider: string) => {
    if (showApiKey[provider]) return apiKeyInputs[provider] || '';
    if (hasApiKey(provider)) return '••••••••';
    return '';
  };

  const handleApiKeyChange = (provider: string, value: string) => {
    setApiKeyInputs(prev => ({ ...prev, [provider]: value }));
    setSettings(prev => prev ? {
      ...prev,
      encrypted_api_keys: {
        ...prev.encrypted_api_keys,
        [provider]: value,
      },
    } : null);
  };

  useEffect(() => {
    fetch('/api/admin/chat-settings')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data) {
          const gr = { ...defaultGuardrails, ...(data.data.guardrails || {}) };
          setSettings({
            provider: data.data.provider || 'openai',
            model: data.data.model || 'gpt-3.5-turbo',
            system_prompt: data.data.system_prompt || '',
            guardrails: gr,
            encrypted_api_keys: (data.data.encrypted_api_keys as Record<string, string>) || {},
            temperature: data.data.temperature ?? 0.7,
            max_tokens: data.data.max_tokens ?? 500,
          });
        } else {
          setSettings({
            provider: 'openai',
            model: 'gpt-3.5-turbo',
            system_prompt: 'Anda adalah asisten virtual Wahyu Vape Store. Jawab dengan ramah dalam bahasa Indonesia. Fokus pada produk vape, likuid, dan aksesoris.',
            guardrails: { ...defaultGuardrails },
            encrypted_api_keys: {},
            temperature: 0.7,
            max_tokens: 500,
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        provider: settings.provider,
        model: settings.model,
        system_prompt: settings.system_prompt,
        guardrails: settings.guardrails,
        temperature: settings.temperature,
        max_tokens: settings.max_tokens,
        encrypted_api_keys: settings.encrypted_api_keys,
      };
      const res = await fetch('/api/admin/chat-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        alert('Pengaturan berhasil disimpan!');
        setApiKeyInputs({ openai: '', anthropic: '', openrouter: '' });
      } else {
        alert('Gagal menyimpan: ' + data.error);
      }
    } catch {
      alert('Gagal menyimpan pengaturan.');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!settings) return;
    setTesting(true);
    setTestResult('');
    try {
      const res = await fetch('/api/admin/chat-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: settings.provider,
          model: settings.model,
          encrypted_api_keys: settings.encrypted_api_keys,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setTestResult('Test koneksi berhasil! Respon: ' + (data.data.message || ''));
      } else {
        setTestResult('Test koneksi gagal: ' + (data.error || 'Unknown error'));
      }
    } catch {
      setTestResult('Test gagal. Periksa API key.');
    } finally {
      setTesting(false);
    }
  };

  const addBlockedWord = () => {
    if (!newBlockedWord || !settings) return;
    setSettings({
      ...settings,
      guardrails: {
        ...settings.guardrails,
        blocked_words: [...settings.guardrails.blocked_words, newBlockedWord],
      },
    });
    setNewBlockedWord('');
  };

  const removeBlockedWord = (word: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      guardrails: {
        ...settings.guardrails,
        blocked_words: settings.guardrails.blocked_words.filter((w) => w !== word),
      },
    });
  };

  const addBlockedTopic = () => {
    if (!newBlockedTopic || !settings) return;
    setSettings({
      ...settings,
      guardrails: {
        ...settings.guardrails,
        blocked_topics: [...settings.guardrails.blocked_topics, newBlockedTopic],
      },
    });
    setNewBlockedTopic('');
  };

  const removeBlockedTopic = (topic: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      guardrails: {
        ...settings.guardrails,
        blocked_topics: settings.guardrails.blocked_topics.filter((t) => t !== topic),
      },
    });
  };

  if (loading || !settings) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-6 animate-pulse h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Chat Settings</h1>
        <p className="text-gray-400 text-sm">Configure AI provider, persona, and guardrails for the chat assistant</p>
      </div>

      {/* Provider & Model */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-amber-400" />
          <h2 className="text-white font-semibold">Provider & Model</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-400 text-sm mb-1">Provider</label>
            <select
              value={settings.provider}
              onChange={(e) => {
                const p = e.target.value as Provider;
                setSettings({ ...settings, provider: p });
              }}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none"
            >
              <option value="openai" className="bg-gray-800">OpenAI</option>
              <option value="anthropic" className="bg-gray-800">Anthropic Claude</option>
              <option value="openrouter" className="bg-gray-800">OpenRouter</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Model</label>
            <input
              type="text"
              value={settings.model}
              onChange={(e) => setSettings({ ...settings, model: e.target.value })}
              placeholder="e.g. gpt-3.5-turbo"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none"
            />
            <p className="text-gray-600 text-xs mt-1">Enter model name. For OpenRouter, prefix with author e.g. openai/gpt-4o</p>
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Temperature: {settings.temperature}</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.temperature}
              onChange={(e) => setSettings({ ...settings, temperature: Number(e.target.value) })}
              className="w-full accent-amber-500"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Max Tokens</label>
            <input
              type="number"
              value={settings.max_tokens}
              onChange={(e) => setSettings({ ...settings, max_tokens: Number(e.target.value) })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none"
            />
          </div>
        </div>

        {/* API Keys */}
        <div className="pt-4 border-t border-gray-800 space-y-3">
          <h3 className="text-white text-sm font-semibold">API Keys (Sealed)</h3>
          <p className="text-gray-600 text-xs">API keys dienkripsi dan disimpan di database. Sekali diinput tidak bisa dilihat kembali, hanya bisa diupdate.</p>
          {(Object.keys(PROVIDER_LABELS) as Provider[]).map((prov) => (
            <div key={prov} className="bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300 text-sm font-medium">{PROVIDER_LABELS[prov]}</span>
                {hasApiKey(prov) && (
                  <span className="text-xs text-green-400 bg-green-500/20 px-2 py-0.5 rounded-full">Configured</span>
                )}
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showApiKey[prov] ? 'text' : 'password'}
                    value={getApiKeyDisplay(prov)}
                    onChange={(e) => handleApiKeyChange(prov, e.target.value)}
                    placeholder={`Enter ${PROVIDER_LABELS[prov]} API key...`}
                    readOnly={Boolean(hasApiKey(prov) && !showApiKey[prov])}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none font-mono"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowApiKey(prev => ({ ...prev, [prov]: !prev[prov] }))}
                  className="p-2 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors"
                  title={showApiKey[prov] ? 'Hide' : 'Show'}
                >
                  {showApiKey[prov] ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                </button>
                {hasApiKey(prov) && !showApiKey[prov] && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowApiKey(prev => ({ ...prev, [prov]: true }));
                      setApiKeyInputs(prev => ({ ...prev, [prov]: '' }));
                    }}
                    className="px-3 py-2 bg-amber-500/20 text-amber-400 text-xs rounded-lg hover:bg-amber-500/30 transition-colors"
                  >
                    Update
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gray-800/50 rounded-lg p-3 text-xs text-gray-400">
          <p>API Keys disimpan terenkripsi di database (AES-GCM via JWT_SECRET). File <code>.env</code> tidak perlu diubah.</p>
        </div>
      </div>

      {/* Persona / System Prompt */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-amber-400" />
          <h2 className="text-white font-semibold">Persona (System Prompt)</h2>
        </div>
        <textarea
          value={settings.system_prompt}
          onChange={(e) => setSettings({ ...settings, system_prompt: e.target.value })}
          rows={6}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono outline-none focus:border-amber-500 transition-colors"
          placeholder="Enter system prompt / persona here..."
        />
      </div>

      {/* Guardrails */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-amber-400" />
          <h2 className="text-white font-semibold">Guardrails</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Blocked Words */}
          <div>
            <label className="block text-gray-400 text-sm mb-2">Blocked Words</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newBlockedWord}
                onChange={(e) => setNewBlockedWord(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addBlockedWord()}
                placeholder="Add blocked word..."
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm outline-none"
              />
              <button onClick={addBlockedWord} className="p-1.5 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors">
                <Plus className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {settings.guardrails.blocked_words.map((word) => (
                <span key={word} className="inline-flex items-center gap-1 bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded-full">
                  {word}
                  <button onClick={() => removeBlockedWord(word)}><X className="w-3 h-3" /></button>
                </span>
              ))}
              {settings.guardrails.blocked_words.length === 0 && (
                <p className="text-gray-600 text-xs">No blocked words</p>
              )}
            </div>
          </div>

          {/* Blocked Topics */}
          <div>
            <label className="block text-gray-400 text-sm mb-2">Blocked Topics</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newBlockedTopic}
                onChange={(e) => setNewBlockedTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addBlockedTopic()}
                placeholder="Add blocked topic..."
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm outline-none"
              />
              <button onClick={addBlockedTopic} className="p-1.5 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors">
                <Plus className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {settings.guardrails.blocked_topics.map((topic) => (
                <span key={topic} className="inline-flex items-center gap-1 bg-orange-500/20 text-orange-400 text-xs px-2 py-1 rounded-full">
                  {topic}
                  <button onClick={() => removeBlockedTopic(topic)}><X className="w-3 h-3" /></button>
                </span>
              ))}
              {settings.guardrails.blocked_topics.length === 0 && (
                <p className="text-gray-600 text-xs">No blocked topics</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-800">
          <div>
            <label className="block text-gray-400 text-sm mb-1">Max Response Length (chars)</label>
            <input
              type="number"
              value={settings.guardrails.max_response_length}
              onChange={(e) => setSettings({
                ...settings,
                guardrails: { ...settings.guardrails, max_response_length: Number(e.target.value) },
              })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-gray-300 text-sm mt-6">
              <input
                type="checkbox"
                checked={settings.guardrails.block_profanity}
                onChange={(e) => setSettings({
                  ...settings,
                  guardrails: { ...settings.guardrails, block_profanity: e.target.checked },
                })}
                className="accent-amber-500"
              />
              Block Profanity
            </label>
          </div>
        </div>
      </div>

      {/* Test Chat */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <TestTube className="w-5 h-5 text-amber-400" />
          <h2 className="text-white font-semibold">Test Chat</h2>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            placeholder="Test message..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none"
          />
          <button
            onClick={handleTest}
            disabled={testing}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:bg-gray-700 disabled:text-gray-500 text-gray-900 font-medium text-sm px-4 py-2 rounded-lg transition-colors"
          >
            <TestTube className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />
            {testing ? 'Testing...' : 'Test'}
          </button>
        </div>
        {testResult && (
          <div className={`rounded-lg p-3 text-sm whitespace-pre-wrap ${testResult.includes('berhasil') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
            <p className="text-gray-500 text-xs mb-1">Result:</p>
            {testResult}
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:bg-gray-700 disabled:text-gray-500 text-gray-900 font-semibold text-sm px-6 py-2.5 rounded-lg transition-colors"
        >
          <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
