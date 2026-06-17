import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { Button, Typography, Result, theme, ConfigProvider } from 'antd';
import { useTranslation } from '@alblue/i18n';
import { lightTheme, darkTheme } from '../styles/theme';
import { useThemeStore } from '../stores/theme-store';

const { Paragraph, Text } = Typography;

function DevErrorDetails({ error }: { error: Error }) {
  const { token } = theme.useToken();
  return (
    <Paragraph>
      <Text strong style={{ fontSize: 14, color: token.colorError }}>{error.message}</Text>
      <pre style={{ marginTop: 8, fontSize: 12, color: token.colorTextSecondary, maxHeight: 200, overflow: 'auto', background: token.colorFillSecondary, padding: 12, borderRadius: token.borderRadius }}>
        {error.stack}
      </pre>
    </Paragraph>
  );
}

// Class component can't use hooks, so the i18n-aware UI lives in this
// child function component. Switching locale re-renders it without
// reloading the page. The ErrorBoundary mounts ABOVE App.tsx's
// ConfigProvider, so when it catches we lose the user's dark/light
// theme — re-apply it here from the persisted theme-store so the error
// screen doesn't flash white on a dark-mode user.
function ErrorBoundaryUI({ error }: { error: Error | null }) {
  const { t } = useTranslation('dashboard');
  const mode = useThemeStore((s) => s.mode);
  const { token } = theme.useToken();
  return (
    <ConfigProvider theme={mode === 'dark' ? darkTheme : lightTheme}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: 24,
        background: token.colorBgLayout,
      }}>
        <Result
          status="500"
          title={t('errorBoundary.title')}
          subTitle={t('errorBoundary.subtitle')}
          extra={[
            <Button
              type="primary"
              key="reload"
              onClick={() => window.location.reload()}
            >
              {t('errorBoundary.reload')}
            </Button>,
            <Button
              key="home"
              onClick={() => { window.location.href = '/'; }}
            >
              {t('errorBoundary.home')}
            </Button>,
          ]}
        >
          {import.meta.env.DEV && error && <DevErrorDetails error={error} />}
        </Result>
      </div>
    </ConfigProvider>
  );
}

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return <ErrorBoundaryUI error={this.state.error} />;
  }
}
