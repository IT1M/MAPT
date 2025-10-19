import { Metadata } from 'next';
import { auth } from '@/services/auth';
import { redirect } from 'next/navigation';
import BackupManagementPage from '@/components/backup/BackupManagementPage';

export const metadata: Metadata = {
  title: 'Backup Management | Saudi Mais Co.',
  description: 'Manage system backups and data restoration',
};

export default async function BackupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
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

  return <BackupManagementPage locale={locale} userRole={userRole} />;
}
