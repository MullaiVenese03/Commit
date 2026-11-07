import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateTopicPayload,
  UpdateTopicPayload,
} from '../services/topics.service';
import { topicsService } from '../services/topics.service';
import { goalKeys } from './useGoals';

export const topicKeys = {
  all: ['topics'] as const,
  byGoal: (goalId: string) => [...topicKeys.all, 'goal', goalId] as const,
  detail: (id: string) => [...topicKeys.all, 'detail', id] as const,
};

export function useTopicsByGoal(goalId: string) {
  return useQuery({
    queryKey: topicKeys.byGoal(goalId),
    queryFn: () => topicsService.getTopicsByGoal(goalId),
    enabled: !!goalId,
  });
}

export function useTopic(id: string) {
  return useQuery({
    queryKey: topicKeys.detail(id),
    queryFn: () => topicsService.getTopic(id),
    enabled: !!id,
  });
}

export function useCreateTopic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTopicPayload) => topicsService.createTopic(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: topicKeys.byGoal(data.goalId) });
      queryClient.invalidateQueries({ queryKey: goalKeys.all });
      queryClient.invalidateQueries({ queryKey: ['progress'] });
    },
  });
}

export function useUpdateTopic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTopicPayload }) =>
      topicsService.updateTopic(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: topicKeys.byGoal(data.goalId) });
      queryClient.invalidateQueries({ queryKey: topicKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: goalKeys.all });
      queryClient.invalidateQueries({ queryKey: ['progress'] });
    },
  });
}

export function useCompleteTopic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => topicsService.completeTopic(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: topicKeys.byGoal(data.goalId) });
      queryClient.invalidateQueries({ queryKey: topicKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: goalKeys.all });
      queryClient.invalidateQueries({ queryKey: ['progress'] });
    },
  });
}

export function useReopenTopic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => topicsService.reopenTopic(id),
    onSuccess: (data) => {
      // Reopening recursively re-locks dependent topics, so invalidate all topics for this goal
      queryClient.invalidateQueries({ queryKey: topicKeys.byGoal(data.goalId) });
      queryClient.invalidateQueries({ queryKey: topicKeys.all });
      queryClient.invalidateQueries({ queryKey: goalKeys.all });
      queryClient.invalidateQueries({ queryKey: ['progress'] });
    },
  });
}

export function useReorderTopics() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ goalId, topicIds }: { goalId: string; topicIds: string[] }) =>
      topicsService.reorderTopics(goalId, topicIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: topicKeys.byGoal(variables.goalId) });
      queryClient.invalidateQueries({ queryKey: goalKeys.detail(variables.goalId) });
    },
  });
}

export function useDeleteTopic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, goalId }: { id: string; goalId: string }) =>
      topicsService.deleteTopic(id).then(() => ({ id, goalId })),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: topicKeys.byGoal(data.goalId) });
      queryClient.invalidateQueries({ queryKey: goalKeys.all });
      queryClient.invalidateQueries({ queryKey: ['progress'] });
    },
  });
}
