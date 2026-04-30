'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, ChevronDown } from 'lucide-react';
import { Log } from '@/lib/supabase';

const levelColors: Record<string, string> = {
  INFO: 'bg-blue-500/20 text-blue-400',
  WARN: 'bg-amber-500/20 text-amber-400',
  ERROR: 'bg-red-500/20 text-red-400',
  DEBUG: 'bg-gray-500/20 text-gray-400',
};

const levelFilters = ['all', 'INFO', 'WARN', 'ERROR', 'DEBUG'];

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [levelFilter, setLevelFilter] = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);

  const fetchLogs = () => {
    setLoading(true);
    const params = levelFilter !== 'all' ? `?level=${levelFilter}` : '';
    fetch(`/api/admin/logs${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setLogs(data.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, [levelFilter]);

  const formatTime = (date: string) =>
    new Date(date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">System Logs</h1>
          <p className="text-gray-400 text-sm">Monitor system activity and errors</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
            >
              Level: {levelFilter === 'all' ? 'All' : levelFilter}
              <ChevronDown className="w-4 h-4" />
            </button>
            {filterOpen && (
              <div className="absolute right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10 py-1 min-w-[140px]">
                {levelFilters.map((level) => (
                  <button
                    key={level}
                    onClick={() => {
                      setLevelFilter(level);
                      setFilterOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      levelFilter === level ? 'text-amber-400 bg-amber-500/10' : 'text-gray-300 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    {level === 'all' ? 'All' : level}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={fetchLogs}
            className="flex items-center gap-2 bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-lg px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4 animate-pulse h-14" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-20">
          <RefreshCw className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No logs found</p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-4 py-3 text-gray-400 font-medium w-24">Level</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Action</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium hidden sm:table-cell">Message</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium hidden md:table-cell">Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${levelColors[log.level] || 'bg-gray-500/20 text-gray-400'}`}>
                        {log.level}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white font-medium">{log.action}</td>
                    <td className="px-4 py-3 text-gray-400 hidden sm:table-cell max-w-md truncate">{log.message}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell whitespace-nowrap">{formatTime(log.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
