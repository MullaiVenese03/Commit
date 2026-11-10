import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  GetActivityParams,
  GetStreaksParams,
  GetWeeklyTargetParams,
  UpdateWeeklyTargetPayload,
} from '../services/progress.service';
import { progressService } from '../services/progress.service';
import { getLocalTodayDate } from '../utils/formatters';

export const progressKeys = {
  all: ['progress'] as const,
  my: (today?: string) => [...progressKeys.all, 'me', { today }] as const,
  learner: (id: string, today?: string) => [...progressKeys.all, 'learner', id, { today }] as const,
  streaks: (params?: GetStreaksParams) => [...progressKeys.all, 'streaks', params] as const,
  activity: (params?: GetActivityParams) => [...progressKeys.all, 'activity', params] as const,
  weeklyTarget: (params?: GetWeeklyTargetParams) =>
    [...progressKeys.all, 'weekly-target', params] as const,
};

/**
 * Lightweight hook that tracks the browser-local reference date,
 * automatically updating at local midnight and on tab visibility/focus changes,
 * invalidating all progress queries when midnight rollover occurs.
 */
export function useTodayReferenceDate(): string {
  const [today, setToday] = useState<string>(() => getLocalTodayDate());
  const lastDateRef = useRef<string>(today);
  const queryClient = useQueryClient();

  useEffect(() => {
    let timerId: ReturnType<typeof setTimeout> | undefined;

    const scheduleNextMidnight = () => {
      if (timerId !== undefined) {
        clearTimeout(timerId);
      }
      const now = new Date();
      // Calculate local midnight (tomorrow 00:00:00.050)
      const tomorrowMidnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0,
        0,
        0,
        50,
      );
      const msUntilMidnight = Math.max(1000, tomorrowMidnight.getTime() - now.getTime());

      timerId = setTimeout(() => {
        checkAndAdvanceDate();
        scheduleNextMidnight();
      }, msUntilMidnight);
    };

    const checkAndAdvanceDate = () => {
      const currentLocalToday = getLocalTodayDate();
      if (currentLocalToday !== lastDateRef.current) {
        lastDateRef.current = currentLocalToday;
        setToday(currentLocalToday);
        queryClient.invalidateQueries({ queryKey: progressKeys.all });
        scheduleNextMidnight();
      }
    };

    scheduleNextMidnight();

    const handleWakeup = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        checkAndAdvanceDate();
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleWakeup);
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleWakeup);
    }

    return () => {
      if (timerId !== undefined) {
        clearTimeout(timerId);
      }
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleWakeup);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleWakeup);
      }
    };
  }, [queryClient]);

  return today;
}

export function useMyProgress(overrideToday?: string) {
  const reactiveToday = useTodayReferenceDate();
  const today = overrideToday || reactiveToday;
  return useQuery({
    queryKey: progressKeys.my(today),
    queryFn: () => progressService.getMyProgress(today),
  });
}

export function useLearnerProgress(learnerId: string, overrideToday?: string) {
  const reactiveToday = useTodayReferenceDate();
  const today = overrideToday || reactiveToday;
  return useQuery({
    queryKey: progressKeys.learner(learnerId, today),
    queryFn: () => progressService.getLearnerProgress(learnerId, today),
    enabled: !!learnerId,
  });
}

export function useMyStreaks(overrideToday?: string) {
  const reactiveToday = useTodayReferenceDate();
  const today = overrideToday || reactiveToday;
  return useQuery({
    queryKey: progressKeys.streaks({ today }),
    queryFn: () => progressService.getStreaks({ today }),
  });
}

export function useLearnerStreaks(learnerId: string, overrideToday?: string) {
  const reactiveToday = useTodayReferenceDate();
  const today = overrideToday || reactiveToday;
  return useQuery({
    queryKey: progressKeys.streaks({ learnerId, today }),
    queryFn: () => progressService.getStreaks({ learnerId, today }),
    enabled: !!learnerId,
  });
}

export function useMyActivity(params?: Omit<GetActivityParams, 'learnerId'>) {
  const reactiveToday = useTodayReferenceDate();
  const queryParams: GetActivityParams = {
    today: params?.today || reactiveToday,
    ...params,
  };
  return useQuery({
    queryKey: progressKeys.activity(queryParams),
    queryFn: () => progressService.getActivity(queryParams),
  });
}

export function useLearnerActivity(
  learnerId: string,
  params?: Omit<GetActivityParams, 'learnerId'>,
) {
  const reactiveToday = useTodayReferenceDate();
  const queryParams: GetActivityParams = {
    learnerId,
    today: params?.today || reactiveToday,
    ...params,
  };
  return useQuery({
    queryKey: progressKeys.activity(queryParams),
    queryFn: () => progressService.getActivity(queryParams),
    enabled: !!learnerId,
  });
}

export function useWeeklyTarget(
  params?: GetWeeklyTargetParams,
  options?: { enabled?: boolean },
) {
  const reactiveToday = useTodayReferenceDate();
  const queryParams: GetWeeklyTargetParams = {
    today: params?.today || reactiveToday,
    ...params,
  };
  return useQuery({
    queryKey: progressKeys.weeklyTarget(queryParams),
    queryFn: () => progressService.getWeeklyTarget(queryParams),
    enabled: options?.enabled ?? (params?.learnerId !== undefined ? !!params.learnerId : true),
  });
}

export function useLearnerWeeklyTarget(learnerId: string, overrideToday?: string) {
  const reactiveToday = useTodayReferenceDate();
  const today = overrideToday || reactiveToday;
  return useQuery({
    queryKey: progressKeys.weeklyTarget({ learnerId, today }),
    queryFn: () => progressService.getWeeklyTarget({ learnerId, today }),
    enabled: !!learnerId,
  });
}

export function useUpdateWeeklyTarget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      payload,
      today = getLocalTodayDate(),
    }: {
      payload: UpdateWeeklyTargetPayload;
      today?: string;
    }) => progressService.updateWeeklyTarget(payload, today),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: progressKeys.all });
    },
  });
}
