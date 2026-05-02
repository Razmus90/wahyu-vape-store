'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Settings, QrCode, Play, Square, RefreshCw } from 'lucide-react';

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

  const { data: statusData, mutate: mutateStatus } = useSWR(
    '/api/whatsapp/session',
    fetcher,
    { refreshInterval: 5000 }
  );

  const { data: qrData, mutate: mutateQr } = useSWR(
    statusData?.data?.status === 'SCAN_QR_CODE' ? '/api/whatsapp/qr' : null,
    fetcher,
    { refreshInterval: 3000 }
  );

  const status = statusData?.data?.status || 'UNKNOWN';
  const isConnected = status === 'WORKING';
  const needsQr = status === 'SCAN_QR_CODE';

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

  const handleRefreshQr = () => {
    mutateQr();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">WAHA Settings</h1>
        <button
          onClick={() => { mutateStatus(); mutateQr(); }}
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
              onClick={handleRefreshQr}
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

      {/* Configuration */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Configuration</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">WAHA API URL</label>
            <div className="px-3 py-2 bg-gray-800 rounded-lg text-sm text-gray-300 font-mono">
              {process.env.NEXT_PUBLIC_WAHA_API_URL || 'http://localhost:3000'}
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">API Key</label>
            <div className="px-3 py-2 bg-gray-800 rounded-lg text-sm text-gray-300 font-mono">
              {'•'.repeat(24)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Set via WAHA_API_KEY env variable</p>
          </div>
        </div>
      </div>
    </div>
  );
}
