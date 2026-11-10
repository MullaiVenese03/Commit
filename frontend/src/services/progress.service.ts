import { apiClient } from './api';
import type {
  ActivityResponse,
  ProgressResponse,
  StreakMetrics,
  WeeklyTargetResponse,
} from '../types';

export interface GetActivityParams {
  startDate?: string;
  endDate?: string;
  today?: string;
  learnerId?: string;
}

export interface GetStreaksParams {
  today?: string;
  learnerId?: string;
}

export interface GetWeeklyTargetParams {
  today?: string;
  learnerId?: string;
}

export interface UpdateWeeklyTargetPayload {
  targetMinutes: number;
}

export const progressService = {
  async getMyProgress(today?: string): Promise<ProgressResponse> {
    const { data } = await apiClient.get<ProgressResponse>('/progress', {
      params: today ? { today } : undefined,
    });
    return data;
  },

  async getLearnerProgress(learnerId: string, today?: string): Promise<ProgressResponse> {
    const { data } = await apiClient.get<ProgressResponse>(`/progress/${learnerId}`, {
      params: today ? { today } : undefined,
    });
    return data;
  },

  async getActivity(params?: GetActivityParams): Promise<ActivityResponse> {
    const { data } = await apiClient.get<ActivityResponse>('/progress/activity', {
      params,
    });
    return data;
  },

  async getStreaks(params?: GetStreaksParams): Promise<StreakMetrics> {
    const { data } = await apiClient.get<StreakMetrics>('/progress/streaks', {
      params,
    });
    return data;
  },

  async getWeeklyTarget(params?: GetWeeklyTargetParams): Promise<WeeklyTargetResponse> {
    const { data } = await apiClient.get<WeeklyTargetResponse>('/progress/weekly-target', {
      params,
    });
    return data;
  },

  async updateWeeklyTarget(
    payload: UpdateWeeklyTargetPayload,
    today?: string,
  ): Promise<WeeklyTargetResponse> {
    const { data } = await apiClient.patch<WeeklyTargetResponse>(
      '/progress/weekly-target',
      payload,
      { params: today ? { today } : undefined },
    );
    return data;
  },
};
