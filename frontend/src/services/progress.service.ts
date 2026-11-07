import { apiClient } from './api';
import type { ProgressResponse } from '../types';

export const progressService = {
  async getMyProgress(): Promise<ProgressResponse> {
    const { data } = await apiClient.get<ProgressResponse>('/progress');
    return data;
  },

  async getLearnerProgress(learnerId: string): Promise<ProgressResponse> {
    const { data } = await apiClient.get<ProgressResponse>(`/progress/${learnerId}`);
    return data;
  },
};
