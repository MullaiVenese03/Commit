import { useQuery } from '@tanstack/react-query';
import { progressService } from '../services/progress.service';

export const progressKeys = {
  all: ['progress'] as const,
  my: () => [...progressKeys.all, 'me'] as const,
  learner: (id: string) => [...progressKeys.all, 'learner', id] as const,
};

export function useMyProgress() {
  return useQuery({
    queryKey: progressKeys.my(),
    queryFn: () => progressService.getMyProgress(),
  });
}

export function useLearnerProgress(learnerId: string) {
  return useQuery({
    queryKey: progressKeys.learner(learnerId),
    queryFn: () => progressService.getLearnerProgress(learnerId),
    enabled: !!learnerId,
  });
}
