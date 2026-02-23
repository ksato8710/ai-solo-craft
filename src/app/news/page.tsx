import { getAllNewsPosts } from '@/lib/posts';
import NewsFilterChips from '@/components/NewsFilterChips';

export const metadata = {
  title: '📰 ニュースセンター | AI Solo Craft',
  description: 'AI開発の最新ニュース・ナレッジ・事例をまとめてチェック',
};

export default async function NewsPage() {
  const newsPosts = await getAllNewsPosts();

  return (
    <div>
      {/* Page Header */}
      <section className="mb-8">
        <h1 className="text-3xl font-extrabold font-heading text-text-deep mb-2">
          📰 ニュースセンター
        </h1>
        <p className="text-text-muted">
          AI開発の最新ニュース・ナレッジ・事例をまとめてチェック
        </p>
      </section>

      <NewsFilterChips posts={newsPosts} />

      {/* Back Link */}
      <div className="mt-8">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-sm text-accent-leaf hover:opacity-80 transition-colors"
        >
          ← トップページに戻る
        </a>
      </div>
    </div>
  );
}
