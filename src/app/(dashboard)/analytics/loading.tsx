import { Card } from '@/components/ui/card';

export default function AnalyticsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="h-9 w-64 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
          <div className="h-5 w-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="h-10 w-40 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          <div className="h-10 w-40 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        </div>
      </div>

      {/* KPI Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((index) => (
          <Card key={index}>
            <Card.Body>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              </div>
            </Card.Body>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((index) => (
          <Card key={index}>
            <Card.Header>
              <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </Card.Header>
            <Card.Body>
              <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg"></div>
            </Card.Body>
          </Card>
        ))}
      </div>

      {/* Full Width Charts */}
      <div className="grid grid-cols-1 gap-6">
        {[1, 2].map((index) => (
          <Card key={index}>
            <Card.Header>
              <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </Card.Header>
            <Card.Body>
              <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg"></div>
            </Card.Body>
          </Card>
        ))}
      </div>

      {/* AI Insights Panel */}
      <Card>
        <Card.Header>
          <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </Card.Header>
        <Card.Body>
          <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-lg"></div>
        </Card.Body>
      </Card>
    </div>
  );
}
