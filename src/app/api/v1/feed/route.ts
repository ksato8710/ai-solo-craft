import { NextResponse } from 'next/server';
import { getAllPosts, getAllProducts, getAllNewsPosts, getPostsByCategory } from '@/lib/posts';
import { toApiSummary } from '@/lib/content-api';

export const revalidate = 300;
export const dynamic = 'force-dynamic';

function parseLimit(value: string | null, fallback: number): number {
  const parsed = Number.parseInt(value || '', 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.max(1, Math.min(20, parsed));
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limit = parseLimit(url.searchParams.get('limit'), 8);

    const [allNewsPosts, allProducts, morning, evening] = await Promise.all([
      getAllNewsPosts(),
      getAllProducts(),
      getPostsByCategory('morning-summary'),
      getPostsByCategory('evening-summary'),
    ]);

    return NextResponse.json(
      {
        generatedAt: new Date().toISOString(),
        sections: {
          morningSummary: morning.slice(0, limit).map(toApiSummary),
          eveningSummary: evening.slice(0, limit).map(toApiSummary),
          allNews: allNewsPosts.slice(0, limit).map(toApiSummary),
          latestNews: allNewsPosts.filter((p) => p.category === 'news').slice(0, limit).map(toApiSummary),
          products: allProducts.slice(0, limit).map(toApiSummary),
          devKnowledge: allNewsPosts.filter((p) => p.category === 'dev-knowledge').slice(0, limit).map(toApiSummary),
          caseStudies: allNewsPosts.filter((p) => p.category === 'case-study').slice(0, limit).map(toApiSummary),
        },
      },
      {
        headers: {
          'Cache-Control': 's-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('[api/v1/feed] failed', error);
    return NextResponse.json({ error: 'Failed to load feed' }, { status: 500 });
  }
}
