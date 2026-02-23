import { ImageResponse } from 'next/og';
import { getPostBySlug, getAllPosts, CATEGORIES } from '@/lib/posts';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const CATEGORY_COLORS: Record<string, string> = {
  'morning-summary': '#3B82F6',
  'evening-summary': '#F97316',
  news: '#6366F1',
  'dev-knowledge': '#10b981',
  'case-study': '#f59e0b',
  products: '#8B5CF6',
};

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0f172a',
            color: '#e2e8f0',
            fontSize: 48,
            fontWeight: 800,
          }}
        >
          AI Solo Craft
        </div>
      ),
      { ...size }
    );
  }

  const cat = CATEGORIES[post.category];
  const accentColor = CATEGORY_COLORS[post.category] || '#6366F1';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '60px',
          background: `linear-gradient(135deg, ${accentColor}22 0%, #0f172a 40%, #0f172a 100%)`,
          fontFamily: 'sans-serif',
        }}
      >
        {/* Grid pattern overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `linear-gradient(${accentColor}08 1px, transparent 1px), linear-gradient(90deg, ${accentColor}08 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
            display: 'flex',
          }}
        />

        {/* Accent glow */}
        <div
          style={{
            position: 'absolute',
            top: '50px',
            right: '100px',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${accentColor}15 0%, transparent 70%)`,
            display: 'flex',
          }}
        />

        {/* Site name */}
        <div
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: '#94a3b8',
            letterSpacing: '3px',
            marginBottom: '16px',
            display: 'flex',
          }}
        >
          AI SOLO CRAFT
        </div>

        {/* Category badge */}
        <div
          style={{
            display: 'flex',
            marginBottom: '20px',
          }}
        >
          <div
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: accentColor,
              backgroundColor: `${accentColor}22`,
              padding: '8px 20px',
              borderRadius: '14px',
              display: 'flex',
            }}
          >
            {cat?.emoji || '📰'} {cat?.label || 'ニュース'}
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 44,
            fontWeight: 800,
            color: '#e2e8f0',
            lineHeight: 1.3,
            display: 'flex',
            maxWidth: '900px',
          }}
        >
          {post.title.length > 60 ? post.title.slice(0, 57) + '...' : post.title}
        </div>
      </div>
    ),
    { ...size }
  );
}
