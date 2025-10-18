import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/auth.config';
import BackupManagementPage from '@/components/backup/BackupManagementPage';

export const metadata: Metadata = {
  title: 'Backup Management | Saudi Mais Co.',
  description: 'Manage system backups and data restoration',
};

export default async function BackupPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const session = await getServerSession(authOptions);

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
