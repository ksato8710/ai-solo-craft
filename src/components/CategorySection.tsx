import { Post, CATEGORIES } from '@/lib/posts';
import NewsCard from './NewsCard';

interface CategorySectionProps {
  category: string;
  posts: Post[];
}

export default function CategorySection({ category, posts }: CategorySectionProps) {
  const cat = CATEGORIES[category] || CATEGORIES['morning-summary'];
  
  if (posts.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-6 rounded-full" style={{ backgroundColor: cat.color }} />
        <h2 className="text-lg font-bold text-[var(--text-primary)]">{cat.emoji} {cat.label}</h2>
        <a href={`/category/${category}`} 
           className="ml-auto text-xs font-medium hover:underline"
           style={{ color: cat.color }}>
          すべて見る →
        </a>
      </div>
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
        {posts.slice(0, 8).map((post) => (
          <NewsCard key={post.slug} post={post} size="small" />
        ))}
      </div>
    </section>
  );
}
