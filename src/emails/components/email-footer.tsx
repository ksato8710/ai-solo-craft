import {
  Section,
  Text,
  Link,
} from '@react-email/components';

interface EmailFooterProps {
  unsubscribeUrl?: string;
}

export function EmailFooter({ unsubscribeUrl }: EmailFooterProps) {
  return (
    <Section style={footerStyle}>
      <Text style={footerTextStyle}>
        AI Solo Builder — 複数ニュースレターで検知し、公式発表で確認し、日本語で要点整理して配信
      </Text>
      {unsubscribeUrl && (
        <Text style={unsubscribeStyle}>
          <Link href={unsubscribeUrl} style={unsubscribeLinkStyle}>
            配信停止はこちら
          </Link>
        </Text>
      )}
      <Text style={policyStyle}>
        すべての主要トピックで「公式発表（原文）」と「日本語の解説記事」を併記します。
      </Text>
      <Text style={copyrightStyle}>
        &copy; {new Date().getFullYear()} AI Solo Builder Editorial Desk
      </Text>
    </Section>
  );
}

const footerStyle: React.CSSProperties = {
  borderTop: '1px solid #3b362f',
  marginTop: '20px',
  paddingTop: '18px',
};

const footerTextStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#b6aa98',
  margin: '0 0 8px',
  textAlign: 'center' as const,
};

const unsubscribeStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#a2988a',
  margin: '0 0 8px',
  textAlign: 'center' as const,
};

const unsubscribeLinkStyle: React.CSSProperties = {
  color: '#e2d5c1',
  textDecoration: 'underline',
};

const policyStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#918577',
  margin: '0 0 8px',
  textAlign: 'center' as const,
};

const copyrightStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#7d7367',
  margin: '0',
  textAlign: 'center' as const,
};
