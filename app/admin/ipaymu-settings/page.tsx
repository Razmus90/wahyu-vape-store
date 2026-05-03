'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, CreditCard, TestTube, Eye, EyeOff } from 'lucide-react';

export default function IpaymuSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [testResult, setTestResult] = useState('');
  const [showSbApi, setShowSbApi] = useState(false);
  const [showPrApi, setShowPrApi] = useState(false);

  const [settings, setSettings] = useState({
    is_production: false,
    sb_api_key: '',
    sb_va: '',
    sb_mode: 'sandbox',
    pr_api_key: '',
    pr_va: '',
  });

  const [inputs, setInputs] = useState({ ...settings });

  useEffect(() => {
    fetch('/api/admin/ipaymu-settings', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data) {
          const s = {
            is_production: data.data.is_production || false,
            sb_api_key: data.data.sb_api_key || '',
            sb_va: data.data.sb_va || '',
            sb_mode: data.data.sb_mode || 'sandbox',
            pr_api_key: data.data.pr_api_key || '',
            pr_va: data.data.pr_va || '',
          };
          setSettings(s);
          setInputs(s);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleEdit = () => {
    setInputs({ ...settings });
    setShowSbApi(false);
    setShowPrApi(false);
    setEditing(true);
  };

  const handleCancel = () => {
    setInputs({ ...settings });
    setEditing(false);
    setShowSbApi(false);
    setShowPrApi(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/ipaymu-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(inputs),
      });
      const data = await res.json();
      if (data.success) {
        const saved = data.data;
        const s = {
          is_production: saved.is_production || false,
          sb_api_key: saved.sb_api_key || '',
          sb_va: saved.sb_va || '',
          pr_api_key: saved.pr_api_key || '',
          pr_va: saved.pr_va || '',
        };
        setSettings(s);
        setInputs(s);
        setEditing(false);
        setShowSbApi(false);
        setShowPrApi(false);
        alert('Pengaturan iPaymu berhasil disimpan!');
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
    setTesting(true);
    setTestResult('');
    try {
      const res = await fetch('/api/admin/ipaymu-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(inputs),
      });
      if (!res.ok) throw new Error('Save failed');

      const testRes = await fetch('/api/admin/ipaymu-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ test: true }),
      });
      const testData = await testRes.json();
      if (testData.success) {
        setTestResult('Test koneksi berhasil!');
      } else {
        setTestResult('Test koneksi gagal: ' + (testData.error || 'Unknown error'));
      }
    } catch {
      setTestResult('Test koneksi gagal.');
    } finally {
      setTesting(false);
    }
  };

  const updateInput = (field: string, value: string | boolean) => {
    setInputs((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-6 animate-pulse h-32" />
        ))}
      </div>
    );
  }

  const activeLabel = settings.is_production ? 'Production' : 'Sandbox';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">iPaymu Settings</h1>
        <p className="text-gray-400 text-sm">Configure iPaymu payment gateway credentials</p>
      </div>

      {/* Mode Toggle */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white font-semibold">Environment Mode</h2>
            <p className="text-gray-400 text-sm">Currently: <span className="text-amber-400">{activeLabel}</span></p>
          </div>
          <button
            type="button"
            onClick={async () => {
              const next = !settings.is_production;
              setSettings(prev => ({ ...prev, is_production: next }));
              setInputs(prev => ({ ...prev, is_production: next }));
              try {
                const res = await fetch('/api/admin/ipaymu-settings', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({ is_production: next }),
                });
                const data = await res.json();
                if (data.success) {
                  const saved = data.data;
                  setSettings(prev => ({
                    ...prev,
                    is_production: saved.is_production || false,
                  }));
                }
              } catch (e) {
                console.error('Failed to save toggle:', e);
              }
            }}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.is_production ? 'bg-amber-500' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.is_production ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        <p className="text-gray-600 text-xs">
          {settings.is_production
            ? 'Production mode: Real transactions with real money. Ensure keys are valid.'
            : 'Sandbox mode: Test transactions only. Safe for development.'}
        </p>
      </div>

      {/* Sandbox Keys */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <h2 className="text-white font-semibold">Sandbox Keys</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-400 text-sm mb-1">SB API Key</label>
            <input
              type="text"
              value={editing ? inputs.sb_api_key : settings.sb_api_key}
              onChange={(e) => updateInput('sb_api_key', e.target.value)}
              disabled={!editing}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none disabled:opacity-60 font-mono"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">SB VA Number</label>
            <input
              type="text"
              value={editing ? inputs.sb_va : settings.sb_va}
              onChange={(e) => updateInput('sb_va', e.target.value)}
              disabled={!editing}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none disabled:opacity-60"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">SB Mode</label>
            <input
              type="text"
              value={editing ? inputs.sb_mode : settings.sb_mode}
              onChange={(e) => updateInput('sb_mode', e.target.value)}
              disabled={!editing}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none disabled:opacity-60"
            />
          </div>
        </div>
      </div>

      {/* Production Keys */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <h2 className="text-white font-semibold">Production Keys</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-400 text-sm mb-1">PR API Key</label>
            <div className="relative">
              <input
                type={showPrApi ? 'text' : 'password'}
                value={editing ? inputs.pr_api_key : settings.pr_api_key}
                onChange={(e) => updateInput('pr_api_key', e.target.value)}
                disabled={!editing}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 pr-10 text-white text-sm outline-none disabled:opacity-60 font-mono"
              />
              {editing && (
                <button
                  type="button"
                  onClick={() => setShowPrApi(!showPrApi)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-white"
                >
                  {showPrApi ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">PR VA Number</label>
            <input
              type="text"
              value={editing ? inputs.pr_va : settings.pr_va}
              onChange={(e) => updateInput('pr_va', e.target.value)}
              disabled={!editing}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none disabled:opacity-60"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleTest}
          disabled={testing}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-300 text-sm px-4 py-2 rounded-lg transition-colors"
        >
          <TestTube className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />
          {testing ? 'Testing...' : 'Test Connection'}
        </button>

        <div className="flex gap-2">
          {editing ? (
            <>
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-gray-400 hover:text-white text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:bg-gray-700 disabled:text-gray-500 text-gray-900 font-semibold text-sm px-6 py-2 rounded-lg transition-colors"
              >
                <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </>
          ) : (
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm px-4 py-2 rounded-lg transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              Edit Settings
            </button>
          )}
        </div>
      </div>

      {testResult && (
        <div className={`rounded-lg p-3 text-sm ${
          testResult.includes('berhasil')
            ? 'bg-green-500/10 text-green-400'
            : 'bg-red-500/10 text-red-400'
        }`}>
          {testResult}
        </div>
      )}
    </div>
  );
}
