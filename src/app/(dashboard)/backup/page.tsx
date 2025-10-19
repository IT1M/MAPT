import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/services/auth';
import BackupManagementPage from '@/components/backup/BackupManagementPage';

export const metadata: Metadata = {
  title: 'Backup Management | Saudi Mais Co.',
  description: 'Manage system backups and data restoration',
};

export default async function BackupPage() {
  const session = await auth();

  // Check if user is authenticated
  if (!session) {
    redirect(`/login`);
  }

  // Check if user has ADMIN or MANAGER role
  const userRole = session.user?.role;
  if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
    redirect(`/dashboard`);
  }

  return <BackupManagementPage locale="en" userRole={userRole} />;
}
