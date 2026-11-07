import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateGoalPayload,
  UpdateGoalPayload,
} from '../services/goals.service';
import { goalsService } from '../services/goals.service';

export const goalKeys = {
  all: ['goals'] as const,
  lists: () => [...goalKeys.all, 'list'] as const,
  list: (learnerId?: string) => [...goalKeys.lists(), { learnerId }] as const,
  details: () => [...goalKeys.all, 'detail'] as const,
  detail: (id: string) => [...goalKeys.details(), id] as const,
};

export function useGoals(learnerId?: string) {
  return useQuery({
    queryKey: goalKeys.list(learnerId),
    queryFn: () => goalsService.getGoals(learnerId),
  });
}

export function useGoal(id: string) {
  return useQuery({
    queryKey: goalKeys.detail(id),
    queryFn: () => goalsService.getGoal(id),
    enabled: !!id,
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateGoalPayload) => goalsService.createGoal(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.all });
      queryClient.invalidateQueries({ queryKey: ['progress'] });
    },
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateGoalPayload }) =>
      goalsService.updateGoal(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: goalKeys.all });
      queryClient.invalidateQueries({ queryKey: goalKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ['progress'] });
    },
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => goalsService.deleteGoal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.all });
      queryClient.invalidateQueries({ queryKey: ['progress'] });
    },
  });
}
