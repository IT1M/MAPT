'use client';

import { useRouter } from 'next/navigation';

export function AddNewItemCard() {
  const router = useRouter();

  return (
    <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg shadow-lg p-8 text-white">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-2xl font-bold mb-2">Add New Item</h3>
          <p className="text-primary-100 mb-6">
            Quickly add a new inventory item to the system
          </p>
          <button
            onClick={() => router.push('/data-entry')}
            className="bg-white text-primary-700 px-6 py-3 rounded-lg font-medium hover:bg-primary-50 transition-colors inline-flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Start Entry
          </button>
        </div>
        <div className="hidden md:block">
          <svg
            className="w-32 h-32 text-primary-300 opacity-50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-primary-400">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-3xl font-bold">Ctrl+N</p>
            <p className="text-sm text-primary-100 mt-1">Quick Add</p>
          </div>
          <div>
            <p className="text-3xl font-bold">Tab</p>
            <p className="text-sm text-primary-100 mt-1">Next Field</p>
          </div>
          <div>
            <p className="text-3xl font-bold">Ctrl+S</p>
            <p className="text-sm text-primary-100 mt-1">Save Entry</p>
          </div>
        </div>
      </div>
    </div>
  );
}
