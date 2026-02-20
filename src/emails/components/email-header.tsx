import {
  Section,
  Text,
} from '@react-email/components';

export function EmailHeader() {
  return (
    <Section style={headerStyle}>
      <Text style={kickerStyle}>
        AI SOLO BUILDER 編集部
      </Text>
      <Text style={logoStyle}>
        朝刊ダイジェスト
      </Text>
    </Section>
  );
}

const headerStyle: React.CSSProperties = {
  backgroundColor: '#1d1a15',
  border: '2px solid #372f24',
  borderRadius: '10px',
  padding: '12px 16px',
  marginBottom: '14px',
};

const kickerStyle: React.CSSProperties = {
  margin: '0 0 4px',
  color: '#d2b48c',
  fontSize: '10px',
  letterSpacing: '0.08em',
  fontWeight: 700,
};

const logoStyle: React.CSSProperties = {
  fontFamily: "'Merriweather', 'Hiragino Mincho ProN', 'Yu Mincho', serif",
  fontSize: '21px',
  fontWeight: 700,
  color: '#f6efe3',
  margin: '0',
};
