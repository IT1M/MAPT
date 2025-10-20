'use client';

import { useState } from 'react';

interface AuditFiltersProps {
  onFilterChange: (filters: any) => void;
  users: Array<{ id: string; name: string }>;
}

const actionTypes = [
  'CREATE',
  'UPDATE',
  'DELETE',
  'LOGIN',
  'LOGOUT',
  'EXPORT',
  'VIEW',
  'REVERT',
  'BACKUP',
  'RESTORE',
];
const entityTypes = [
  'InventoryItem',
  'User',
  'Report',
  'Backup',
  'Settings',
  'AuditLog',
];

const datePresets = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Last 7 days', value: 'last7days' },
  { label: 'Last 30 days', value: 'last30days' },
  { label: 'Custom', value: 'custom' },
];

export function AuditFilters({ onFilterChange, users }: AuditFiltersProps) {
  const [datePreset, setDatePreset] = useState('last7days');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [selectedEntities, setSelectedEntities] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  const handleDatePresetChange = (preset: string) => {
    setDatePreset(preset);

    if (preset === 'custom') {
      return;
    }

    const now = new Date();
    let from = new Date();

    switch (preset) {
      case 'today':
        from.setHours(0, 0, 0, 0);
        break;
      case 'yesterday':
        from.setDate(now.getDate() - 1);
        from.setHours(0, 0, 0, 0);
        break;
      case 'last7days':
        from.setDate(now.getDate() - 7);
        break;
      case 'last30days':
        from.setDate(now.getDate() - 30);
        break;
      default:
        return;
    }

    setDateFrom(from.toISOString().split('T')[0]);
    setDateTo(now.toISOString().split('T')[0]);
  };

  const toggleAction = (action: string) => {
    setSelectedActions((prev) =>
      prev.includes(action)
        ? prev.filter((a) => a !== action)
        : [...prev, action]
    );
  };

  const toggleEntity = (entity: string) => {
    setSelectedEntities((prev) =>
      prev.includes(entity)
        ? prev.filter((e) => e !== entity)
        : [...prev, entity]
    );
  };

  const handleApplyFilters = () => {
    onFilterChange({
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      userIds: selectedUsers.length > 0 ? selectedUsers : undefined,
      actions: selectedActions.length > 0 ? selectedActions : undefined,
      entityTypes: selectedEntities.length > 0 ? selectedEntities : undefined,
      search: search || undefined,
    });
  };

  const handleResetFilters = () => {
    setDatePreset('last7days');
    setDateFrom('');
    setDateTo('');
    setSelectedUsers([]);
    setSelectedActions([]);
    setSelectedEntities([]);
    setSearch('');
    onFilterChange({});
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Filters</h3>

      {/* Date Range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Date Range
        </label>
        <select
          value={datePreset}
          onChange={(e) => handleDatePresetChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {datePresets.map((preset) => (
            <option key={preset.value} value={preset.value}>
              {preset.label}
            </option>
          ))}
        </select>
        {datePreset === 'custom' && (
          <div className="mt-2 space-y-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="From"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="To"
            />
          </div>
        )}
      </div>

      {/* Search */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search
        </label>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search entity ID, IP address..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Action Types */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Action Types
        </label>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {actionTypes.map((action) => (
            <label key={action} className="flex items-center">
              <input
                type="checkbox"
                checked={selectedActions.includes(action)}
                onChange={() => toggleAction(action)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700">{action}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Entity Types */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Entity Types
        </label>
        <div className="space-y-2">
          {entityTypes.map((entity) => (
            <label key={entity} className="flex items-center">
              <input
                type="checkbox"
                checked={selectedEntities.includes(entity)}
                onChange={() => toggleEntity(entity)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700">{entity}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <button
          onClick={handleApplyFilters}
          className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          Apply Filters
        </button>
        <button
          onClick={handleResetFilters}
          className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
