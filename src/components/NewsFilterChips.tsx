'use client';

import { useMemo, useState } from 'react';
import type { Post } from '@/lib/types';
import { TAG_METADATA } from '@/lib/types';
import NewsCard from './NewsCard';

interface NewsFilterChipsProps {
  posts: Post[];
}

const ALL_KEY = '__all__';
const DEFAULT_TAG_COLOR = '#64748b';

export default function NewsFilterChips({ posts }: NewsFilterChipsProps) {
  const [activeTag, setActiveTag] = useState(ALL_KEY);

  // Collect unique tags that actually exist in posts, preserving insertion order
  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const post of posts) {
      if (post.tags && post.tags.length > 0) {
        for (const tag of post.tags) {
          counts.set(tag, (counts.get(tag) || 0) + 1);
        }
      }
    }
    return counts;
  }, [posts]);

  const filteredPosts = useMemo(() => {
    if (activeTag === ALL_KEY) return posts;
    return posts.filter(p => p.tags?.includes(activeTag));
  }, [posts, activeTag]);

  const chipColor = (tag: string) => TAG_METADATA[tag]?.color ?? DEFAULT_TAG_COLOR;
  const chipLabel = (tag: string) => TAG_METADATA[tag]?.label ?? tag;

  return (
    <div>
      {/* Chips */}
      {tagCounts.size > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {/* "All" chip */}
          <button
            onClick={() => setActiveTag(ALL_KEY)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={activeTag === ALL_KEY ? {
              backgroundColor: '#6366F133',
              color: '#e2e8f0',
              border: '1px solid #6366F166',
            } : {
              backgroundColor: '#1e293b',
              color: '#94a3b8',
              border: '1px solid transparent',
            }}
          >
            すべて
            <span className="ml-1.5 opacity-60">{posts.length}</span>
          </button>

          {/* Dynamic tag chips */}
          {[...tagCounts.entries()].map(([tag, count]) => {
            const isActive = activeTag === tag;
            const color = chipColor(tag);
            return (
              <button
                key={tag}
                onClick={() => setActiveTag(isActive ? ALL_KEY : tag)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={isActive ? {
                  backgroundColor: color + '33',
                  color,
                  border: `1px solid ${color}66`,
                } : {
                  backgroundColor: '#1e293b',
                  color: '#94a3b8',
                  border: '1px solid transparent',
                }}
              >
                {chipLabel(tag)}
                <span className="ml-1.5 opacity-60">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Article Grid */}
      {filteredPosts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <NewsCard key={post.slug} post={post} size="medium" />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-6xl mb-4 opacity-20">📰</p>
          <h3 className="text-xl font-bold text-white mb-2">記事がありません</h3>
          <p className="text-slate-400 text-sm">このタグにはまだ記事がありません。</p>
        </div>
      )}
    </div>
  );
}
