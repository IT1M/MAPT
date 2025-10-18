import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import AccessDeniedContent from './AccessDeniedContent';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'errors' });
  
  return {
    title: t('accessDenied.title'),
    description: t('accessDenied.description'),
  };
}

export default function AccessDeniedPage() {
  return <AccessDeniedContent />;
}
