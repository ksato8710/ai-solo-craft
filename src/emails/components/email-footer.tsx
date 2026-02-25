import {
  Section,
  Text,
  Link,
} from '@react-email/components';

// craftGarden Design System Colors
const colors = {
  textMuted: '#5C7260',
  textLight: '#8A9E8C',
  accentLeaf: '#6B8F71',
  border: 'rgba(107, 143, 113, 0.12)',
};

interface EmailFooterProps {
  unsubscribeUrl?: string;
}

export function EmailFooter({ unsubscribeUrl }: EmailFooterProps) {
  return (
    <Section style={footerStyle}>
      <Text style={footerTextStyle}>
        AI Solo Craft — 複数ソースで検知、公式発表で確認、日本語で要点整理
      </Text>
      {unsubscribeUrl && (
        <Text style={unsubscribeStyle}>
          <Link href={unsubscribeUrl} style={unsubscribeLinkStyle}>
            配信停止
          </Link>
        </Text>
      )}
      <Text style={policyStyle}>
        主要トピックは「公式発表（原文）」と「日本語の解説記事」を併記します
      </Text>
      <Text style={copyrightStyle}>
        © {new Date().getFullYear()} AI Solo Craft
      </Text>
    </Section>
  );
}

const footerStyle: React.CSSProperties = {
  borderTop: `1px solid ${colors.border}`,
  marginTop: '20px',
  paddingTop: '20px',
};

const footerTextStyle: React.CSSProperties = {
  fontSize: '13px',
  color: colors.textMuted,
  margin: '0 0 12px',
  textAlign: 'center' as const,
  lineHeight: '1.5',
};

const unsubscribeStyle: React.CSSProperties = {
  fontSize: '12px',
  color: colors.textLight,
  margin: '0 0 12px',
  textAlign: 'center' as const,
};

const unsubscribeLinkStyle: React.CSSProperties = {
  color: colors.accentLeaf,
  textDecoration: 'underline',
};

const policyStyle: React.CSSProperties = {
  fontSize: '11px',
  color: colors.textLight,
  margin: '0 0 12px',
  textAlign: 'center' as const,
  lineHeight: '1.5',
};

const copyrightStyle: React.CSSProperties = {
  fontSize: '11px',
  color: colors.textLight,
  margin: '0',
  textAlign: 'center' as const,
};
