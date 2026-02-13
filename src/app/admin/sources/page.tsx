'use client';

import { useState, useEffect } from 'react';

interface ContentSource {
  id: string;
  name: string;
  url: string;
  category: string;
  quality_rating: number;
  accessibility_rating: number;
  is_free: boolean;
  is_active: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = [
  'tech-community',
  'dev-tools', 
  'indie-business',
  'startup',
  'dev-knowledge',
  'tech-analysis',
  'consumer-tech',
  'business-innovation',
  'tech-research',
  'tech-culture'
];

export default function SourcesAdminPage() {
  const [sources, setSources] = useState<ContentSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState({ category: '', active: '' });
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ContentSource>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [newForm, setNewForm] = useState<Partial<ContentSource>>({
    quality_rating: 3,
    accessibility_rating: 3,
    is_free: true,
    is_active: false
  });

  useEffect(() => {
    fetchSources();
  }, [filter]);

  const fetchSources = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.category) params.set('category', filter.category);
      if (filter.active) params.set('active', filter.active);

      const response = await fetch(`/api/admin/sources?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch sources');
      }

      setSources(data.sources || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const initializeSources = async () => {
    try {
      const response = await fetch('/api/admin/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'initialize' })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize sources');
      }

      alert(`Successfully initialized ${data.sources.length} sources!`);
      fetchSources();
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const updateSource = async (id: string, updates: Partial<ContentSource>) => {
    try {
      const response = await fetch('/api/admin/sources', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update source');
      }

      fetchSources();
      setIsEditing(null);
      setEditForm({});
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const addSource = async () => {
    try {
      const response = await fetch('/api/admin/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newForm)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add source');
      }

      fetchSources();
      setIsAdding(false);
      setNewForm({
        quality_rating: 3,
        accessibility_rating: 3,
        is_free: true,
        is_active: false
      });
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const deleteSource = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;

    try {
      const response = await fetch(`/api/admin/sources?id=${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete source');
      }

      fetchSources();
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const startEdit = (source: ContentSource) => {
    setIsEditing(source.id);
    setEditForm(source);
  };

  const cancelEdit = () => {
    setIsEditing(null);
    setEditForm({});
  };

  const RatingStars = ({ rating, onChange }: { rating: number; onChange: (rating: number) => void }) => (
    <div className="flex">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          onClick={() => onChange(star)}
          className={`text-xl ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
        >
          ⭐
        </button>
      ))}
    </div>
  );

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">情報源管理</h1>

      {/* コントロール */}
      <div className="mb-6 flex flex-wrap gap-4 items-center">
        <select
          value={filter.category}
          onChange={(e) => setFilter(prev => ({ ...prev, category: e.target.value }))}
          className="border rounded px-3 py-2"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <select
          value={filter.active}
          onChange={(e) => setFilter(prev => ({ ...prev, active: e.target.value }))}
          className="border rounded px-3 py-2"
        >
          <option value="">All Status</option>
          <option value="true">Active Only</option>
          <option value="false">Inactive Only</option>
        </select>

        <button
          onClick={() => setIsAdding(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          新規追加
        </button>

        {sources.length === 0 && (
          <button
            onClick={initializeSources}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            初期データ投入
          </button>
        )}

        <div className="text-sm text-gray-600">
          Total: {sources.length} sources
        </div>
      </div>

      {/* 新規追加フォーム */}
      {isAdding && (
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <h3 className="text-lg font-semibold mb-4">新規情報源追加</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Name"
              value={newForm.name || ''}
              onChange={(e) => setNewForm(prev => ({ ...prev, name: e.target.value }))}
              className="border rounded px-3 py-2"
            />
            <input
              type="url"
              placeholder="URL"
              value={newForm.url || ''}
              onChange={(e) => setNewForm(prev => ({ ...prev, url: e.target.value }))}
              className="border rounded px-3 py-2"
            />
            <select
              value={newForm.category || ''}
              onChange={(e) => setNewForm(prev => ({ ...prev, category: e.target.value }))}
              className="border rounded px-3 py-2"
            >
              <option value="">Select Category</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <textarea
              placeholder="Description"
              value={newForm.description || ''}
              onChange={(e) => setNewForm(prev => ({ ...prev, description: e.target.value }))}
              className="border rounded px-3 py-2"
            />
          </div>
          <div className="mt-4 flex gap-4 items-center">
            <label className="flex items-center gap-2">
              Quality Rating:
              <RatingStars 
                rating={newForm.quality_rating || 3}
                onChange={(rating) => setNewForm(prev => ({ ...prev, quality_rating: rating }))}
              />
            </label>
            <label className="flex items-center gap-2">
              Accessibility:
              <RatingStars 
                rating={newForm.accessibility_rating || 3}
                onChange={(rating) => setNewForm(prev => ({ ...prev, accessibility_rating: rating }))}
              />
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newForm.is_free}
                onChange={(e) => setNewForm(prev => ({ ...prev, is_free: e.target.checked }))}
              />
              Free
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newForm.is_active}
                onChange={(e) => setNewForm(prev => ({ ...prev, is_active: e.target.checked }))}
              />
              Active
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={addSource}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              追加
            </button>
            <button
              onClick={() => setIsAdding(false)}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* 情報源一覧 */}
      <div className="space-y-4">
        {sources.map(source => (
          <div key={source.id} className="border rounded-lg p-4 bg-white">
            {isEditing === source.id ? (
              // 編集モード
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={editForm.name || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    className="border rounded px-3 py-2"
                  />
                  <input
                    type="url"
                    value={editForm.url || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, url: e.target.value }))}
                    className="border rounded px-3 py-2"
                  />
                  <select
                    value={editForm.category || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                    className="border rounded px-3 py-2"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <textarea
                    value={editForm.description || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    className="border rounded px-3 py-2"
                  />
                </div>
                <div className="flex flex-wrap gap-4 items-center">
                  <label className="flex items-center gap-2">
                    Quality:
                    <RatingStars 
                      rating={editForm.quality_rating || 3}
                      onChange={(rating) => setEditForm(prev => ({ ...prev, quality_rating: rating }))}
                    />
                  </label>
                  <label className="flex items-center gap-2">
                    Accessibility:
                    <RatingStars 
                      rating={editForm.accessibility_rating || 3}
                      onChange={(rating) => setEditForm(prev => ({ ...prev, accessibility_rating: rating }))}
                    />
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editForm.is_free}
                      onChange={(e) => setEditForm(prev => ({ ...prev, is_free: e.target.checked }))}
                    />
                    Free
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editForm.is_active}
                      onChange={(e) => setEditForm(prev => ({ ...prev, is_active: e.target.checked }))}
                    />
                    Active
                  </label>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateSource(source.id, editForm)}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    保存
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            ) : (
              // 表示モード
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <h3 className="text-lg font-semibold">{source.name}</h3>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                      {source.category}
                    </span>
                    <span className={`px-2 py-1 text-sm rounded ${source.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {source.is_active ? 'Active' : 'Inactive'}
                    </span>
                    {source.is_free && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-sm rounded">
                        Free
                      </span>
                    )}
                  </div>
                  <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {source.url}
                  </a>
                  {source.description && (
                    <p className="text-gray-600 mt-2">{source.description}</p>
                  )}
                  <div className="flex gap-4 mt-2 text-sm">
                    <span>Quality: {source.quality_rating}/5 ⭐</span>
                    <span>Accessibility: {source.accessibility_rating}/5 ⭐</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(source)}
                    className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => deleteSource(source.id, source.name)}
                    className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                  >
                    削除
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {sources.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No sources found. Click "初期データ投入" to add initial sources.
          </div>
        )}
      </div>
    </div>
  );
}