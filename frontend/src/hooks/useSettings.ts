import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UpdateSettingsPayload } from '../services/settings.service';
import { settingsService } from '../services/settings.service';

export const settingsKeys = {
  all: ['settings'] as const,
  global: () => [...settingsKeys.all, 'global'] as const,
};

export function useSettings() {
  return useQuery({
    queryKey: settingsKeys.global(),
    queryFn: () => settingsService.getSettings(),
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateSettingsPayload) =>
      settingsService.updateSettings(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
    },
  });
}
