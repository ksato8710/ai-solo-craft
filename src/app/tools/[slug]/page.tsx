import { getAllTools, getToolBySlug, CATEGORIES } from '@/lib/posts';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  const tools = getAllTools();
  return tools.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = await getToolBySlug(slug);
  if (!tool) return { title: 'Not Found' };
  return {
    title: `${tool.title} | AI Solo Builder`,
    description: tool.description,
  };
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = await getToolBySlug(slug);
  if (!tool) notFound();

  const cat = CATEGORIES['tools'];
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  };

  return (
    <article className="max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
        <a href="/" className="hover:text-slate-300 transition-colors">ホーム</a>
        <span>/</span>
        <a href="/category/tools" className="hover:text-slate-300 transition-colors"
           style={{ color: cat.color }}>
          {cat.label}
        </a>
      </div>

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs font-semibold px-3 py-1 rounded-full"
                style={{ backgroundColor: cat.color + '22', color: cat.color }}>
            {cat.emoji} {cat.label}
          </span>
          <span className="text-xs text-slate-500">{formatDate(tool.date)}</span>
          <span className="text-xs text-slate-500">・{tool.readTime}分で読める</span>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight">
          {tool.title}
        </h1>
        <p className="mt-4 text-lg text-slate-400 leading-relaxed">
          {tool.description}
        </p>
      </header>

      {/* Divider */}
      <div className="border-t border-white/10 my-8" />

      {/* Content */}
      <div className="article-content" dangerouslySetInnerHTML={{ __html: tool.htmlContent || '' }} />

      {/* Back link */}
      <div className="mt-12 pt-8 border-t border-white/10">
        <a href="/" className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors">
          ← トップページに戻る
        </a>
      </div>
    </article>
  );
}
