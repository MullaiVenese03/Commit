import { apiClient } from './api';
import type { Goal } from '../types';

export interface CreateGoalPayload {
  title: string;
  description?: string;
}

export interface UpdateGoalPayload {
  title?: string;
  description?: string;
}

export const goalsService = {
  async getGoals(learnerId?: string): Promise<Goal[]> {
    const params = learnerId ? { learnerId } : undefined;
    const { data } = await apiClient.get<Goal[]>('/goals', { params });
    return data;
  },

  async getGoal(id: string): Promise<Goal> {
    const { data } = await apiClient.get<Goal>(`/goals/${id}`);
    return data;
  },

  async createGoal(payload: CreateGoalPayload): Promise<Goal> {
    const { data } = await apiClient.post<Goal>('/goals', payload);
    return data;
  },

  async updateGoal(id: string, payload: UpdateGoalPayload): Promise<Goal> {
    const { data } = await apiClient.patch<Goal>(`/goals/${id}`, payload);
    return data;
  },

  async deleteGoal(id: string): Promise<void> {
    await apiClient.delete(`/goals/${id}`);
  },
};
