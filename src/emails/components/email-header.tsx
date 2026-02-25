import {
  Section,
  Text,
} from '@react-email/components';

// craftGarden Design System Colors
const colors = {
  bgWarm: '#F5F2EC',
  textDeep: '#2D3B2E',
  textLight: '#8A9E8C',
  accentLeaf: '#6B8F71',
  border: 'rgba(107, 143, 113, 0.12)',
};

export function EmailHeader() {
  return (
    <Section style={headerStyle}>
      <Text style={kickerStyle}>
        AI SOLO CRAFT
      </Text>
      <Text style={logoStyle}>
        🌱 朝刊ダイジェスト
      </Text>
    </Section>
  );
}

const headerStyle: React.CSSProperties = {
  backgroundColor: colors.bgWarm,
  border: `1px solid ${colors.border}`,
  borderRadius: '16px',
  padding: '16px 20px',
  marginBottom: '16px',
  textAlign: 'center' as const,
};

const kickerStyle: React.CSSProperties = {
  margin: '0 0 4px',
  color: colors.accentLeaf,
  fontSize: '11px',
  letterSpacing: '0.12em',
  fontWeight: 600,
  textTransform: 'uppercase' as const,
};

const logoStyle: React.CSSProperties = {
  fontFamily: "'Nunito', 'Hiragino Kaku Gothic ProN', sans-serif",
  fontSize: '20px',
  fontWeight: 700,
  color: colors.textDeep,
  margin: '0',
};
