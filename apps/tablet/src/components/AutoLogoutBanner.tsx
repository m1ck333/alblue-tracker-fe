import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '@alblue/i18n';
import { useAuthStore } from '@alblue/auth';
import { workSessionsApi } from '@alblue/api-client';

// Auto-logout countdown banner per Bojan spec 25.05.2026 (lazy approach
// 26.05.2026 — no SignalR). Polls /work-sessions/current at mount + every
// 5 min, then drives the visible countdown locally via setInterval. The
// banner appears once now() ≥ alarmAtUtc and stays until check-out OR
// until reports auto-close the session at logoutAtUtc.
//
// Worker action: tap "Odjavi se" to go to checkout. There's no server-
// pushed enforcement — the report-side cap is what actually limits the
// "claimed" working time. This is purely a reminder.

export function AutoLogoutBanner() {
  const { t } = useTranslation('tablet');
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [now, setNow] = useState(() => Date.now());

  // Tick once a minute so the visible "X min preostalo" updates without
  // hammering the server. The /current endpoint is cheap but we still
  // refetch only every 5 minutes (and on focus) — alarmAtUtc doesn't move
  // unless shift config or session changes.
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const { data } = useQuery({
    queryKey: ['active-work-session'],
    queryFn: async () => {
      const res = await workSessionsApi.getCurrent();
      if (res.status === 204 || !res.data) return null;
      return res.data;
    },
    enabled: isAuthenticated,
    refetchOnWindowFocus: true,
    refetchInterval: 5 * 60_000,
  });

  if (!data || !data.alarmAtUtc || !data.logoutAtUtc) return null;

  const alarmAt = new Date(data.alarmAtUtc).getTime();
  const logoutAt = new Date(data.logoutAtUtc).getTime();

  if (now < alarmAt) return null;

  const minutesLeft = Math.max(0, Math.ceil((logoutAt - now) / 60_000));
  const expired = now >= logoutAt;

  return (
    <div
      className={
        expired
          ? 'bg-red-600 text-white text-center py-2 px-4 text-tablet-sm font-semibold'
          : 'bg-orange-500 text-white text-center py-2 px-4 text-tablet-sm font-semibold'
      }
    >
      {expired ? t('autoLogout.expired') : t('autoLogout.warning', { minutes: minutesLeft })}
    </div>
  );
}
