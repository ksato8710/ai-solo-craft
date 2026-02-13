'use client';

import { useMemo, useState } from 'react';
import type { Post } from '@/lib/types';
import NewsCard from './NewsCard';

interface SourceCredibilityFilterProps {
  posts: Post[];
  showGrid?: boolean;
}

const ALL_SOURCES = '__all__';
const PRIMARY_SOURCES = 'primary';
const SECONDARY_SOURCES = 'secondary';
const TERTIARY_SOURCES = 'tertiary';
const NO_SOURCE = 'no_source';

export default function SourceCredibilityFilter({ posts, showGrid = true }: SourceCredibilityFilterProps) {
  const [activeFilter, setActiveFilter] = useState(ALL_SOURCES);
  const [minCredibility, setMinCredibility] = useState<number>(1);

  // Analyze source distribution
  const sourceStats = useMemo(() => {
    const stats = {
      all: posts.length,
      primary: 0,
      secondary: 0,
      tertiary: 0,
      no_source: 0,
    };

    for (const post of posts) {
      if (!post.source) {
        stats.no_source++;
      } else {
        switch (post.source.type) {
          case 'primary':
            stats.primary++;
            break;
          case 'secondary':
            stats.secondary++;
            break;
          case 'tertiary':
            stats.tertiary++;
            break;
          default:
            stats.no_source++;
        }
      }
    }

    return stats;
  }, [posts]);

  const filteredPosts = useMemo(() => {
    let filtered = posts;

    // Apply source type filter
    if (activeFilter === PRIMARY_SOURCES) {
      filtered = filtered.filter(p => p.source?.type === 'primary');
    } else if (activeFilter === SECONDARY_SOURCES) {
      filtered = filtered.filter(p => p.source?.type === 'secondary');
    } else if (activeFilter === TERTIARY_SOURCES) {
      filtered = filtered.filter(p => p.source?.type === 'tertiary');
    } else if (activeFilter === NO_SOURCE) {
      filtered = filtered.filter(p => !p.source);
    }

    // Apply credibility filter
    if (minCredibility > 1) {
      filtered = filtered.filter(p => {
        if (!p.source?.credibility_score) return false;
        return p.source.credibility_score >= minCredibility;
      });
    }

    return filtered;
  }, [posts, activeFilter, minCredibility]);

  const getFilterButton = (
    filterKey: string,
    label: string,
    emoji: string,
    count: number,
    color: string
  ) => {
    const isActive = activeFilter === filterKey;
    return (
      <button
        key={filterKey}
        onClick={() => setActiveFilter(isActive ? ALL_SOURCES : filterKey)}
        className="px-3 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
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
        <span>{emoji}</span>
        <span>{label}</span>
        <span className="opacity-60 text-xs">{count}</span>
      </button>
    );
  };

  return (
    <div>
      {/* Source Type Filters */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-white mb-3">情報源の種別</h3>
        <div className="flex flex-wrap gap-2">
          {getFilterButton(ALL_SOURCES, 'すべて', '📰', sourceStats.all, '#6366F1')}
          {getFilterButton(PRIMARY_SOURCES, '公式', '🥇', sourceStats.primary, '#10b981')}
          {getFilterButton(SECONDARY_SOURCES, 'メディア', '🥈', sourceStats.secondary, '#f59e0b')}
          {getFilterButton(TERTIARY_SOURCES, 'コミュニティ', '🥉', sourceStats.tertiary, '#6b7280')}
          {sourceStats.no_source > 0 && getFilterButton(NO_SOURCE, 'ソース不明', '❓', sourceStats.no_source, '#64748b')}
        </div>
      </div>

      {/* Credibility Slider */}
      {sourceStats.primary > 0 || sourceStats.secondary > 0 || sourceStats.tertiary > 0 ? (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-white mb-3">
            信頼度フィルター 
            <span className="ml-2 text-xs font-normal text-slate-400">
              {minCredibility}点以上（{filteredPosts.length}件）
            </span>
          </h3>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400">1</span>
            <input
              type="range"
              min="1"
              max="10"
              value={minCredibility}
              onChange={(e) => setMinCredibility(parseInt(e.target.value))}
              className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #10b981 0%, #10b981 ${(minCredibility - 1) * 11.11}%, #374151 ${(minCredibility - 1) * 11.11}%, #374151 100%)`
              }}
            />
            <span className="text-xs text-slate-400">10</span>
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>低信頼度</span>
            <span>高信頼度</span>
          </div>
        </div>
      ) : null}

      {/* Results */}
      {showGrid && (
        <>
          {filteredPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post) => (
                <NewsCard key={post.slug} post={post} size="medium" />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-6xl mb-4 opacity-20">🔍</p>
              <h3 className="text-xl font-bold text-white mb-2">フィルター条件に一致する記事がありません</h3>
              <p className="text-slate-400 text-sm">別の条件をお試しください。</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}