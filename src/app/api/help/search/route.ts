import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/services/prisma';

// GET /api/help/search - Full-text search with relevance ranking
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        results: [],
        query: query || '',
      });
    }

    const searchTerm = query.trim().toLowerCase();

    // Search in title, content, and tags
    const articles = await prisma.helpArticle.findMany({
      where: {
        status: 'PUBLISHED',
        OR: [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { content: { contains: searchTerm, mode: 'insensitive' } },
          { tags: { has: searchTerm } },
        ],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        content: true,
        tags: true,
        views: true,
        helpful: true,
      },
    });

    // Calculate relevance score for each article
    const results = articles.map((article) => {
      let score = 0;
      const titleLower = article.title.toLowerCase();
      const contentLower = article.content.toLowerCase();

      // Title match (highest weight)
      if (titleLower.includes(searchTerm)) {
        score += 10;
        if (titleLower.startsWith(searchTerm)) {
          score += 5; // Bonus for starting with search term
        }
      }

      // Tag match (high weight)
      if (article.tags.some((tag) => tag.toLowerCase().includes(searchTerm))) {
        score += 7;
      }

      // Content match (lower weight)
      const contentMatches = (
        contentLower.match(new RegExp(searchTerm, 'g')) || []
      ).length;
      score += Math.min(contentMatches, 5); // Cap at 5 points

      // Popularity bonus
      score += Math.min(article.views / 100, 3); // Up to 3 points for views
      score += Math.min(article.helpful / 10, 2); // Up to 2 points for helpful votes

      // Extract snippet with highlighted search term
      const contentIndex = contentLower.indexOf(searchTerm);
      let snippet = '';
      if (contentIndex !== -1) {
        const start = Math.max(0, contentIndex - 100);
        const end = Math.min(article.content.length, contentIndex + 150);
        snippet = article.content.substring(start, end);
        if (start > 0) snippet = '...' + snippet;
        if (end < article.content.length) snippet = snippet + '...';
      } else {
        // If not in content, use first 200 chars
        snippet = article.content.substring(0, 200);
        if (article.content.length > 200) snippet += '...';
      }

      return {
        id: article.id,
        title: article.title,
        slug: article.slug,
        category: article.category,
        snippet,
        score,
        highlights: {
          title: highlightText(article.title, searchTerm),
          snippet: highlightText(snippet, searchTerm),
        },
      };
    });

    // Sort by relevance score
    results.sort((a, b) => b.score - a.score);

    return NextResponse.json({
      results: results.slice(0, 20), // Limit to top 20 results
      query,
      total: results.length,
    });
  } catch (error) {
    console.error('Error searching help articles:', error);
    return NextResponse.json(
      { error: 'Failed to search help articles' },
      { status: 500 }
    );
  }
}

// Helper function to highlight search term in text
function highlightText(text: string, searchTerm: string): string {
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}
