'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Settings, QrCode, Play, Square, RefreshCw, Save, Eye, EyeOff } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

function StatusBadge({ status }: { status: string }) {
  const color = status === 'WORKING' ? 'bg-green-500/20 text-green-400 border-green-500/30'
    : status === 'SCAN_QR_CODE' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    : status === 'FAILED' ? 'bg-red-500/20 text-red-400 border-red-500/30'
    : 'bg-gray-500/20 text-gray-400 border-gray-500/30';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${color}`}>
      {status || 'UNKNOWN'}
    </span>
  );
}

export default function WhatsAppSettingsPage() {
  const [sessionName] = useState('default');
  const [actionLoading, setActionLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showKey, setShowKey] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({ waha_api_url: '', waha_api_key: '' });
  const [inputs, setInputs] = useState({ waha_api_url: '', waha_api_key: '' });

  // Fetch settings
  const { data: settingsData, mutate: mutateSettings } = useSWR(
    '/api/admin/whatsapp-settings',
    fetcher
  );

  // Fetch session status
  const { data: statusData, mutate: mutateStatus } = useSWR(
    '/api/whatsapp/session',
    fetcher,
    { refreshInterval: 5000 }
  );

  // Fetch QR
  const { data: qrData, mutate: mutateQr } = useSWR(
    statusData?.data?.status === 'SCAN_QR_CODE' ? '/api/whatsapp/qr' : null,
    fetcher,
    { refreshInterval: 3000 }
  );

  const status = statusData?.data?.status || 'UNKNOWN';
  const isConnected = status === 'WORKING';
  const needsQr = status === 'SCAN_QR_CODE';

  // Load settings into state
  useEffect(() => {
    if (settingsData?.success && settingsData.data) {
      const s = {
        waha_api_url: settingsData.data.waha_api_url || '',
        waha_api_key: settingsData.data.waha_api_key || '',
      };
      setSettings(s);
      setInputs(s);
    }
  }, [settingsData]);

  const handleEdit = () => {
    setInputs({ ...settings });
    setShowKey(false);
    setEditing(true);
  };

  const handleCancel = () => {
    setInputs({ ...settings });
    setEditing(false);
    setShowKey(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/whatsapp-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputs),
      });
      const data = await res.json();
      if (data.success) {
        const saved = data.data;
        setSettings({
          waha_api_url: saved.waha_api_url || '',
          waha_api_key: saved.waha_api_key || '',
        });
        setInputs({
          waha_api_url: saved.waha_api_url || '',
          waha_api_key: saved.waha_api_key || '',
        });
        setEditing(false);
        setShowKey(false);
        alert('WAHA settings saved!');
      } else {
        alert('Failed to save: ' + data.error);
      }
    } catch {
      alert('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleStart = async () => {
    setActionLoading(true);
    try {
      await fetch('/api/whatsapp/session', { method: 'POST' });
      mutateStatus();
    } finally {
      setActionLoading(false);
    }
  };

  const handleStop = async () => {
    setActionLoading(true);
    try {
      await fetch('/api/whatsapp/session', { method: 'DELETE' });
      mutateStatus();
      mutateQr();
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">WAHA Settings</h1>
        <button
          onClick={() => { mutateStatus(); mutateQr(); mutateSettings(); }}
          className="p-2 text-gray-400 hover:text-white transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Session Status */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Session Status</h2>
        <div className="flex items-center gap-4 mb-6">
          <StatusBadge status={status} />
          <span className="text-sm text-gray-400">Session: {sessionName}</span>
        </div>

        <div className="flex gap-3">
          {!isConnected && (
            <button
              onClick={handleStart}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Play className="w-4 h-4" />
              Start Session
            </button>
          )}
          {isConnected && (
            <button
              onClick={handleStop}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Square className="w-4 h-4" />
              Stop Session
            </button>
          )}
        </div>
      </div>

      {/* QR Code */}
      {needsQr && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Scan QR Code
            </h2>
            <button
              onClick={() => mutateQr()}
              className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
            >
              Refresh
            </button>
          </div>
          <div className="flex justify-center p-4 bg-white rounded-lg">
            {qrData?.success ? (
              <img
                src={`data:image/png;base64,${qrData.data}`}
                alt="WhatsApp QR Code"
                className="max-w-xs"
              />
            ) : (
              <p className="text-gray-500 py-8">Loading QR code...</p>
            )}
          </div>
          <p className="text-sm text-gray-400 mt-4 text-center">
            Open WhatsApp on your phone and scan this code to connect
          </p>
        </div>
      )}

      {/* Configuration - NOW EDITABLE */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configuration
          </h2>
          {!editing ? (
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-gray-900 rounded-lg font-medium transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">WAHA API URL</label>
            {editing ? (
              <input
                type="text"
                value={inputs.waha_api_url}
                onChange={(e) => setInputs(prev => ({ ...prev, waha_api_url: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-amber-500 font-mono"
                placeholder="http://localhost:3001"
              />
            ) : (
              <div className="px-3 py-2 bg-gray-800 rounded-lg text-sm text-gray-300 font-mono">
                {settings.waha_api_url || 'http://localhost:3001'}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">WAHA API Key</label>
            {editing ? (
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={inputs.waha_api_key}
                  onChange={(e) => setInputs(prev => ({ ...prev, waha_api_key: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 pr-10 text-sm text-white outline-none focus:border-amber-500 font-mono"
                  placeholder="Enter API key"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-white"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            ) : (
              <div className="px-3 py-2 bg-gray-800 rounded-lg text-sm text-gray-300 font-mono">
                {settings.waha_api_key ? '•'.repeat(24) : '(not set)'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
