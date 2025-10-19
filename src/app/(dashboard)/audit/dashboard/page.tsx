'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuditLogTable } from '@/components/audit/AuditLogTable';
import { AuditFilters } from '@/components/audit/AuditFilters';

export default function AuditDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [entries, setEntries] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState<any>({});

  // Check authorization
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      const locale = typeof window !== 'undefined' ? 
        document.documentElement.lang || 'en' : 'en'
      router.push(`/${locale}/login`);
      return;
    }

    const allowedRoles = ['AUDITOR', 'ADMIN'];
    if (!allowedRoles.includes(session.user.role)) {
      router.push('/');
      return;
    }
  }, [session, status, router]);

  // Fetch audit logs
  useEffect(() => {
    if (!session) return;
    
    fetchAuditLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, pagination.page, filters]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom.toISOString());
      if (filters.dateTo) params.append('dateTo', filters.dateTo.toISOString());
      if (filters.userIds) params.append('userIds', filters.userIds.join(','));
      if (filters.actions) params.append('actions', filters.actions.join(','));
      if (filters.entityTypes) params.append('entityTypes', filters.entityTypes.join(','));
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`/api/audit/logs?${params}`);
      const data = await response.json();

      if (data.success) {
        setEntries(data.data.entries);
        setPagination(prev => ({ ...prev, ...data.data.pagination }));
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (entryId: string) => {
    // TODO: Open details modal
    console.log('View details for:', entryId);
  };

  const handleRevert = async (entryId: string) => {
    if (!confirm('Are you sure you want to revert this change?')) return;

    try {
      const response = await fetch('/api/audit/revert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId, confirmation: true }),
      });

      const data = await response.json();
      if (data.success) {
        alert('Change reverted successfully');
        fetchAuditLogs();
      } else {
        alert('Failed to revert change: ' + data.message);
      }
    } catch (error) {
      console.error('Failed to revert change:', error);
      alert('Failed to revert change');
    }
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  if (status === 'loading' || !session) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Audit Trail</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <AuditFilters onFilterChange={handleFilterChange} users={users} />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading audit logs...</p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <AuditLogTable
                  entries={entries}
                  onViewDetails={handleViewDetails}
                  onRevert={session.user.role === 'ADMIN' ? handleRevert : undefined}
                  currentUserRole={session.user.role}
                />
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total entries)
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 1}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page === pagination.totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
