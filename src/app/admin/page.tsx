'use client';

export const dynamic = 'force-dynamic';

export default function AdminPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">管理画面</h1>
      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">利用可能な管理機能</h2>
          <ul className="space-y-2">
            <li>
              <a 
                href="/admin/sources" 
                className="text-blue-600 hover:underline"
              >
                📊 情報源管理
              </a>
              <span className="text-gray-600 ml-2">
                - 5段階レーティング、カテゴリ管理、アクティブ制御
              </span>
            </li>
          </ul>
        </div>
        
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">管理機能の詳細</h3>
          <div className="text-sm space-y-1">
            <p>• 情報源の品質・アクセス性レーティング（1-5⭐）</p>
            <p>• カテゴリ別フィルタリング</p>
            <p>• 無料/有料フラグ管理</p>
            <p>• アクティブ/非アクティブ切り替え</p>
            <p>• 新規追加・編集・削除機能</p>
          </div>
        </div>
      </div>
    </div>
  );
}