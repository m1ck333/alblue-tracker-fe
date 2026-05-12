import { Outlet } from 'react-router-dom';
import { Layout, theme } from 'antd';
import { PublicLanguageSwitcher } from '../components/PublicLanguageSwitcher';

export function AuthLayout() {
  const { token } = theme.useToken();
  // flex-start (not center) so a long page like /o-aplikaciji scrolls from the
  // top instead of clipping. Short content (login Card) just sits near the top
  // with the paddingTop breathing room.
  return (
    <Layout
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        background: token.colorBgLayout,
        paddingTop: 'clamp(24px, 8vh, 80px)',
        paddingBottom: 24,
      }}
    >
      <PublicLanguageSwitcher />
      <Outlet />
    </Layout>
  );
}
