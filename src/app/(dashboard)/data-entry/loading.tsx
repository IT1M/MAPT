import { Skeleton } from '@/components/ui/skeleton';

export default function DataEntryLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <Skeleton width="40%" height={32} className="mb-2" />
          <Skeleton width="60%" height={20} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
              {/* Form Header */}
              <div className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <Skeleton width="30%" height={24} />
                  <Skeleton width={100} height={20} />
                </div>
              </div>

              {/* Form Fields - Two Column Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Item Name */}
                <div className="space-y-2">
                  <Skeleton width="40%" height={16} />
                  <Skeleton width="100%" height={40} variant="rectangular" />
                  <Skeleton width="60%" height={14} />
                </div>

                {/* Batch Number */}
                <div className="space-y-2">
                  <Skeleton width="40%" height={16} />
                  <Skeleton width="100%" height={40} variant="rectangular" />
                  <Skeleton width="60%" height={14} />
                </div>

                {/* Quantity */}
                <div className="space-y-2">
                  <Skeleton width="40%" height={16} />
                  <Skeleton width="100%" height={40} variant="rectangular" />
                </div>

                {/* Reject Quantity */}
                <div className="space-y-2">
                  <Skeleton width="40%" height={16} />
                  <Skeleton width="100%" height={40} variant="rectangular" />
                </div>

                {/* Destination */}
                <div className="space-y-2">
                  <Skeleton width="40%" height={16} />
                  <div className="flex gap-2">
                    <Skeleton width="48%" height={44} variant="rectangular" />
                    <Skeleton width="48%" height={44} variant="rectangular" />
                  </div>
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Skeleton width="40%" height={16} />
                  <Skeleton width="100%" height={40} variant="rectangular" />
                </div>
              </div>

              {/* Notes - Full Width */}
              <div className="space-y-2 mb-6">
                <Skeleton width="30%" height={16} />
                <Skeleton width="100%" height={80} variant="rectangular" />
                <Skeleton width="40%" height={14} />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Skeleton width={120} height={40} variant="rectangular" />
                <Skeleton width={100} height={40} variant="rectangular" />
                <Skeleton width={120} height={40} variant="rectangular" />
              </div>
            </div>
          </div>

          {/* Quick Stats Widget - Desktop Only */}
          <div className="hidden lg:block">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
              {/* Widget Header */}
              <div className="mb-4">
                <Skeleton width="60%" height={20} className="mb-2" />
                <Skeleton width="40%" height={32} />
              </div>

              {/* Recent Entries */}
              <div className="space-y-3 mb-6">
                <Skeleton width="50%" height={18} className="mb-3" />
                {Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className="space-y-2 pb-3 border-b border-gray-200 dark:border-gray-700"
                  >
                    <Skeleton width="80%" height={16} />
                    <Skeleton width="60%" height={14} />
                  </div>
                ))}
              </div>

              {/* Destination Summary */}
              <div className="space-y-3">
                <Skeleton width="50%" height={18} className="mb-3" />
                <div className="flex justify-between">
                  <Skeleton width="40%" height={16} />
                  <Skeleton width={40} height={24} variant="rectangular" />
                </div>
                <div className="flex justify-between">
                  <Skeleton width="40%" height={16} />
                  <Skeleton width={40} height={24} variant="rectangular" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
