import { SubProcessStatus } from '@alblue/shared-types';
import type { ProcessGroupDto, TabletActiveWorkDto } from '@alblue/shared-types';

export type SubTransition = 'start' | 'complete';
export type ActiveGroups = ProcessGroupDto<TabletActiveWorkDto>[];

/**
 * Returns a copy of the tablet-active groups with one sub-process moved to its
 * post-action state, for optimistic rendering while a queued (offline) or
 * in-flight action settles. Pure — no cache/DOM side effects.
 *
 * Scope is deliberately contained to the active view's sub-process the worker
 * tapped (plus the process-level timer so the elapsed counter starts/stops).
 * Cross-list moves (an item leaving the queue/active list) are NOT done
 * optimistically — the refetch on reconnect reconciles those with server truth.
 */
export function applySubProcessTransition(
  groups: ActiveGroups | undefined,
  subProcessId: string,
  transition: SubTransition,
  nowIso: string,
): ActiveGroups | undefined {
  if (!groups) return groups;
  return groups.map((group) => ({
    ...group,
    items: group.items.map((item) => {
      if (!item.subProcesses.some((sp) => sp.id === subProcessId)) return item;

      const subProcesses = item.subProcesses.map((sp) => {
        if (sp.id !== subProcessId) return sp;
        return transition === 'start'
          ? { ...sp, status: SubProcessStatus.InProgress, isTimerRunning: true, currentLogStartedAt: nowIso }
          : { ...sp, status: SubProcessStatus.Completed, isTimerRunning: false };
      });

      return {
        ...item,
        subProcesses,
        // Mirror the process-level timer so the elapsed counter reflects the tap.
        isTimerRunning: transition === 'start',
        currentLogStartedAt: transition === 'start' ? nowIso : item.currentLogStartedAt,
      };
    }),
  }));
}
