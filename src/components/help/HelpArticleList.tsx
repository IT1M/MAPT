'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from '@/hooks/useTranslations';
import {
  DocumentTextIcon,
  EyeIcon,
  HandThumbUpIcon,
} from '@heroicons/react/24/outline';

interface Article {
  id: string;
  title: string;
  slug: string;
  category: string;
  tags: string[];
  views: number;
  helpful: number;
  publishedAt: string;
}

interface HelpArticleListProps {
  query?: string;
  category?: string;
}

export default function HelpArticleList({
  query,
  category,
}: HelpArticleListProps) {
  const t = useTranslations('help');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchArticles();
  }, [query, category, page]);

  async function fetchArticles() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (category) params.set('category', category);
      params.set('page', page.toString());
      params.set('limit', '10');

      const res = await fetch(`/api/help/articles?${params.toString()}`);
      const data = await res.json();

      setArticles(data.articles || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
          >
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3 animate-pulse" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2 animate-pulse" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
        <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {t('noArticlesFound')}
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          {query ? t('tryDifferentSearch') : t('noArticlesInCategory')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Articles List */}
      <div className="space-y-4">
        {articles.map((article) => (
          <Link
            key={article.id}
            href={`/help/${article.slug}`}
            className="block bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 hover:text-teal-600 dark:hover:text-teal-400">
                  {article.title}
                </h3>

                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300">
                    {article.category}
                  </span>

                  <span className="flex items-center">
                    <EyeIcon className="h-4 w-4 mr-1" />
                    {article.views}
                  </span>

                  <span className="flex items-center">
                    <HandThumbUpIcon className="h-4 w-4 mr-1" />
                    {article.helpful}
                  </span>
                </div>

                {article.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {article.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('previous')}
          </button>

          <span className="text-sm text-gray-700 dark:text-gray-300">
            {t('pageOf', { current: page, total: totalPages })}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('next')}
          </button>
        </div>
      )}
    </div>
  );
}
