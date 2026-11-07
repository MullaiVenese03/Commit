import { apiClient } from './api';
import type { Goal, LearnerSummary, StudySession } from '../types';

export const mentorService = {
  async getLearners(): Promise<LearnerSummary[]> {
    const { data } = await apiClient.get<LearnerSummary[]>('/mentor/learners');
    return data;
  },

  async getLearnerGoals(learnerId: string): Promise<Goal[]> {
    const { data } = await apiClient.get<Goal[]>(`/mentor/learners/${learnerId}/goals`);
    return data;
  },

  async getLearnerSessions(learnerId: string): Promise<StudySession[]> {
    const { data } = await apiClient.get<StudySession[]>(`/mentor/learners/${learnerId}/sessions`);
    return data;
  },
};
