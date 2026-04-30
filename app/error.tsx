'use client';

import { TriangleAlert as AlertTriangle, Chrome as Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Something went wrong</h2>
        <p className="text-gray-400 mb-8">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Try again
          </button>
          <a
            href="/"
            className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white font-medium px-6 py-3 rounded-xl border border-gray-700 transition-colors"
          >
            <Home className="w-4 h-4" />
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}
