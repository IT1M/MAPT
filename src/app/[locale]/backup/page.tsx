import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/services/auth';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Lazy load the backup management page for better performance
const BackupManagementPage = dynamic(
  () => import('@/components/backup/BackupManagementPage'),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading backup management...</p>
        </div>
      </div>
    ),
    ssr: false,
  }
);

export const metadata: Metadata = {
  title: 'Backup Management | Saudi Mais Co.',
  description: 'Manage system backups and data restoration',
};

export default async function BackupPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const session = await auth();

  // Check if user is authenticated
  if (!session) {
    redirect(`/${locale}/login`);
  }

  // Check if user has ADMIN or MANAGER role
  const userRole = session.user?.role;
  if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
    redirect(`/${locale}/dashboard`);
  }

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading backup management...</p>
          </div>
        </div>
      }
    >
      <BackupManagementPage locale={locale} userRole={userRole} />
    </Suspense>
  );
}
