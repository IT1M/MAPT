'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from '@/hooks/useTranslations';
import { FolderIcon } from '@heroicons/react/24/outline';

interface Category {
  name: string;
  count: number;
}

interface HelpCategoriesProps {
  selectedCategory?: string;
}

export default function HelpCategories({
  selectedCategory,
}: HelpCategoriesProps) {
  const t = useTranslations('help');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      const res = await fetch('/api/help/categories');
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('categories')}
        </h2>
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-10 bg-gray-100 dark:bg-gray-700 rounded animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {t('categories')}
      </h2>

      <nav className="space-y-1">
        {/* All Articles */}
        <Link
          href="/help"
          className={`flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            !selectedCategory
              ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <span className="flex items-center">
            <FolderIcon className="h-5 w-5 mr-2" />
            {t('allArticles')}
          </span>
        </Link>

        {/* Category Links */}
        {categories.map((category) => (
          <Link
            key={category.name}
            href={`/help?category=${encodeURIComponent(category.name)}`}
            className={`flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedCategory === category.name
                ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <span className="flex items-center">
              <FolderIcon className="h-5 w-5 mr-2" />
              {category.name}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {category.count}
            </span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
