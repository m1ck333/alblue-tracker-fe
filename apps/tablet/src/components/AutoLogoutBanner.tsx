import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '@alblue/i18n';
import { useAuthStore } from '@alblue/auth';
import { workSessionsApi } from '@alblue/api-client';

// Auto-logout countdown banner per Bojan spec 25.05.2026 (lazy approach
// 26.05.2026) + actual enforcement 30.05.2026. Polls /work-sessions/current
// at mount + every 5 min, drives the visible countdown locally via
// setInterval. Behaviour:
//   • now ≥ alarmAtUtc → orange banner with minutes remaining.
//   • now ≥ logoutAtUtc → fire POST /work-sessions/auto-checkout once,
//     then show a full-screen overlay forcing the worker to re-login
//     (mandatory for overtime per Bojan's "obavezna prijava na tabletu").
// The server-side lazy safety net catches forgotten cases the moment any
// other call hits /current, so the only way to stay "checked in" past
// the cap is to actually be on the tablet AND have it offline.

export function AutoLogoutBanner() {
  const { t } = useTranslation('tablet');
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [now, setNow] = useState(() => Date.now());
  const [autoLoggedOut, setAutoLoggedOut] = useState(false);
  const firedRef = useRef(false);

  // Tick once a minute so the visible "X min preostalo" updates without
  // hammering the server. /current is cheap but we refetch only every
  // 5 minutes (and on focus) — alarmAtUtc doesn't move unless shift
  // config or session changes.
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
    enabled: isAuthenticated && !autoLoggedOut,
    refetchOnWindowFocus: true,
    refetchInterval: 5 * 60_000,
  });

  const autoCheckOut = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      await workSessionsApi.autoCheckOut({ userId: user.id });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['active-work-session'] });
    },
  });

  const alarmAt = data?.alarmAtUtc ? new Date(data.alarmAtUtc).getTime() : null;
  const logoutAt = data?.logoutAtUtc ? new Date(data.logoutAtUtc).getTime() : null;
  const expired = logoutAt !== null && now >= logoutAt;

  // Fire auto-checkout exactly once when the cap is hit.
  useEffect(() => {
    if (expired && !firedRef.current && user?.id) {
      firedRef.current = true;
      autoCheckOut.mutate(undefined, {
        onSettled: () => setAutoLoggedOut(true),
      });
    }
    // We intentionally exclude `autoCheckOut` from deps — mutating once is the
    // whole point. firedRef guards re-entry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expired, user?.id]);

  // Full-screen blocker after auto-logout — worker must tap to re-login.
  if (autoLoggedOut) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 p-8 text-center">
        <div className="max-w-xl rounded-2xl bg-white p-8 shadow-2xl">
          <h2 className="mb-4 text-tablet-xl font-bold text-red-600">
            {t('autoLogout.loggedOutTitle')}
          </h2>
          <p className="mb-8 text-tablet-base text-gray-800">
            {t('autoLogout.loggedOutBody')}
          </p>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/login', { replace: true });
            }}
            className="w-full rounded-xl bg-blue-600 py-4 text-tablet-lg font-semibold text-white active:bg-blue-700"
          >
            {t('autoLogout.loginAgain')}
          </button>
        </div>
      </div>
    );
  }

  if (!data || alarmAt === null || logoutAt === null) return null;
  if (now < alarmAt) return null;

  const minutesLeft = Math.max(0, Math.ceil((logoutAt - now) / 60_000));

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
