import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import HelpCenterLayout from '@/components/help/HelpCenterLayout'
import HelpArticleView from '@/components/help/HelpArticleView'
import HelpBreadcrumbs from '@/components/help/HelpBreadcrumbs'

async function getArticle(slug: string) {
  try {
    const res = await fetch(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/help/articles/${slug}`,
      { cache: 'no-store' }
    )

    if (!res.ok) {
      return null
    }

    return res.json()
  } catch (error) {
    console.error('Error fetching article:', error)
    return null
  }
}

export default async function HelpArticlePage({
  params
}: {
  params: Promise<{ slug: string; locale: string }>
}) {
  const { slug } = await params
  const article = await getArticle(slug)

  if (!article) {
    notFound()
  }

  const t = await getTranslations('help')

  return (
    <HelpCenterLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <HelpBreadcrumbs
          items={[
            { label: t('home'), href: '/help' },
            { label: article.category, href: `/help?category=${article.category}` },
            { label: article.title }
          ]}
        />

        {/* Article Content */}
        <HelpArticleView article={article} />
      </div>
    </HelpCenterLayout>
  )
}
