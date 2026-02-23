export default function NotFound() {
  return (
    <div className="text-center py-20">
      <p className="text-6xl mb-6">🔍</p>
      <h1 className="text-3xl font-extrabold font-heading text-text-deep mb-4">ページが見つかりません</h1>
      <p className="text-text-light mb-8">お探しのページは存在しないか、移動された可能性があります。</p>
      <a href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold text-white bg-accent-leaf hover:bg-accent-moss transition-colors">
        ← トップページに戻る
      </a>
    </div>
  );
}
