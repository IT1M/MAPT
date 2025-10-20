'use client';

import React, { useState } from 'react';
import {
  Lightbulb,
  CheckCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: 'api' | 'database' | 'frontend' | 'infrastructure';
  impact: string;
  effort: 'low' | 'medium' | 'high';
  documentationLinks: string[];
  implementationSteps: string[];
  estimatedImprovement: string;
  implemented: boolean;
}

interface OptimizationRecommendationsProps {
  recommendations: Recommendation[];
  onMarkImplemented: (id: string) => void;
  confidence: number;
}

export function OptimizationRecommendations({
  recommendations,
  onMarkImplemented,
  confidence,
}: OptimizationRecommendationsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>(
    'all'
  );

  const filteredRecommendations = recommendations.filter(
    (rec) => filter === 'all' || rec.priority === filter
  );

  const priorityColors = {
    high: 'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-blue-100 text-blue-700 border-blue-200',
  };

  const effortLabels = {
    low: 'Low Effort',
    medium: 'Medium Effort',
    high: 'High Effort',
  };

  const categoryIcons = {
    api: '🔌',
    database: '🗄️',
    frontend: '🎨',
    infrastructure: '⚙️',
  };

  return (
    <div className="bg-white border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-purple-600" />
          <div>
            <h3 className="text-lg font-semibold">
              AI-Powered Optimization Recommendations
            </h3>
            <p className="text-sm text-gray-600">
              Confidence: {(confidence * 100).toFixed(0)}%
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {(['all', 'high', 'medium', 'low'] as const).map((priority) => (
            <button
              key={priority}
              onClick={() => setFilter(priority)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                filter === priority
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {priority === 'all'
                ? 'All'
                : priority.charAt(0).toUpperCase() + priority.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filteredRecommendations.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No recommendations available</p>
          <p className="text-sm mt-1">System performance is optimal</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRecommendations.map((rec) => (
            <div
              key={rec.id}
              className={`border-2 rounded-lg overflow-hidden transition-all ${
                rec.implemented ? 'opacity-60 bg-gray-50' : 'bg-white'
              }`}
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">
                        {categoryIcons[rec.category]}
                      </span>
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded border ${
                          priorityColors[rec.priority]
                        }`}
                      >
                        {rec.priority.toUpperCase()} PRIORITY
                      </span>
                      <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                        {effortLabels[rec.effort]}
                      </span>
                      {rec.implemented && (
                        <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Implemented
                        </span>
                      )}
                    </div>

                    <h4 className="font-semibold text-lg mb-2">{rec.title}</h4>
                    <p className="text-gray-700 text-sm mb-3">
                      {rec.description}
                    </p>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-purple-600">
                        <AlertCircle className="w-4 h-4" />
                        <span className="font-medium">Impact:</span>
                        <span>{rec.impact}</span>
                      </div>
                      <div className="flex items-center gap-1 text-green-600">
                        <Sparkles className="w-4 h-4" />
                        <span className="font-medium">Improvement:</span>
                        <span>{rec.estimatedImprovement}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {!rec.implemented && (
                      <button
                        onClick={() => onMarkImplemented(rec.id)}
                        className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Mark Done
                      </button>
                    )}
                    <button
                      onClick={() =>
                        setExpandedId(expandedId === rec.id ? null : rec.id)
                      }
                      className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                    >
                      {expandedId === rec.id ? (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          Less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          Details
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {expandedId === rec.id && (
                  <div className="mt-4 pt-4 border-t space-y-4">
                    <div>
                      <h5 className="font-semibold text-sm mb-2">
                        Implementation Steps:
                      </h5>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                        {rec.implementationSteps.map((step, index) => (
                          <li key={index}>{step}</li>
                        ))}
                      </ol>
                    </div>

                    <div>
                      <h5 className="font-semibold text-sm mb-2">
                        Documentation:
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {rec.documentationLinks.map((link, index) => (
                          <a
                            key={index}
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {new URL(link).hostname}
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
