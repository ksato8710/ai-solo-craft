import type { Post } from '@/lib/types';
import Image from 'next/image';

interface RelatedProductCardProps {
  product: Post;
}

export default function RelatedProductCard({ product }: RelatedProductCardProps) {
  const defaultImage = 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=200&fit=crop';

  // タグからカテゴリラベルを取得
  const getCategoryLabel = () => {
    const tagMap: Record<string, string> = {
      'ai-coding': 'AI Coding',
      'ai-ide': 'AI IDE',
      'ai-agent': 'AI Agent',
      'no-code': 'No-Code',
      'ai-chat': 'AI Chat',
      'ai-image': 'AI Image',
      'ai-video': 'AI Video',
      'ai-audio': 'AI Audio',
    };
    const tag = product.tags?.[0];
    return tag ? tagMap[tag] || tag : 'Product';
  };

  return (
    <a
      href={`/products/${product.slug}`}
      className="group flex-shrink-0 w-[280px] snap-start rounded-xl border border-border bg-bg-card hover:bg-bg-warm transition-all duration-200 hover:border-accent-bark/30 overflow-hidden"
    >
      {/* サムネイル */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-bg-warm">
        <Image
          src={product.image || defaultImage}
          alt={product.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="280px"
        />
        {/* カテゴリバッジ */}
        <div className="absolute top-2 left-2">
          <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-accent-bark/90 text-white backdrop-blur-sm">
            {getCategoryLabel()}
          </span>
        </div>
      </div>
      {/* テキスト */}
      <div className="p-4">
        <h3 className="font-heading text-sm font-semibold text-text-deep group-hover:text-accent-bark transition-colors line-clamp-2 leading-snug">
          {product.title}
        </h3>
        <p className="mt-2 text-xs text-text-light line-clamp-2">
          {product.description}
        </p>
      </div>
    </a>
  );
}
