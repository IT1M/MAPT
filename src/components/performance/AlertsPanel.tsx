'use client';

import React from 'react';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

interface Alert {
  rule: string;
  message: string;
  severity: 'warning' | 'critical';
}

interface AlertsPanelProps {
  alerts: Alert[];
}

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  if (alerts.length === 0) {
    return (
      <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <Info className="w-6 h-6 text-green-600" />
          <div>
            <h3 className="font-semibold text-green-900">
              All Systems Operational
            </h3>
            <p className="text-sm text-green-700 mt-1">
              No performance alerts detected. System is running within normal
              parameters.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const criticalAlerts = alerts.filter((a) => a.severity === 'critical');
  const warningAlerts = alerts.filter((a) => a.severity === 'warning');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Active Alerts</h3>
        <div className="flex gap-4 text-sm">
          {criticalAlerts.length > 0 && (
            <span className="text-red-600 font-medium">
              {criticalAlerts.length} Critical
            </span>
          )}
          {warningAlerts.length > 0 && (
            <span className="text-yellow-600 font-medium">
              {warningAlerts.length} Warning
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {alerts.map((alert, index) => (
          <div
            key={index}
            className={`rounded-lg border-2 p-4 ${
              alert.severity === 'critical'
                ? 'bg-red-50 border-red-200'
                : 'bg-yellow-50 border-yellow-200'
            }`}
          >
            <div className="flex items-start gap-3">
              {alert.severity === 'critical' ? (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-semibold uppercase px-2 py-1 rounded ${
                      alert.severity === 'critical'
                        ? 'bg-red-200 text-red-800'
                        : 'bg-yellow-200 text-yellow-800'
                    }`}
                  >
                    {alert.severity}
                  </span>
                  <span className="text-xs text-gray-500">{alert.rule}</span>
                </div>
                <p
                  className={`mt-2 text-sm ${
                    alert.severity === 'critical'
                      ? 'text-red-900'
                      : 'text-yellow-900'
                  }`}
                >
                  {alert.message}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
