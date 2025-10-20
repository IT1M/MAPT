'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from '@/hooks/useTranslations';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { XMarkIcon } from '@heroicons/react/24/outline';

const articleSchema = z.object({
  title: z.string().min(3).max(200),
  slug: z
    .string()
    .min(3)
    .max(200)
    .regex(/^[a-z0-9-]+$/),
  category: z.string().min(2).max(50),
  content: z.string().min(10),
  tags: z.string(),
  status: z.enum(['DRAFT', 'PUBLISHED']),
});

type ArticleFormData = z.infer<typeof articleSchema>;

interface Article {
  id: string;
  title: string;
  slug: string;
  category: string;
  content: string;
  tags: string[];
  status: 'DRAFT' | 'PUBLISHED';
}

interface HelpArticleEditorProps {
  article: Article | null;
  onClose: (saved: boolean) => void;
}

export default function HelpArticleEditor({
  article,
  onClose,
}: HelpArticleEditorProps) {
  const t = useTranslations('help.admin');
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ArticleFormData>({
    resolver: zodResolver(articleSchema),
    defaultValues: article
      ? {
          title: article.title,
          slug: article.slug,
          category: article.category,
          content: article.content,
          tags: article.tags.join(', '),
          status: article.status,
        }
      : {
          title: '',
          slug: '',
          category: '',
          content: '',
          tags: '',
          status: 'DRAFT',
        },
  });

  const title = watch('title');

  // Auto-generate slug from title
  useEffect(() => {
    if (!article && title) {
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setValue('slug', slug);
    }
  }, [title, article, setValue]);

  async function onSubmit(data: ArticleFormData) {
    setSaving(true);

    try {
      const payload = {
        ...data,
        tags: data.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      };

      const url = article
        ? `/api/help/articles/${article.slug}`
        : '/api/help/articles';

      const method = article ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        onClose(true);
      } else {
        const error = await res.json();
        alert(error.error || t('saveFailed'));
      }
    } catch (error) {
      console.error('Error saving article:', error);
      alert(t('saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {article ? t('editArticle') : t('createArticle')}
          </h2>
          <button
            onClick={() => onClose(false)}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto p-6 space-y-6"
        >
          {/* Title */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {t('title')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              {...register('title')}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Slug */}
          <div>
            <label
              htmlFor="slug"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {t('slug')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="slug"
              {...register('slug')}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500"
            />
            {errors.slug && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.slug.message}
              </p>
            )}
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t('slugHelp')}
            </p>
          </div>

          {/* Category */}
          <div>
            <label
              htmlFor="category"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {t('category')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="category"
              {...register('category')}
              placeholder="Getting Started, Features, Troubleshooting, etc."
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500"
            />
            {errors.category && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.category.message}
              </p>
            )}
          </div>

          {/* Tags */}
          <div>
            <label
              htmlFor="tags"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {t('tags')}
            </label>
            <input
              type="text"
              id="tags"
              {...register('tags')}
              placeholder="tag1, tag2, tag3"
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500"
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t('tagsHelp')}
            </p>
          </div>

          {/* Content */}
          <div>
            <label
              htmlFor="content"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {t('content')} <span className="text-red-500">*</span>
            </label>
            <textarea
              id="content"
              {...register('content')}
              rows={15}
              placeholder={t('contentPlaceholder')}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
            />
            {errors.content && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.content.message}
              </p>
            )}
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t('markdownSupported')}
            </p>
          </div>

          {/* Status */}
          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {t('status')} <span className="text-red-500">*</span>
            </label>
            <select
              id="status"
              {...register('status')}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="DRAFT">{t('draft')}</option>
              <option value="PUBLISHED">{t('published')}</option>
            </select>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-4 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <button
            type="button"
            onClick={() => onClose(false)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={saving}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? t('saving') : t('save')}
          </button>
        </div>
      </div>
    </div>
  );
}
