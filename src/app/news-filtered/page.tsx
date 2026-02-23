import { getAllPosts } from '@/lib/posts';
import SourceCredibilityFilter from '@/components/SourceCredibilityFilter';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '信頼性フィルター | AI Solo Craft',
  description: 'ソースの信頼性に基づいてニュース記事をフィルタリング',
};

export default async function NewsFilteredPage() {
  const posts = await getAllPosts();

  return (
    <div className="min-h-screen bg-bg-cream">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <a
              href="/"
              className="text-text-light hover:text-text-deep transition-colors text-sm"
            >
              ← ホームに戻る
            </a>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-1.5 h-8 rounded-full bg-accent-leaf" />
            <h1 className="text-3xl font-extrabold font-heading text-text-deep">🔍 ニュース記事フィルター</h1>
          </div>

          <p className="text-text-light text-lg">
            情報源の種別と信頼度に基づいて記事をフィルタリングできます
          </p>
        </div>

        {/* Stats Overview */}
        <div className="bg-bg-card rounded-xl p-6 border border-border mb-8">
          <h2 className="text-lg font-semibold font-heading text-text-deep mb-4">記事統計</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-text-deep">{posts.length}</div>
              <div className="text-xs text-text-light">総記事数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent-leaf">
                {posts.filter(p => p.source?.type === 'primary').length}
              </div>
              <div className="text-xs text-text-light">🥇 一次情報</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent-bloom">
                {posts.filter(p => p.source?.type === 'secondary').length}
              </div>
              <div className="text-xs text-text-light">🥈 二次情報</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-text-light">
                {posts.filter(p => p.source?.type === 'tertiary').length}
              </div>
              <div className="text-xs text-text-light">🥉 三次情報</div>
            </div>
          </div>
        </div>

        {/* Filter Component */}
        <SourceCredibilityFilter posts={posts} showGrid={true} />

        {/* Features Info */}
        <div className="mt-12 bg-bg-card rounded-xl p-6 border border-border">
          <h2 className="text-lg font-semibold font-heading text-text-deep mb-4">フィルター機能について</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-text-muted mb-2">ソース種別フィルター</h3>
              <ul className="text-sm text-text-light space-y-1">
                <li><strong className="text-accent-leaf">🥇 公式:</strong> 企業・組織の公式発表</li>
                <li><strong className="text-accent-bloom">🥈 メディア:</strong> 専門メディアの編集記事</li>
                <li><strong className="text-text-light">🥉 コミュニティ:</strong> コミュニティ・個人の議論</li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-text-muted mb-2">信頼度スコア</h3>
              <ul className="text-sm text-text-light space-y-1">
                <li><strong>9-10:</strong> 非常に高い信頼度</li>
                <li><strong>7-8:</strong> 高い信頼度</li>
                <li><strong>5-6:</strong> 中程度の信頼度</li>
                <li><strong>1-4:</strong> 要注意・検証推奨</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 bg-accent-leaf/10 rounded-lg border border-accent-leaf/20">
            <p className="text-sm text-accent-leaf">
              <strong>💡 ヒント:</strong> 意思決定に使う情報は、複数のソース種別から確認することをお勧めします。
              一次情報で事実を確認し、二次情報で分析や文脈を把握するのが効果的です。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
