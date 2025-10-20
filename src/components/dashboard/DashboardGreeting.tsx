'use client';

/**
 * DashboardGreeting Component
 * Displays personalized greeting with time-based message, last login info, and Hijri date
 */

import { useTranslations } from '@/hooks/useTranslations';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { useParams } from 'next/navigation';

interface DashboardGreetingProps {
  userName: string;
  lastLogin?: Date | null;
  lastLoginIp?: string | null;
}

/**
 * Get time-based greeting message
 */
function getGreeting(hour: number): string {
  if (hour >= 6 && hour < 12) return 'goodMorning';
  if (hour >= 12 && hour < 18) return 'goodAfternoon';
  if (hour >= 18 && hour < 24) return 'goodEvening';
  return 'goodNight';
}

/**
 * Convert Gregorian date to Hijri date (simplified approximation)
 * For production, use a proper library like @hebcal/core or moment-hijri
 */
function getHijriDate(): string {
  const now = new Date();
  // This is a simplified calculation - use a proper library in production
  const gregorianYear = now.getFullYear();
  const hijriYear = Math.floor((gregorianYear - 622) * 1.030684);

  return `${hijriYear} هـ`;
}

export function DashboardGreeting({
  userName,
  lastLogin,
  lastLoginIp,
}: DashboardGreetingProps) {
  const t = useTranslations('dashboard');
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const hour = new Date().getHours();
  const greetingKey = getGreeting(hour);

  const hijriDate = getHijriDate();

  // Format last login time
  const lastLoginText = lastLogin
    ? formatDistanceToNow(new Date(lastLogin), {
        addSuffix: true,
        locale: locale === 'ar' ? ar : enUS,
      })
    : null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Greeting Section */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {t(greetingKey)}, {userName}! 👋
          </h1>

          {lastLogin && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>
                  {t('lastLogin')}: {lastLoginText}
                </span>
              </div>

              {lastLoginIp && (
                <>
                  <span className="hidden sm:inline text-gray-400">•</span>
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span>{lastLoginIp}</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Hijri Date Section */}
        <div className="flex items-center gap-3 px-4 py-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
          <svg
            className="w-5 h-5 text-primary-600 dark:text-primary-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <div className="text-sm">
            <div className="font-medium text-gray-900 dark:text-gray-100">
              {new Date().toLocaleDateString(
                locale === 'ar' ? 'ar-SA' : 'en-US',
                {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                }
              )}
            </div>
            {locale === 'ar' && (
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {hijriDate}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
