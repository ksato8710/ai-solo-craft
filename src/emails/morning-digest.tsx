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

// craftGarden Design System Colors
const colors = {
  bgCream: '#FAFAF5',
  bgWarm: '#F5F2EC',
  bgCard: '#F0EDE6',
  textDeep: '#2D3B2E',
  textMuted: '#5C7260',
  textLight: '#8A9E8C',
  accentLeaf: '#6B8F71',
  accentSage: '#9BB09E',
  accentMoss: '#4A7051',
  accentBark: '#8B7355',
  accentBloom: '#C4926B',
  border: 'rgba(107, 143, 113, 0.12)',
  borderHover: 'rgba(107, 143, 113, 0.25)',
};

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

          {/* Hero Card */}
          <Section style={heroCardStyle}>
            <Text style={eyebrowStyle}>AI SOLO CRAFT 朝刊</Text>
            <Text style={dateStyle}>{formatDate(date)}</Text>
            <Text style={titleStyle}>{title}</Text>
            <Text style={descriptionStyle}>{description}</Text>
            <Section style={heroLinkRowStyle}>
              <Link href={digestUrl} style={heroInlineLinkStyle}>
                Web版で読む →
              </Link>
            </Section>
          </Section>

          {/* Today's Topics */}
          {rundownLines.length > 0 && (
            <Section style={summaryCardStyle}>
              <Text style={sectionTitleStyle}>🌱 本日の主要トピック</Text>
              {rundownLines.map((line, index) => (
                <Text key={`rundown-${index}`} style={summaryLineStyle}>
                  {index + 1}. {line}
                </Text>
              ))}
            </Section>
          )}

          {/* Top 3 Stories */}
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
                  #{item.rank} 注目トピック
                </Text>
                <Text style={storyHeadlineStyle}>{item.headline}</Text>

                {summaryText && (
                  <Text style={storyParagraphStyle}>
                    {summaryText}
                  </Text>
                )}

                {whyText && (
                  <Section style={whyBoxStyle}>
                    <Text style={whyLabelStyle}>💡 なぜ重要か</Text>
                    <Text style={whyTextStyle}>{whyText}</Text>
                  </Section>
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
                      公式発表を見る
                    </Link>
                  )}
                  {japaneseUrl && (
                    <Link href={japaneseUrl} style={tagLinkSecondaryStyle}>
                      日本語解説
                    </Link>
                  )}
                  {articleUrl && (
                    <Link href={articleUrl} style={tagLinkNeutralStyle}>
                      詳細記事
                    </Link>
                  )}
                </Section>
              </Section>
            );
          })}

          {/* Quick Hits */}
          {quickHits.length > 0 && (
            <Section style={quickHitsCardStyle}>
              <Text style={sectionTitleStyle}>📋 その他のニュース</Text>
              {quickHits.map((item) => (
                <Text key={`quick-${item.rank}`} style={quickHitLineStyle}>
                  <span style={quickRankStyle}>#{item.rank}</span> {item.headline}
                </Text>
              ))}
            </Section>
          )}

          {/* Action Items */}
          {actionLines.length > 0 && (
            <Section style={actionsCardStyle}>
              <Text style={sectionTitleStyle}>✅ 今日の実行アクション</Text>
              {actionLines.map((line, idx) => (
                <Text key={`action-${idx}`} style={actionLineStyle}>
                  {idx + 1}. {line}
                </Text>
              ))}
            </Section>
          )}

          {/* CTA */}
          <Section style={ctaContainerStyle}>
            <Text style={ctaCopyStyle}>
              各トピックを「今やる / 後でやる / 見送り」の判断軸まで分解しています
            </Text>
            <Button href={digestUrl} style={ctaButtonStyle}>
              サイトで詳細を読む
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

// ─────────────────────────────────────────────────────────────
// craftGarden Design System Styles
// ─────────────────────────────────────────────────────────────

const bodyStyle: React.CSSProperties = {
  backgroundColor: colors.bgCream,
  fontFamily: "'DM Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', sans-serif",
  margin: '0',
  padding: '0',
};

const containerStyle: React.CSSProperties = {
  maxWidth: '600px',
  margin: '0 auto',
  padding: '24px 16px',
};

const heroCardStyle: React.CSSProperties = {
  backgroundColor: colors.bgCard,
  border: `1px solid ${colors.border}`,
  borderRadius: '16px',
  padding: '24px',
  marginBottom: '16px',
};

const eyebrowStyle: React.CSSProperties = {
  fontSize: '11px',
  letterSpacing: '0.1em',
  color: colors.accentLeaf,
  margin: '0 0 8px',
  fontWeight: 600,
  textTransform: 'uppercase' as const,
};

const dateStyle: React.CSSProperties = {
  fontSize: '13px',
  color: colors.textLight,
  margin: '0 0 12px',
};

const titleStyle: React.CSSProperties = {
  fontFamily: "'Nunito', 'Hiragino Kaku Gothic ProN', sans-serif",
  fontSize: '24px',
  lineHeight: '1.35',
  color: colors.textDeep,
  margin: '0 0 12px',
  fontWeight: 700,
};

const descriptionStyle: React.CSSProperties = {
  fontSize: '15px',
  lineHeight: '1.7',
  color: colors.textMuted,
  margin: '0',
};

const heroLinkRowStyle: React.CSSProperties = {
  marginTop: '16px',
};

const heroInlineLinkStyle: React.CSSProperties = {
  fontSize: '14px',
  color: colors.accentLeaf,
  textDecoration: 'none',
  fontWeight: 600,
};

const sectionTitleStyle: React.CSSProperties = {
  fontFamily: "'Nunito', 'Hiragino Kaku Gothic ProN', sans-serif",
  color: colors.textDeep,
  fontSize: '16px',
  margin: '0 0 12px',
  fontWeight: 700,
};

const summaryCardStyle: React.CSSProperties = {
  backgroundColor: colors.bgWarm,
  borderRadius: '16px',
  padding: '20px',
  marginBottom: '16px',
};

const summaryLineStyle: React.CSSProperties = {
  color: colors.textMuted,
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 8px',
};

const storyCardStyle: React.CSSProperties = {
  backgroundColor: colors.bgCard,
  border: `1px solid ${colors.border}`,
  borderRadius: '16px',
  padding: '20px',
  marginBottom: '12px',
};

const storyKickerStyle: React.CSSProperties = {
  fontSize: '12px',
  color: colors.accentBloom,
  letterSpacing: '0.03em',
  margin: '0 0 8px',
  fontWeight: 600,
};

const storyHeadlineStyle: React.CSSProperties = {
  fontFamily: "'Nunito', 'Hiragino Kaku Gothic ProN', sans-serif",
  fontSize: '18px',
  lineHeight: '1.4',
  color: colors.textDeep,
  margin: '0 0 12px',
  fontWeight: 700,
};

const storyParagraphStyle: React.CSSProperties = {
  fontSize: '14px',
  lineHeight: '1.7',
  color: colors.textMuted,
  margin: '0 0 12px',
};

const whyBoxStyle: React.CSSProperties = {
  backgroundColor: colors.bgWarm,
  borderRadius: '12px',
  padding: '14px',
  marginBottom: '12px',
  borderLeft: `3px solid ${colors.accentLeaf}`,
};

const whyLabelStyle: React.CSSProperties = {
  fontSize: '12px',
  color: colors.accentMoss,
  fontWeight: 600,
  margin: '0 0 6px',
};

const whyTextStyle: React.CSSProperties = {
  fontSize: '13px',
  lineHeight: '1.6',
  color: colors.textMuted,
  margin: '0',
};

const pointsWrapStyle: React.CSSProperties = {
  marginBottom: '12px',
  paddingLeft: '4px',
};

const pointLineStyle: React.CSSProperties = {
  color: colors.textMuted,
  fontSize: '13px',
  lineHeight: '1.6',
  margin: '0 0 6px',
};

const linkRowStyle: React.CSSProperties = {
  marginTop: '12px',
};

const tagLinkBaseStyle: React.CSSProperties = {
  display: 'inline-block',
  fontSize: '12px',
  textDecoration: 'none',
  marginRight: '8px',
  marginBottom: '6px',
  padding: '6px 12px',
  borderRadius: '999px',
};

const tagLinkPrimaryStyle: React.CSSProperties = {
  ...tagLinkBaseStyle,
  color: '#fff',
  backgroundColor: colors.accentLeaf,
};

const tagLinkSecondaryStyle: React.CSSProperties = {
  ...tagLinkBaseStyle,
  color: colors.accentMoss,
  backgroundColor: 'rgba(107, 143, 113, 0.12)',
};

const tagLinkNeutralStyle: React.CSSProperties = {
  ...tagLinkBaseStyle,
  color: colors.textMuted,
  backgroundColor: colors.bgWarm,
};

const quickHitsCardStyle: React.CSSProperties = {
  backgroundColor: colors.bgCard,
  border: `1px solid ${colors.border}`,
  borderRadius: '16px',
  padding: '20px',
  marginBottom: '12px',
};

const quickHitLineStyle: React.CSSProperties = {
  fontSize: '13px',
  color: colors.textMuted,
  lineHeight: '1.7',
  margin: '0 0 8px',
};

const quickRankStyle: React.CSSProperties = {
  color: colors.accentBloom,
  fontWeight: 600,
};

const actionsCardStyle: React.CSSProperties = {
  backgroundColor: 'rgba(107, 143, 113, 0.08)',
  border: `1px solid ${colors.border}`,
  borderRadius: '16px',
  padding: '20px',
  marginBottom: '16px',
};

const actionLineStyle: React.CSSProperties = {
  color: colors.textMuted,
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 8px',
};

const ctaContainerStyle: React.CSSProperties = {
  textAlign: 'center' as const,
  backgroundColor: colors.bgCard,
  border: `1px solid ${colors.border}`,
  borderRadius: '16px',
  padding: '24px 20px',
  marginTop: '8px',
};

const ctaCopyStyle: React.CSSProperties = {
  color: colors.textMuted,
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 16px',
};

const ctaButtonStyle: React.CSSProperties = {
  backgroundColor: colors.accentLeaf,
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 600,
  padding: '14px 28px',
  borderRadius: '999px',
  textDecoration: 'none',
  display: 'inline-block',
};

const dividerStyle: React.CSSProperties = {
  borderColor: colors.border,
  margin: '24px 0 0',
};
