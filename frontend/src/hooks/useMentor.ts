import { useQuery } from '@tanstack/react-query';
import { mentorService } from '../services/mentor.service';

export const mentorKeys = {
  all: ['mentor'] as const,
  learners: () => [...mentorKeys.all, 'learners'] as const,
  learnerGoals: (id: string) => [...mentorKeys.all, 'learner', id, 'goals'] as const,
  learnerSessions: (id: string) => [...mentorKeys.all, 'learner', id, 'sessions'] as const,
};

export function useLearners() {
  return useQuery({
    queryKey: mentorKeys.learners(),
    queryFn: () => mentorService.getLearners(),
  });
}

export function useLearnerGoals(learnerId: string) {
  return useQuery({
    queryKey: mentorKeys.learnerGoals(learnerId),
    queryFn: () => mentorService.getLearnerGoals(learnerId),
    enabled: !!learnerId,
  });
}

export function useLearnerSessions(learnerId: string) {
  return useQuery({
    queryKey: mentorKeys.learnerSessions(learnerId),
    queryFn: () => mentorService.getLearnerSessions(learnerId),
    enabled: !!learnerId,
  });
}
