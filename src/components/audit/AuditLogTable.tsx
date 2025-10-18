'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface AuditEntry {
  id: string;
  timestamp: Date;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  action: string;
  entityType: string;
  entityId: string;
  changes: any;
  ipAddress: string;
  userAgent: string;
}

interface AuditLogTableProps {
  entries: AuditEntry[];
  onViewDetails: (entryId: string) => void;
  onRevert?: (entryId: string) => void;
  currentUserRole: string;
}

const actionColors: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-800',
  UPDATE: 'bg-blue-100 text-blue-800',
  DELETE: 'bg-red-100 text-red-800',
  LOGIN: 'bg-gray-100 text-gray-800',
  LOGOUT: 'bg-gray-100 text-gray-800',
  EXPORT: 'bg-purple-100 text-purple-800',
  VIEW: 'bg-sky-100 text-sky-800',
  REVERT: 'bg-orange-100 text-orange-800',
  BACKUP: 'bg-indigo-100 text-indigo-800',
  RESTORE: 'bg-pink-100 text-pink-800',
};

export function AuditLogTable({ entries, onViewDetails, onRevert, currentUserRole }: AuditLogTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Timestamp
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              User
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Action
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Entity
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Entity ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {entries.map((entry) => (
            <>
              <tr key={entry.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex flex-col">
                    <span>{new Date(entry.timestamp).toLocaleString()}</span>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {entry.user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{entry.user.name}</div>
                      <div className="text-sm text-gray-500">{entry.user.role}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${actionColors[entry.action] || 'bg-gray-100 text-gray-800'}`}>
                    {entry.action}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {entry.entityType}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <span className="truncate max-w-xs">{entry.entityId}</span>
                    <button
                      onClick={() => copyToClipboard(entry.entityId)}
                      className="text-gray-400 hover:text-gray-600"
                      title="Copy ID"
                    >
                      📋
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => onViewDetails(entry.id)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    View Details
                  </button>
                  {entry.changes && (
                    <button
                      onClick={() => toggleRow(entry.id)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      {expandedRows.has(entry.id) ? 'Hide' : 'Show'} Changes
                    </button>
                  )}
                  {currentUserRole === 'ADMIN' && entry.action === 'UPDATE' && entry.entityType === 'InventoryItem' && onRevert && (
                    <button
                      onClick={() => onRevert(entry.id)}
                      className="text-orange-600 hover:text-orange-900"
                    >
                      Revert
                    </button>
                  )}
                </td>
              </tr>
              {expandedRows.has(entry.id) && entry.changes && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 bg-gray-50">
                    <div className="text-sm">
                      <h4 className="font-medium text-gray-900 mb-2">Changes:</h4>
                      <pre className="bg-white p-4 rounded border border-gray-200 overflow-x-auto">
                        {JSON.stringify(entry.changes, null, 2)}
                      </pre>
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
