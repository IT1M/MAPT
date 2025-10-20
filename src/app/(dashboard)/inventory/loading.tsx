import { Skeleton, SkeletonTable } from '@/components/ui/skeleton';

export default function InventoryLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center mb-6">
        <Skeleton width={200} height={36} />
        <Skeleton width={120} height={40} variant="rectangular" />
      </div>

      {/* Filters Skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <Skeleton width="100%" height={40} variant="rectangular" />
          </div>
          <Skeleton width="100%" height={40} variant="rectangular" />
          <Skeleton width="100%" height={40} variant="rectangular" />
        </div>
        <div className="mt-4 flex gap-2">
          <Skeleton width={80} height={32} variant="rectangular" />
          <Skeleton width={80} height={32} variant="rectangular" />
        </div>
      </div>

      {/* Table Skeleton */}
      <SkeletonTable rows={10} columns={8} hasHeader />
    </div>
  );
}
