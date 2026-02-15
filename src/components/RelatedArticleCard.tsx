import type { Post } from '@/lib/types';
import Image from 'next/image';

interface RelatedArticleCardProps {
  post: Post;
}

export default function RelatedArticleCard({ post }: RelatedArticleCardProps) {
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  };

  const defaultImage = 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=200&fit=crop';

  return (
    <a 
      href={`/news/${post.slug}`}
      className="group block h-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] transition-all duration-200 hover:border-[var(--accent-blue)]/30 overflow-hidden"
    >
      {/* サムネイル */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-[var(--bg-secondary)]">
        <Image
          src={post.image || defaultImage}
          alt={post.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, 50vw"
        />
      </div>
      {/* テキスト */}
      <div className="p-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-blue)] transition-colors line-clamp-2 leading-snug">
          {post.title}
        </h3>
        <div className="mt-2 flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <span>{formatDate(post.date)}</span>
          {post.readTime && (
            <>
              <span>・</span>
              <span>{post.readTime}分</span>
            </>
          )}
        </div>
      </div>
    </a>
  );
}
