'use client'

import React from 'react'
import { Clock, TrendingUp } from 'lucide-react'

interface SlowEndpoint {
  endpoint: string
  avgDuration: number
  count: number
}

interface SlowEndpointsTableProps {
  endpoints: SlowEndpoint[]
}

export function SlowEndpointsTable({ endpoints }: SlowEndpointsTableProps) {
  if (endpoints.length === 0) {
    return (
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Slow Endpoints</h3>
        <div className="text-center py-8 text-gray-500">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No slow endpoints detected</p>
          <p className="text-sm mt-1">All endpoints are responding within acceptable time</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Slow Endpoints</h3>
        <span className="text-sm text-gray-500">
          {endpoints.length} endpoint{endpoints.length !== 1 ? 's' : ''} need optimization
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                Endpoint
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                Avg Duration
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                Requests
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {endpoints.map((endpoint, index) => {
              const severity =
                endpoint.avgDuration > 5000
                  ? 'critical'
                  : endpoint.avgDuration > 2000
                  ? 'warning'
                  : 'normal'

              return (
                <tr key={index} className="border-b last:border-b-0 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {endpoint.endpoint}
                    </code>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span
                      className={`font-semibold ${
                        severity === 'critical'
                          ? 'text-red-600'
                          : severity === 'warning'
                          ? 'text-yellow-600'
                          : 'text-gray-900'
                      }`}
                    >
                      {endpoint.avgDuration.toFixed(0)}ms
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-gray-600">
                    {endpoint.count.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded ${
                        severity === 'critical'
                          ? 'bg-red-100 text-red-700'
                          : severity === 'warning'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {severity === 'critical' && <TrendingUp className="w-3 h-3" />}
                      {severity === 'critical'
                        ? 'Critical'
                        : severity === 'warning'
                        ? 'Slow'
                        : 'Normal'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
