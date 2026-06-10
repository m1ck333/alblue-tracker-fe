import { useState, useCallback } from 'react';
import { Badge, Button, Popover, List, Menu, Typography, Space, Empty, Tooltip, Divider, Segmented, theme, Grid, Drawer } from 'antd';
import {
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  GlobalOutlined,
  SunOutlined,
  MoonOutlined,
  CheckOutlined,
  DeleteOutlined,
  ClearOutlined,
  EyeInvisibleOutlined,
  InfoCircleOutlined,
  BookOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@alblue/api-client';
import { useAuthStore } from '@alblue/auth';
import { useTranslation } from '@alblue/i18n';
import type { NotificationDto } from '@alblue/shared-types';
import { NotificationType } from '@alblue/shared-types';
import { useThemeStore } from '../stores/theme-store';

const { Text } = Typography;
const PAGE_SIZE = 15;

/**
 * Map BE notification types to FE i18n template paths. If the type has a
 * template AND the notification carries structured params, render via i18n
 * (so it follows the active locale). Otherwise we fall back to the
 * BE-provided title/message (legacy / unmapped types).
 */
const NOTIFICATION_TEMPLATE_KEY: Partial<Record<NotificationType, string>> = {
  [NotificationType.MaterialLowStock]: 'notifications.templates.materialLowStock',
};

function renderNotificationText(
  n: NotificationDto,
  t: (key: string, opts?: Record<string, unknown>) => string,
): { title: string; message: string } {
  const templatePath = NOTIFICATION_TEMPLATE_KEY[n.type];
  if (templatePath && n.paramsJson) {
    try {
      const params = JSON.parse(n.paramsJson) as Record<string, unknown>;
      return {
        title: t(`${templatePath}.title`, params),
        message: t(`${templatePath}.message`, params),
      };
    } catch {
      // Bad JSON — fall through to BE strings rather than crashing.
    }
  }
  return { title: n.title, message: n.message };
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return '<1m';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

interface SidebarFooterProps {
  collapsed: boolean;
}

export function SidebarFooter({ collapsed }: SidebarFooterProps) {
  const userId = useAuthStore((s) => s.user?.id);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { t, i18n } = useTranslation('dashboard');
  const queryClient = useQueryClient();
  const { token } = theme.useToken();
  const themeMode = useThemeStore((s) => s.mode);
  const setThemeMode = useThemeStore((s) => s.setMode);
  const navigate = useNavigate();
  const location = useLocation();
  const [notifOpen, setNotifOpen] = useState(false);
  const screens = Grid.useBreakpoint();
  const isMobile = screens.lg === false;
  const [profileOpen, setProfileOpen] = useState(false);
  const [page, setPage] = useState(1);

  // Info group rendered as a real antd Menu so the flyout (collapsed) and
  // inline-expansion (expanded) behaviour matches every other parent item
  // in SidebarMenu — Milos 08.06.2026 asked for the footer to use the same
  // UI as the upper part instead of the custom Popover+Tooltip it had.
  const infoMenuItems = [
    {
      key: 'info',
      icon: <InfoCircleOutlined />,
      label: t('nav.info'),
      children: [
        { key: '/tutorial', icon: <BookOutlined />, label: t('nav.tutorial') },
        { key: '/whats-new', icon: <HistoryOutlined />, label: t('nav.whatsNew') },
      ],
    },
  ];

  const { data: count } = useQuery({
    queryKey: ['notifications', 'unread-count', userId],
    queryFn: () => notificationsApi.getUnreadCount(userId!).then((r) => r.data),
    enabled: !!userId,
    // Was 120s — too slow to feel like an "alarm" for the low-stock
    // notification Saša asked for (Milos caught it during testing
    // 10.06.2026). 20s is the cheapest near-real-time without
    // wiring SignalR push on the BE side.
    refetchInterval: 20_000,
  });

  const { data: pagedResult, isLoading } = useQuery({
    queryKey: ['notifications', 'list', userId, page],
    queryFn: () => notificationsApi.getAll({ userId: userId!, page, pageSize: PAGE_SIZE }).then((r) => r.data),
    enabled: !!userId && notifOpen,
  });

  const notifications = pagedResult?.items ?? [];
  const hasMore = pagedResult ? page * PAGE_SIZE < pagedResult.totalCount : false;

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  }, [queryClient]);

  const markAsRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: invalidateAll,
  });
  const markAsUnread = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsUnread(id),
    onSuccess: invalidateAll,
  });
  const markAllAsRead = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(userId!),
    onSuccess: invalidateAll,
  });
  const deleteOne = useMutation({
    mutationFn: (id: string) => notificationsApi.delete(id),
    onSuccess: invalidateAll,
  });
  const deleteAll = useMutation({
    mutationFn: () => notificationsApi.deleteAll(userId!),
    onSuccess: () => {
      setPage(1);
      invalidateAll();
    },
  });

  const notificationsContent = (
    <div style={{ width: isMobile ? '100%' : 360 }}>
      <div style={{ marginBottom: 8 }}>
        <Text strong style={{ fontSize: 15 }}>{t('notifications.title')}</Text>
        <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
          {(count ?? 0) > 0 && (
            <Button
              type="link"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => markAllAsRead.mutate()}
              loading={markAllAsRead.isPending}
            >
              {t('notifications.markAllRead')}
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              type="link"
              size="small"
              danger
              icon={<ClearOutlined />}
              onClick={() => deleteAll.mutate()}
              loading={deleteAll.isPending}
            >
              {t('notifications.clearAll')}
            </Button>
          )}
        </div>
      </div>
      <List
        loading={isLoading}
        dataSource={notifications}
        locale={{ emptyText: <Empty description={t('notifications.noNotifications')} image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
        size="small"
        style={{ maxHeight: 400, overflowY: 'auto' }}
        loadMore={hasMore ? (
          <div style={{ textAlign: 'center', margin: '8px 0' }}>
            <Button size="small" onClick={() => setPage((p) => p + 1)}>
              {t('notifications.loadMore')}
            </Button>
          </div>
        ) : null}
        renderItem={(item: NotificationDto) => {
          const { title, message } = renderNotificationText(item, t);
          return (
          <List.Item
            style={{
              background: item.isRead ? undefined : token.colorPrimaryBg,
              padding: '8px 12px',
            }}
            actions={[
              item.isRead ? (
                <Tooltip key="unread" title={t('notifications.markUnread')}>
                  <Button
                    type="text"
                    size="small"
                    icon={<EyeInvisibleOutlined />}
                    onClick={() => markAsUnread.mutate(item.id)}
                  />
                </Tooltip>
              ) : (
                <Tooltip key="read" title={t('notifications.markAllRead')}>
                  <Button
                    type="text"
                    size="small"
                    icon={<CheckOutlined />}
                    onClick={() => markAsRead.mutate(item.id)}
                  />
                </Tooltip>
              ),
              <Tooltip key="delete" title={t('notifications.delete')}>
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => deleteOne.mutate(item.id)}
                />
              </Tooltip>,
            ]}
          >
            <List.Item.Meta
              title={<Text strong={!item.isRead} style={{ fontSize: 13 }}>{title}</Text>}
              description={
                <Space direction="vertical" size={0}>
                  <Text type="secondary" style={{ fontSize: 12 }}>{message}</Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {t('notifications.timeAgo', { time: formatTimeAgo(item.createdAt) })}
                  </Text>
                </Space>
              }
            />
          </List.Item>
          );
        }}
      />
    </div>
  );

  const profileContent = (
    <div style={{ width: 240 }}>
      <Space direction="vertical" size={0} style={{ width: '100%' }}>
        <Text strong>{user?.fullName}</Text>
        <Text type="secondary" style={{ fontSize: 12 }}>{user?.role}</Text>
      </Space>
      <Divider style={{ margin: '12px 0' }} />
      <Space direction="vertical" size={10} style={{ width: '100%' }}>
        <div>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
            {t('profile.theme', { defaultValue: 'Theme' })}
          </Text>
          <Segmented
            block
            value={themeMode}
            onChange={(v) => setThemeMode(v as 'light' | 'dark')}
            options={[
              { label: t('profile.themeLight', { defaultValue: 'Light' }), value: 'light', icon: <SunOutlined /> },
              { label: t('profile.themeDark', { defaultValue: 'Dark' }), value: 'dark', icon: <MoonOutlined /> },
            ]}
          />
        </div>
        <div>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
            <GlobalOutlined /> {t('profile.language', { defaultValue: 'Language' })}
          </Text>
          <Segmented
            block
            value={i18n.language === 'en' ? 'en' : 'sr'}
            onChange={(v) => i18n.changeLanguage(v as string)}
            options={[
              { label: t('language.sr'), value: 'sr' },
              { label: t('language.en'), value: 'en' },
            ]}
          />
        </div>
      </Space>
      <Divider style={{ margin: '12px 0' }} />
      <Button
        block
        danger
        icon={<LogoutOutlined />}
        onClick={() => { setProfileOpen(false); queryClient.clear(); logout(); }}
      >
        {t('common:actions.logout')}
      </Button>
    </div>
  );

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    height: 44,
    padding: collapsed ? '0' : '0 24px',
    justifyContent: collapsed ? 'center' : 'flex-start',
    color: 'rgba(255,255,255,0.85)',
    cursor: 'pointer',
    fontSize: 14,
    transition: 'background 0.2s',
  };

  return (
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 4, paddingBottom: 4 }}>
      {/* Info: same antd Menu component as SidebarMenu, so flyout (collapsed)
          and inline expansion (expanded) match the upper menu groups. Just
          this one group; Notifications + Profile below keep custom Popovers
          because their content (notif list with actions, theme/lang/logout)
          doesn't fit the antd submenu pattern. */}
      <Menu
        theme="dark"
        mode="inline"
        inlineCollapsed={collapsed}
        items={infoMenuItems}
        selectedKeys={[location.pathname]}
        onClick={({ key }) => {
          if (key.startsWith('/')) navigate(key);
        }}
        style={{ border: 'none', background: 'transparent' }}
      />
      {(() => {
        const bellRow = (
          <Tooltip title={collapsed ? t('nav.notifications', { defaultValue: 'Notifications' }) : ''} placement="right">
            <div
              style={rowStyle}
              onClick={isMobile ? () => { setNotifOpen(true); setPage(1); } : undefined}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <Badge count={count ?? 0} size="small" offset={[2, -2]}>
                <BellOutlined style={{ fontSize: 16, color: 'rgba(255,255,255,0.85)' }} />
              </Badge>
              {!collapsed && <span>{t('nav.notifications', { defaultValue: 'Notifications' })}</span>}
            </div>
          </Tooltip>
        );

        // Mobile: the sidebar lives inside a Drawer already, so a
        // right-placed Popover anchored to the bell would land off-screen
        // (the bell is at ~x=200px and the popover would extend further
        // right). Use a dedicated right-side Drawer for notifications
        // instead; it stacks above the menu Drawer cleanly.
        if (isMobile) {
          return (
            <>
              {bellRow}
              <Drawer
                title={t('notifications.title')}
                placement="right"
                open={notifOpen}
                onClose={() => setNotifOpen(false)}
                width={Math.min(360, window.innerWidth - 16)}
                styles={{ body: { padding: 16 } }}
              >
                {notificationsContent}
              </Drawer>
            </>
          );
        }

        return (
          <Popover
            content={notificationsContent}
            trigger="click"
            open={notifOpen}
            onOpenChange={(v) => { setNotifOpen(v); if (v) setPage(1); }}
            placement="rightBottom"
            arrow={false}
          >
            {bellRow}
          </Popover>
        );
      })()}
      <Popover
        content={profileContent}
        trigger="click"
        open={profileOpen}
        onOpenChange={setProfileOpen}
        placement="rightBottom"
        arrow={false}
      >
        <Tooltip title={collapsed ? user?.fullName ?? t('nav.profile', { defaultValue: 'Profile' }) : ''} placement="right">
          <div
            style={rowStyle}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <UserOutlined style={{ fontSize: 16 }} />
            {!collapsed && (
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.fullName ?? t('nav.profile', { defaultValue: 'Profile' })}
              </span>
            )}
          </div>
        </Tooltip>
      </Popover>
    </div>
  );
}
