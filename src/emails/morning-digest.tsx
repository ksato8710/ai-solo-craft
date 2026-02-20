import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
  Button,
  Hr,
  Preview,
} from '@react-email/components';
import { EmailHeader } from './components/email-header';
import { EmailFooter } from './components/email-footer';

interface RankingArticle {
  id: string;
  slug: string;
  title: string;
  description: string;
  keyPoints: string[];
  whyItMatters: string | null;
  primarySourceUrl: string | null;
  japaneseSourceUrl: string | null;
}

interface RankingItem {
  rank: number;
  headline: string;
  nva_total: number;
  source_url?: string | null;
  article?: RankingArticle | null;
}

interface MorningDigestEmailProps {
  title: string;
  date: string;
  description: string;
  digestUrl: string;
  digestBody?: string | null;
  siteUrl: string;
  rankingItems: RankingItem[];
  unsubscribeUrl: string;
}

const TOP_SUMMARY_MAX = 210;
const TOP_WHY_MAX = 150;
const TOP_POINT_MAX = 92;
const QUICK_HIT_MIN_NVA = 75;

function toPlainText(input: string): string {
  return input
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '$1')
    .replace(/https?:\/\/[^\s)]+/g, '')
    .replace(/[*_`>#-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function clampSentence(input: string, max: number): string {
  const text = toPlainText(input);
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trim()}…`;
}

function buildTopSummary(description?: string | null, points: string[] = []): string | null {
  const candidates = [description || '', ...points]
    .map((line) => toPlainText(line))
    .filter((line) => line.length > 0);
  if (candidates.length === 0) return null;
  const primary = candidates[0];
  if (primary.length >= 100) return clampSentence(primary, TOP_SUMMARY_MAX);
  const merged = candidates.slice(0, 2).join(' ');
  return clampSentence(merged, TOP_SUMMARY_MAX);
}

function buildWhyText(why?: string | null, fallback?: string | null): string | null {
  const candidate = why || fallback;
  if (!candidate) return null;
  return clampSentence(candidate, TOP_WHY_MAX);
}

function buildKeyPoints(points: string[], fallback?: string | null): string[] {
  const normalized = points
    .map((line) => clampSentence(line, TOP_POINT_MAX))
    .filter((line) => line.length >= 20);

  if (normalized.length > 0) return normalized.slice(0, 3);

  if (!fallback) return [];
  return [clampSentence(fallback, TOP_POINT_MAX)];
}

function formatDate(date: string): string {
  const parsed = new Date(`${date}T09:00:00+09:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
}

function extractActionLines(digestBody?: string | null): string[] {
  if (!digestBody) return [];
  const lines = digestBody.split(/\r?\n/);
  const sectionIndex = lines.findIndex((line) => /##\s*(今日の即実行アクション|アクション|next actions)/i.test(line));
  if (sectionIndex < 0) return [];

  const actionLines: string[] = [];
  for (let i = sectionIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (line.startsWith('##')) break;
    if (!/^[-*]\s+/.test(line) && !/^\d+\.\s+/.test(line)) continue;
    actionLines.push(line.replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, '').trim());
  }
  return actionLines.slice(0, 3);
}

export function MorningDigestEmail({
  title,
  date,
  description,
  digestUrl,
  digestBody,
  siteUrl,
  rankingItems,
  unsubscribeUrl,
}: MorningDigestEmailProps) {
  const top3 = rankingItems.slice(0, 3);
  const quickHits = rankingItems
    .slice(3, 10)
    .filter((item) => item.nva_total >= QUICK_HIT_MIN_NVA && Boolean(item.source_url));
  const actionLines = extractActionLines(digestBody);
  const rundownLines = top3.map((item) => item.article?.title || item.headline);

  return (
    <Html>
      <Head />
      <Preview>{title}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <EmailHeader />

          <Section style={heroCardStyle}>
            <Text style={eyebrowStyle}>AI SOLO BUILDER 朝刊</Text>
            <Text style={dateStyle}>{formatDate(date)}</Text>
            <Text style={titleStyle}>{title}</Text>
            <Text style={descriptionStyle}>{description}</Text>
            <Section style={heroLinkRowStyle}>
              <Link href={digestUrl} style={heroInlineLinkStyle}>
                Web版で読む
              </Link>
              <Text style={heroDividerStyle}>|</Text>
              <Link href={`${siteUrl}/newsletter/confirmed`} style={heroInlineLinkStyle}>
                配信案内
              </Link>
            </Section>
          </Section>

          {rundownLines.length > 0 && (
            <Section style={summaryCardStyle}>
              <Text style={sectionTitleStyle}>本日の主要トピック</Text>
              {rundownLines.map((line, index) => (
                <Text key={`rundown-${index}`} style={summaryLineStyle}>
                  • {line}
                </Text>
              ))}
            </Section>
          )}

          {top3.map((item) => {
            const articleUrl = item.article?.slug ? `${siteUrl}/news/${item.article.slug}` : null;
            const primaryUrl = item.article?.primarySourceUrl || item.source_url;
            const japaneseUrl = item.article?.japaneseSourceUrl || null;
            const keyPoints = item.article?.keyPoints || [];
            const summaryText = buildTopSummary(item.article?.description, keyPoints);
            const whyText = buildWhyText(item.article?.whyItMatters, item.article?.description);
            const renderedPoints = buildKeyPoints(keyPoints, summaryText);

            return (
              <Section key={`top-${item.rank}`} style={storyCardStyle}>
                <Text style={storyKickerStyle}>
                  注目トピック #{item.rank} ・ NVA {item.nva_total}
                </Text>
                <Text style={storyHeadlineStyle}>{item.headline}</Text>

                {summaryText && (
                  <Text style={storyParagraphStyle}>
                    <strong>概要:</strong> {summaryText}
                  </Text>
                )}

                {whyText && (
                  <Text style={storyParagraphStyle}>
                    <strong>なぜ重要か:</strong> {whyText}
                  </Text>
                )}

                {renderedPoints.length > 0 && (
                  <Section style={pointsWrapStyle}>
                    {renderedPoints.map((point, idx) => (
                      <Text key={`point-${item.rank}-${idx}`} style={pointLineStyle}>
                        • {point}
                      </Text>
                    ))}
                  </Section>
                )}

                <Section style={linkRowStyle}>
                  {primaryUrl && (
                    <Link href={primaryUrl} style={tagLinkPrimaryStyle}>
                      公式発表（原文）
                    </Link>
                  )}
                  {japaneseUrl && (
                    <Link href={japaneseUrl} style={tagLinkSecondaryStyle}>
                      日本語の解説記事
                    </Link>
                  )}
                  {articleUrl && (
                    <Link href={articleUrl} style={tagLinkNeutralStyle}>
                      本サイトの詳細解説
                    </Link>
                  )}
                </Section>
              </Section>
            );
          })}

          {quickHits.length > 0 && (
            <Section style={quickHitsCardStyle}>
              <Text style={sectionTitleStyle}>速報一覧</Text>
              {quickHits.map((item) => (
                <Text key={`quick-${item.rank}`} style={quickHitLineStyle}>
                  <span style={quickRankStyle}>#{item.rank}</span> {item.headline}{' '}
                  <span style={quickNvaStyle}>({item.nva_total})</span>
                </Text>
              ))}
            </Section>
          )}

          {actionLines.length > 0 && (
            <Section style={actionsCardStyle}>
              <Text style={sectionTitleStyle}>今日の実行アクション</Text>
              {actionLines.map((line, idx) => (
                <Text key={`action-${idx}`} style={summaryLineStyle}>
                  {idx + 1}. {line}
                </Text>
              ))}
            </Section>
          )}

          <Section style={ctaContainerStyle}>
            <Text style={ctaCopyStyle}>
              全文では、各トピックを「今やる / 後でやる / 見送り」の判断軸まで分解しています。
            </Text>
            <Button href={digestUrl} style={ctaButtonStyle}>
              サイトで詳細分析を読む
            </Button>
          </Section>

          <Hr style={dividerStyle} />
          <EmailFooter unsubscribeUrl={unsubscribeUrl} />
        </Container>
      </Body>
    </Html>
  );
}

export default MorningDigestEmail;

const bodyStyle: React.CSSProperties = {
  backgroundColor: '#0f0f0f',
  fontFamily:
    "'IBM Plex Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', 'Segoe UI', sans-serif",
  margin: '0',
  padding: '0',
};

const containerStyle: React.CSSProperties = {
  maxWidth: '640px',
  margin: '0 auto',
  padding: '18px',
};

const heroCardStyle: React.CSSProperties = {
  backgroundColor: '#f5f0e4',
  border: '2px solid #1f1f1f',
  borderRadius: '10px',
  padding: '18px',
  marginBottom: '14px',
};

const eyebrowStyle: React.CSSProperties = {
  fontSize: '11px',
  letterSpacing: '0.08em',
  color: '#6a2018',
  margin: '0 0 6px',
  fontWeight: 700,
};

const dateStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#3f3a34',
  margin: '0 0 8px',
};

const titleStyle: React.CSSProperties = {
  fontFamily: "'Merriweather', 'Hiragino Mincho ProN', 'Yu Mincho', serif",
  fontSize: '26px',
  lineHeight: '1.35',
  color: '#151515',
  margin: '0 0 10px',
  fontWeight: 700,
};

const descriptionStyle: React.CSSProperties = {
  fontSize: '15px',
  lineHeight: '1.7',
  color: '#2b2a28',
  margin: '0',
};

const heroLinkRowStyle: React.CSSProperties = {
  marginTop: '12px',
};

const heroInlineLinkStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#8a1c11',
  textDecoration: 'underline',
};

const heroDividerStyle: React.CSSProperties = {
  display: 'inline-block',
  margin: '0 8px',
  color: '#6d655b',
  fontSize: '12px',
};

const sectionTitleStyle: React.CSSProperties = {
  fontFamily: "'Merriweather', 'Hiragino Mincho ProN', 'Yu Mincho', serif",
  color: '#f7f7f7',
  fontSize: '18px',
  margin: '0 0 10px',
  fontWeight: 700,
};

const summaryCardStyle: React.CSSProperties = {
  backgroundColor: '#1c1b19',
  borderRadius: '10px',
  padding: '16px',
  marginBottom: '14px',
};

const summaryLineStyle: React.CSSProperties = {
  color: '#efebe3',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 8px',
};

const storyCardStyle: React.CSSProperties = {
  backgroundColor: '#171717',
  border: '1px solid #393630',
  borderRadius: '10px',
  padding: '16px',
  marginBottom: '12px',
};

const storyKickerStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#dca35d',
  letterSpacing: '0.05em',
  margin: '0 0 7px',
  fontWeight: 700,
};

const storyHeadlineStyle: React.CSSProperties = {
  fontFamily: "'Merriweather', 'Hiragino Mincho ProN', 'Yu Mincho', serif",
  fontSize: '21px',
  lineHeight: '1.35',
  color: '#f6f2eb',
  margin: '0 0 10px',
  fontWeight: 700,
};

const storyParagraphStyle: React.CSSProperties = {
  fontSize: '14px',
  lineHeight: '1.7',
  color: '#d8d2c8',
  margin: '0 0 10px',
};

const pointsWrapStyle: React.CSSProperties = {
  marginBottom: '8px',
  paddingLeft: '2px',
};

const pointLineStyle: React.CSSProperties = {
  color: '#eee6d8',
  fontSize: '13px',
  lineHeight: '1.55',
  margin: '0 0 6px',
};

const linkRowStyle: React.CSSProperties = {
  marginTop: '10px',
};

const tagLinkBaseStyle: React.CSSProperties = {
  display: 'inline-block',
  fontSize: '12px',
  textDecoration: 'none',
  marginRight: '8px',
  marginBottom: '6px',
  padding: '5px 8px',
  borderRadius: '999px',
  border: '1px solid',
};

const tagLinkPrimaryStyle: React.CSSProperties = {
  ...tagLinkBaseStyle,
  color: '#172332',
  backgroundColor: '#d3e8ff',
  borderColor: '#9dc8f4',
};

const tagLinkSecondaryStyle: React.CSSProperties = {
  ...tagLinkBaseStyle,
  color: '#243312',
  backgroundColor: '#ddf4cf',
  borderColor: '#9fd17c',
};

const tagLinkNeutralStyle: React.CSSProperties = {
  ...tagLinkBaseStyle,
  color: '#f5ead8',
  backgroundColor: '#5d4938',
  borderColor: '#8b7056',
};

const quickHitsCardStyle: React.CSSProperties = {
  backgroundColor: '#131313',
  border: '1px solid #323232',
  borderRadius: '10px',
  padding: '14px 16px',
  marginBottom: '12px',
};

const quickHitLineStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#ddd9d1',
  lineHeight: '1.65',
  margin: '0 0 8px',
};

const quickRankStyle: React.CSSProperties = {
  color: '#e8b26c',
  fontWeight: 700,
};

const quickNvaStyle: React.CSSProperties = {
  color: '#9a9388',
  fontSize: '12px',
};

const actionsCardStyle: React.CSSProperties = {
  backgroundColor: '#112014',
  border: '1px solid #36523b',
  borderRadius: '10px',
  padding: '14px 16px',
  marginBottom: '12px',
};

const ctaContainerStyle: React.CSSProperties = {
  textAlign: 'center' as const,
  backgroundColor: '#f5f0e4',
  border: '2px solid #1f1f1f',
  borderRadius: '10px',
  padding: '18px 14px',
  marginTop: '4px',
};

const ctaCopyStyle: React.CSSProperties = {
  color: '#2a2620',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 12px',
};

const ctaButtonStyle: React.CSSProperties = {
  backgroundColor: '#8a1c11',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 700,
  padding: '12px 24px',
  borderRadius: '8px',
  textDecoration: 'none',
  display: 'inline-block',
};

const dividerStyle: React.CSSProperties = {
  borderColor: '#393530',
  margin: '18px 0 0',
};
