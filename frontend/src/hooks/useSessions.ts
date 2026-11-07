import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateSessionPayload,
  FilterSessionsParams,
  UpdateSessionPayload,
} from '../services/sessions.service';
import { sessionsService } from '../services/sessions.service';

export const sessionKeys = {
  all: ['sessions'] as const,
  lists: () => [...sessionKeys.all, 'list'] as const,
  list: (filters?: FilterSessionsParams) => [...sessionKeys.lists(), { filters }] as const,
  detail: (id: string) => [...sessionKeys.all, 'detail', id] as const,
};

export function useSessions(filters?: FilterSessionsParams) {
  return useQuery({
    queryKey: sessionKeys.list(filters),
    queryFn: () => sessionsService.getSessions(filters),
  });
}

export function useSession(id: string) {
  return useQuery({
    queryKey: sessionKeys.detail(id),
    queryFn: () => sessionsService.getSession(id),
    enabled: !!id,
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSessionPayload) => sessionsService.createSession(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.all });
      queryClient.invalidateQueries({ queryKey: ['progress'] });
      queryClient.invalidateQueries({ queryKey: ['topics'] });
    },
  });
}

export function useUpdateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateSessionPayload }) =>
      sessionsService.updateSession(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.all });
      queryClient.invalidateQueries({ queryKey: sessionKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ['progress'] });
    },
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sessionsService.deleteSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.all });
      queryClient.invalidateQueries({ queryKey: ['progress'] });
    },
  });
}
