import { useState } from 'react';
import { Card, Typography, Space, Button, Divider, theme } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { useTranslation } from '@alblue/i18n';
import dayjs from 'dayjs';
import { changelog, DEFAULT_VISIBLE_COUNT, type ChangelogEntry } from './changelog';

const { Title, Text, Paragraph } = Typography;

export function WhatsNewPage() {
  const { t, i18n } = useTranslation('dashboard');
  const { token } = theme.useToken();
  const [showAll, setShowAll] = useState(false);

  const lang = (i18n.language === 'en' ? 'en' : 'sr') as 'sr' | 'en';
  const visible = showAll ? changelog : changelog.slice(0, DEFAULT_VISIBLE_COUNT);
  const olderCount = Math.max(0, changelog.length - DEFAULT_VISIBLE_COUNT);

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '24px 16px' }}>
      <Title level={3} style={{ marginBottom: 4 }}>
        {t('whatsNew.title')}
      </Title>
      <Text type="secondary">{t('whatsNew.subtitle')}</Text>
      <Divider />

      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        {visible.map((entry) => (
          <ChangelogEntryCard key={entry.id} entry={entry} lang={lang} token={token} />
        ))}
      </Space>

      {!showAll && olderCount > 0 && (
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Button icon={<DownOutlined />} onClick={() => setShowAll(true)}>
            {t('whatsNew.showOlder', { count: olderCount })}
          </Button>
        </div>
      )}
    </div>
  );
}

function ChangelogEntryCard({
  entry,
  lang,
  token,
}: {
  entry: ChangelogEntry;
  lang: 'sr' | 'en';
  token: ReturnType<typeof theme.useToken>['token'];
}) {
  return (
    <Card
      size="small"
      style={{ borderLeft: `3px solid ${token.colorPrimary}` }}
      title={
        <Space>
          <Text strong style={{ fontSize: 15 }}>
            {entry.title[lang]}
          </Text>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {dayjs(entry.date).format('DD.MM.YYYY')}
          </Text>
        </Space>
      }
    >
      <ul style={{ margin: 0, paddingLeft: 20 }}>
        {entry.bullets.map((b, i) => (
          <li key={i} style={{ marginBottom: 4 }}>
            <Paragraph style={{ marginBottom: 0 }}>{b[lang]}</Paragraph>
          </li>
        ))}
      </ul>
    </Card>
  );
}
