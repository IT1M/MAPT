'use client';

import { useState } from 'react';
import { useTranslations } from '@/hooks/useTranslations';
import { GeminiConfiguration, ValidationResult } from '@/types/settings';

interface GeminiConfigProps {
  config: GeminiConfiguration;
  onUpdate: (config: Partial<GeminiConfiguration>) => Promise<void>;
  onValidate: () => Promise<ValidationResult>;
}

export function GeminiConfig({
  config,
  onUpdate,
  onValidate,
}: GeminiConfigProps) {
  const t = useTranslations('settings.api');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [localConfig, setLocalConfig] = useState(config);

  const maskApiKey = (key: string) => {
    if (!key || key.length < 4) return '••••••••';
    return '•'.repeat(key.length - 4) + key.slice(-4);
  };

  const handleValidate = async () => {
    setIsValidating(true);
    setValidationResult(null);

    try {
      const result = await onValidate();
      setValidationResult(result);
    } catch (error) {
      setValidationResult({
        valid: false,
        message: 'Validation failed. Please check your API key.',
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleUpdate = async (updates: Partial<GeminiConfiguration>) => {
    setIsSaving(true);
    try {
      const updatedConfig = { ...localConfig, ...updates };
      setLocalConfig(updatedConfig);
      await onUpdate(updates);
    } catch (error) {
      console.error('Failed to update config:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFeatureToggle = async (
    feature: keyof GeminiConfiguration['features'],
    enabled: boolean
  ) => {
    const updatedFeatures = {
      ...localConfig.features,
      [feature]: enabled,
    };
    await handleUpdate({ features: updatedFeatures });
  };

  return (
    <div className="space-y-6">
      {/* API Key Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('geminiApiKey')}
        </h3>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="apiKey"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {t('apiKey')}
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  id="apiKey"
                  type={showApiKey ? 'text' : 'password'}
                  value={localConfig.apiKey}
                  onChange={(e) =>
                    setLocalConfig({ ...localConfig, apiKey: e.target.value })
                  }
                  onBlur={() => handleUpdate({ apiKey: localConfig.apiKey })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your Gemini API key"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
                >
                  {showApiKey ? (
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
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
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
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              <button
                type="button"
                onClick={handleValidate}
                disabled={isValidating || !localConfig.apiKey}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isValidating ? t('validating') : t('validate')}
              </button>
            </div>

            {validationResult && (
              <div
                className={`mt-2 p-3 rounded-md ${
                  validationResult.valid
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                }`}
              >
                <div className="flex items-start gap-2">
                  {validationResult.valid ? (
                    <svg
                      className="w-5 h-5 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  <div>
                    <p className="text-sm font-medium">
                      {validationResult.message}
                    </p>
                    {validationResult.lastValidated && (
                      <p className="text-xs mt-1 opacity-75">
                        {t('lastValidated')}:{' '}
                        {new Date(
                          validationResult.lastValidated
                        ).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Model Configuration */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('modelConfiguration')}
        </h3>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="model"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {t('model')}
            </label>
            <select
              id="model"
              value={localConfig.model}
              onChange={(e) => handleUpdate({ model: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="gemini-pro">Gemini Pro</option>
              <option value="gemini-pro-vision">Gemini Pro Vision</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
              <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="temperature"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {t('temperature')}: {localConfig.temperature.toFixed(2)}
            </label>
            <input
              id="temperature"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={localConfig.temperature}
              onChange={(e) =>
                setLocalConfig({
                  ...localConfig,
                  temperature: parseFloat(e.target.value),
                })
              }
              onMouseUp={() =>
                handleUpdate({ temperature: localConfig.temperature })
              }
              onTouchEnd={() =>
                handleUpdate({ temperature: localConfig.temperature })
              }
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>{t('precise')}</span>
              <span>{t('creative')}</span>
            </div>
          </div>

          <div>
            <label
              htmlFor="maxTokens"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {t('maxTokens')}
            </label>
            <input
              id="maxTokens"
              type="number"
              min="1"
              max="100000"
              value={localConfig.maxTokens}
              onChange={(e) =>
                setLocalConfig({
                  ...localConfig,
                  maxTokens: parseInt(e.target.value),
                })
              }
              onBlur={() => handleUpdate({ maxTokens: localConfig.maxTokens })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label
              htmlFor="cacheDuration"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {t('cacheInsightsDuration')} ({t('minutes')})
            </label>
            <input
              id="cacheDuration"
              type="number"
              min="0"
              max="1440"
              value={localConfig.cacheInsightsDuration}
              onChange={(e) =>
                setLocalConfig({
                  ...localConfig,
                  cacheInsightsDuration: parseInt(e.target.value),
                })
              }
              onBlur={() =>
                handleUpdate({
                  cacheInsightsDuration: localConfig.cacheInsightsDuration,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* AI Features */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('aiFeatures')}
        </h3>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                {t('enableInsights')}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {t('enableInsightsDesc')}
              </div>
            </div>
            <input
              type="checkbox"
              checked={localConfig.features.insights}
              onChange={(e) =>
                handleFeatureToggle('insights', e.target.checked)
              }
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                {t('enablePredictive')}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {t('enablePredictiveDesc')}
              </div>
            </div>
            <input
              type="checkbox"
              checked={localConfig.features.predictiveAnalytics}
              onChange={(e) =>
                handleFeatureToggle('predictiveAnalytics', e.target.checked)
              }
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                {t('enableNLQ')}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {t('enableNLQDesc')}
              </div>
            </div>
            <input
              type="checkbox"
              checked={localConfig.features.naturalLanguageQueries}
              onChange={(e) =>
                handleFeatureToggle('naturalLanguageQueries', e.target.checked)
              }
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
          </label>
        </div>
      </div>

      {/* Usage Statistics */}
      {config.usage && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('usageStatistics')}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {t('requestsThisMonth')}
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {config.usage.requestsThisMonth.toLocaleString()}
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {t('tokensConsumed')}
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {config.usage.tokensConsumed.toLocaleString()}
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {t('rateLimit')}
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {config.usage.rateLimit.remaining} /{' '}
                {config.usage.rateLimit.limit}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('resetsAt')}:{' '}
                {new Date(config.usage.rateLimit.resetAt).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
