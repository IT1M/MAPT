import HelpCenterLayout from '@/components/help/HelpCenterLayout';
import SupportForm from '@/components/help/SupportForm';
import HelpBreadcrumbs from '@/components/help/HelpBreadcrumbs';

export default async function SupportPage() {
  return (
    <HelpCenterLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <HelpBreadcrumbs
          items={[
            { label: 'Home', href: '/help' },
            { label: 'Contact Support' },
          ]}
        />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Contact Support
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Get help from our support team
          </p>
        </div>

        {/* Support Form */}
        <SupportForm />
      </div>
    </HelpCenterLayout>
  );
}
