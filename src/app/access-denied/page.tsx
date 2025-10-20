import { Metadata } from 'next';
import AccessDeniedContent from './AccessDeniedContent';

export const metadata: Metadata = {
  title: 'Access Denied',
  description: 'You do not have permission to access this page',
};

export default function AccessDeniedPage() {
  return <AccessDeniedContent />;
}
