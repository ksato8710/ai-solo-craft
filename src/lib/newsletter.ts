import { createClient } from '@supabase/supabase-js';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing Supabase credentials');
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ── Validation ──

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

interface DigestRecord {
  id: string;
  slug: string;
  title: string;
  description: string;
  date: string;
  body_markdown: string | null;
}

interface RankingItemRecord {
  rank: number;
  headline: string;
  nva_total: number;
  source_url: string | null;
  news_content_id: string | null;
}

interface LinkedNewsRecord {
  id: string;
  slug: string;
  title: string;
  description: string;
  body_markdown: string | null;
}

interface EnrichedLinkedArticle {
  id: string;
  slug: string;
  title: string;
  description: string;
  keyPoints: string[];
  whyItMatters: string | null;
  primarySourceUrl: string | null;
  japaneseSourceUrl: string | null;
}

interface EnrichedRankingItem extends RankingItemRecord {
  article: EnrichedLinkedArticle | null;
}

function extractFirstUrl(text: string): string | null {
  const matched = text.match(/https?:\/\/[^\s)>\]]+/i);
  return matched ? matched[0] : null;
}

function extractSectionLines(bodyMarkdown: string, headingKeywords: string[]): string[] {
  const lines = bodyMarkdown.split(/\r?\n/);
  const lowerKeywords = headingKeywords.map((keyword) => keyword.toLowerCase());
  const headingIndex = lines.findIndex((line) => {
    const normalized = line.trim().toLowerCase();
    return normalized.startsWith('##') && lowerKeywords.some((keyword) => normalized.includes(keyword));
  });

  if (headingIndex < 0) return [];

  const sectionLines: string[] = [];
  for (let i = headingIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('##')) break;
    if (!line) continue;
    sectionLines.push(line);
  }
  return sectionLines;
}

function sanitizeLine(line: string): string {
  return line
    .replace(/^[-*]\s+/, '')
    .replace(/^\d+\.\s+/, '')
    .replace(/^>\s*/, '')
    .trim();
}

function extractKeyPoints(bodyMarkdown: string, limit = 3): string[] {
  const preferredSections = [
    ...extractSectionLines(bodyMarkdown, ['The details', '詳細', 'ポイント', '要点']),
    ...extractSectionLines(bodyMarkdown, ['今日やること', 'アクション', 'Next actions']),
    ...extractSectionLines(bodyMarkdown, ['Solo Builderへの影響', 'Why it matters']),
  ];

  const fromSections = preferredSections
    .map((line) => sanitizeLine(line))
    .filter((line) => line.length > 0 && !line.toLowerCase().startsWith('http'));

  if (fromSections.length > 0) {
    return [...new Set(fromSections)].slice(0, limit);
  }

  const fallback = bodyMarkdown
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^[-*]\s+/.test(line) || /^\d+\.\s+/.test(line))
    .map((line) => sanitizeLine(line))
    .filter((line) => line.length > 0 && !line.toLowerCase().startsWith('http'));

  return [...new Set(fallback)].slice(0, limit);
}

function extractWhyItMatters(bodyMarkdown: string, description: string): string | null {
  const section = extractSectionLines(bodyMarkdown, ['Why it matters', '重要', 'Solo Builderへの影響']);
  const line = section.map((text) => sanitizeLine(text)).find((text) => text.length > 0) ?? null;
  if (line) return line;
  return description || null;
}

function extractLabeledLink(bodyMarkdown: string, labels: string[]): string | null {
  const lowerLabels = labels.map((label) => label.toLowerCase());
  const lines = bodyMarkdown.split(/\r?\n/);

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (!lowerLabels.some((label) => lower.includes(label))) continue;

    const markdownLink = line.match(/\((https?:\/\/[^)]+)\)/i);
    if (markdownLink) return markdownLink[1];

    const plainUrl = extractFirstUrl(line);
    if (plainUrl) return plainUrl;
  }

  return null;
}

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email) && email.length <= 254;
}

// ── Rate limiting (IP-based, 5 per hour) ──

export async function isRateLimited(ip: string): Promise<boolean> {
  const supabase = getServiceClient();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { count, error } = await supabase
    .from('newsletter_subscribers')
    .select('*', { count: 'exact', head: true })
    .eq('ip_address', ip)
    .gte('created_at', oneHourAgo);

  if (error) {
    console.error('[newsletter] Rate limit check failed:', error);
    return false; // fail open
  }

  return (count ?? 0) >= 5;
}

// ── Subscribe ──

export interface SubscribeResult {
  ok: boolean;
  message: string;
  alreadyActive?: boolean;
}

export async function subscribe(
  email: string,
  ip: string,
  userAgent: string
): Promise<SubscribeResult> {
  const supabase = getServiceClient();

  // Check if already exists
  const { data: existing } = await supabase
    .from('newsletter_subscribers')
    .select('id, status, verify_token')
    .eq('email', email.toLowerCase())
    .single();

  if (existing) {
    if (existing.status === 'active') {
      return { ok: true, message: 'このメールアドレスは既に登録済みです。', alreadyActive: true };
    }
    // Re-send verification for pending/unsubscribed
    const { error } = await supabase
      .from('newsletter_subscribers')
      .update({
        status: 'pending_verification' as const,
        ip_address: ip,
        user_agent: userAgent,
        unsubscribed_at: null,
      })
      .eq('id', existing.id);

    if (error) {
      console.error('[newsletter] Re-subscribe update failed:', error);
      return { ok: false, message: '登録に失敗しました。もう一度お試しください。' };
    }

    return { ok: true, message: '確認メールを再送しました。メールをご確認ください。' };
  }

  // New subscriber
  const { error } = await supabase
    .from('newsletter_subscribers')
    .insert({
      email: email.toLowerCase(),
      ip_address: ip,
      user_agent: userAgent,
    });

  if (error) {
    console.error('[newsletter] Insert failed:', error);
    return { ok: false, message: '登録に失敗しました。もう一度お試しください。' };
  }

  return { ok: true, message: '確認メールを送信しました。メールをご確認ください。' };
}

// ── Get subscriber by email (for sending verification) ──

export async function getSubscriberByEmail(email: string) {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from('newsletter_subscribers')
    .select('id, email, status, verify_token, unsubscribe_token')
    .eq('email', email.toLowerCase())
    .single();
  return data;
}

// ── Confirm (verify) ──

export async function confirmSubscriber(token: string): Promise<boolean> {
  const supabase = getServiceClient();

  const { data: subscriber } = await supabase
    .from('newsletter_subscribers')
    .select('id, status')
    .eq('verify_token', token)
    .single();

  if (!subscriber) return false;

  if (subscriber.status === 'active') return true; // already verified

  const { error } = await supabase
    .from('newsletter_subscribers')
    .update({
      status: 'active' as const,
      verified_at: new Date().toISOString(),
    })
    .eq('id', subscriber.id);

  return !error;
}

// ── Unsubscribe ──

export async function unsubscribeByToken(
  token: string,
  reason?: string
): Promise<boolean> {
  const supabase = getServiceClient();

  const { data: subscriber } = await supabase
    .from('newsletter_subscribers')
    .select('id, status')
    .eq('unsubscribe_token', token)
    .single();

  if (!subscriber) return false;

  if (subscriber.status === 'unsubscribed') return true;

  const { error } = await supabase
    .from('newsletter_subscribers')
    .update({
      status: 'unsubscribed' as const,
      unsubscribed_at: new Date().toISOString(),
      unsubscribe_reason: reason || null,
    })
    .eq('id', subscriber.id);

  return !error;
}

// ── Get active subscribers ──

export async function getActiveSubscribers() {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .select('id, email, unsubscribe_token')
    .eq('status', 'active');

  if (error) {
    console.error('[newsletter] Fetch active subscribers failed:', error);
    return [];
  }

  return data || [];
}

// ── Get latest morning digest ──

export async function getLatestMorningDigest() {
  const supabase = getServiceClient();

  const { data: digest } = await supabase
    .from('contents')
    .select(`
      id, slug, title, description, date, body_markdown,
      digest_details!inner(edition)
    `)
    .eq('status', 'published')
    .eq('content_type', 'digest')
    .eq('digest_details.edition', 'morning')
    .order('date', { ascending: false })
    .limit(1)
    .single();

  if (!digest) return null;

  const digestRecord = digest as DigestRecord;

  // Get ranking items
  const { data: ranking } = await supabase
    .from('digest_rankings')
    .select(`
      id,
      digest_ranking_items(rank, headline, nva_total, source_url, news_content_id)
    `)
    .eq('digest_content_id', digestRecord.id)
    .single();

  const rankingItemsRaw =
    (((ranking?.digest_ranking_items ?? []) as RankingItemRecord[]) ?? []).sort(
      (a, b) => a.rank - b.rank
    );

  const linkedNewsIds = [...new Set(
    rankingItemsRaw
      .map((item) => item.news_content_id)
      .filter((value): value is string => typeof value === 'string' && value.length > 0)
  )];

  const linkedNewsMap = new Map<string, LinkedNewsRecord>();

  if (linkedNewsIds.length > 0) {
    const { data: linkedNewsRows } = await supabase
      .from('contents')
      .select('id, slug, title, description, body_markdown')
      .in('id', linkedNewsIds);

    for (const row of (linkedNewsRows ?? []) as LinkedNewsRecord[]) {
      linkedNewsMap.set(row.id, row);
    }
  }

  const rankingItems: EnrichedRankingItem[] = rankingItemsRaw.map((item) => {
    const linked = item.news_content_id ? linkedNewsMap.get(item.news_content_id) : undefined;
    if (!linked) {
      return { ...item, article: null };
    }

    const body = linked.body_markdown ?? '';
    const primarySourceUrl =
      extractLabeledLink(body, ['EN一次情報', 'EN source', 'Primary source', 'Original']) ||
      item.source_url;
    const japaneseSourceUrl = extractLabeledLink(body, ['JPリンク', 'JP補足', '日本語', 'JA参考']);
    const keyPoints = extractKeyPoints(body, 3);
    const whyItMatters = extractWhyItMatters(body, linked.description);

    return {
      ...item,
      article: {
        id: linked.id,
        slug: linked.slug,
        title: linked.title,
        description: linked.description,
        keyPoints,
        whyItMatters,
        primarySourceUrl,
        japaneseSourceUrl,
      },
    };
  });

  return {
    ...digestRecord,
    rankingItems,
  };
}

// ── Send log ──

export async function createSendLog(params: {
  digestContentId: string | null;
  subject: string;
  sendDate: string;
  totalRecipients: number;
}) {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from('newsletter_send_logs')
    .insert({
      digest_content_id: params.digestContentId,
      subject: params.subject,
      send_date: params.sendDate,
      total_recipients: params.totalRecipients,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[newsletter] Create send log failed:', error);
    return null;
  }

  return data?.id;
}

export async function updateSendLog(
  logId: string,
  params: {
    successfulSends: number;
    failedSends: number;
    errors: unknown[];
  }
) {
  const supabase = getServiceClient();

  await supabase
    .from('newsletter_send_logs')
    .update({
      successful_sends: params.successfulSends,
      failed_sends: params.failedSends,
      errors: params.errors,
      completed_at: new Date().toISOString(),
    })
    .eq('id', logId);
}

// ── Slack notification ──

export async function notifySlack(text: string) {
  const token = process.env.SLACK_BOT_TOKEN;
  const channel = process.env.SLACK_NOTIFICATION_CHANNEL;
  if (!token || !channel) return;

  try {
    await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ channel, text }),
    });
  } catch (e) {
    console.error('[newsletter] Slack notification failed:', e);
  }
}

// ── Check if already sent today ──

export async function hasAlreadySentToday(date: string): Promise<boolean> {
  const supabase = getServiceClient();

  const { count } = await supabase
    .from('newsletter_send_logs')
    .select('*', { count: 'exact', head: true })
    .eq('send_date', date)
    .gt('successful_sends', 0);

  return (count ?? 0) > 0;
}
