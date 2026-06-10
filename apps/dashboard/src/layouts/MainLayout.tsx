import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Layout, theme, Grid, Button, Drawer } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import { useAuthStore } from '@alblue/auth';
import {
  createConnection,
  startConnection,
  joinTenantGroup,
} from '@alblue/signalr-client';
import { tokenManager } from '@alblue/api-client';
import { SidebarMenu } from '../components/SidebarMenu';
import { SidebarFooter } from '../components/SidebarFooter';
import { ConnectionAlert } from '../components/ConnectionAlert';
import { useSignalRQueryInvalidation } from '../hooks/useSignalRQueryInvalidation';
import { useLayoutStore } from '../stores/layout-store';

const { Sider, Content } = Layout;

export function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const tenantId = useAuthStore((s) => s.tenantId);
  const { token: themeToken } = theme.useToken();
  const fullscreen = useLayoutStore((s) => s.fullscreen);
  const screens = Grid.useBreakpoint();
  // Mobile = anything below lg (antd lg is ≥ 992px). Below that, the Sider
  // hogs ~80px even collapsed; instead we hide it and offer a floating
  // hamburger button that opens a Drawer with the menu.
  const isMobile = screens.lg === false;
  const location = useLocation();

  // Auto-close the mobile drawer whenever the route changes (clicking a
  // menu item navigates, so the user expects the menu to dismiss).
  useEffect(() => {
    if (mobileDrawerOpen) setMobileDrawerOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  useSignalRQueryInvalidation();

  useEffect(() => {
    const jwt = tokenManager.getToken();
    if (!jwt || !tenantId) return;

    let cancelled = false;

    createConnection(jwt);
    startConnection()
      .then(() => {
        if (!cancelled) return joinTenantGroup();
      })
      .catch(console.error);

    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  // Sidebar inner content (logo + menu + footer). Re-used both as the
  // Sider's children on desktop and as the Drawer's body on mobile.
  const sidebarBody = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        style={{
          height: 48,
          margin: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <img
          src={isMobile || !collapsed ? '/alblue-logo-text.png' : '/alblue-logo.png'}
          alt="Alblue"
          style={{ height: isMobile || !collapsed ? 28 : 32, objectFit: 'contain' }}
        />
      </div>
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        <SidebarMenu collapsed={isMobile ? false : collapsed} />
      </div>
      <SidebarFooter collapsed={isMobile ? false : collapsed} />
    </div>
  );

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      {!fullscreen && !isMobile && (
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          breakpoint="lg"
          theme="dark"
          style={{ height: '100vh', position: 'sticky', top: 0, left: 0 }}
        >
          {sidebarBody}
        </Sider>
      )}
      {!fullscreen && isMobile && (
        <>
          <Button
            type="primary"
            shape="circle"
            size="large"
            icon={<MenuOutlined />}
            onClick={() => setMobileDrawerOpen(true)}
            style={{
              position: 'fixed',
              top: 12,
              left: 12,
              zIndex: 999,
              boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
            }}
            aria-label="Otvori meni"
          />
          <Drawer
            placement="left"
            width={260}
            open={mobileDrawerOpen}
            onClose={() => setMobileDrawerOpen(false)}
            closable={false}
            styles={{
              body: { padding: 0, background: '#001529' },
              header: { display: 'none' },
            }}
          >
            {sidebarBody}
          </Drawer>
        </>
      )}
      <Layout style={{ overflow: 'hidden' }}>
        <Content
          style={{
            margin: fullscreen ? 0 : (isMobile ? 12 : 24),
            padding: fullscreen ? 12 : (isMobile ? 12 : 24),
            paddingTop: !fullscreen && isMobile ? 60 : undefined,
            background: themeToken.colorBgContainer,
            borderRadius: fullscreen ? 0 : themeToken.borderRadius,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto',
          }}
        >
          {!fullscreen && <ConnectionAlert />}
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
