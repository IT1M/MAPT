import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Offline - Mais Inventory',
  description: 'You are currently offline',
};

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <svg
            className="w-24 h-24 mx-auto text-teal-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-white mb-4">
          You're Offline
        </h1>

        <p className="text-slate-300 mb-8">
          It looks like you've lost your internet connection. Don't worry, you can still view cached data.
          Any changes you make will be saved and synced when you're back online.
        </p>

        <div className="space-y-4">
          <button
            onClick={() => window.location.reload()}
            className="w-full px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors"
          >
            Try Again
          </button>

          <button
            onClick={() => window.history.back()}
            className="w-full px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>

        <div className="mt-8 p-4 bg-slate-800 rounded-lg">
          <h2 className="text-sm font-semibold text-white mb-2">
            Offline Features Available:
          </h2>
          <ul className="text-sm text-slate-300 space-y-1 text-left">
            <li>• View cached inventory data</li>
            <li>• Access previously loaded pages</li>
            <li>• Queue actions for later sync</li>
            <li>• View offline help documentation</li>
          </ul>
        </div>

        <p className="mt-6 text-sm text-slate-400">
          Your pending changes will automatically sync when you reconnect.
        </p>
      </div>
    </div>
  );
}
