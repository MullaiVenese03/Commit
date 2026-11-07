import { apiClient } from './api';
import type { Topic } from '../types';

export interface CreateTopicPayload {
  goalId: string;
  title: string;
  description?: string;
  position?: number;
  prerequisiteTopicIds?: string[];
}

export interface UpdateTopicPayload {
  title?: string;
  description?: string;
  position?: number;
  isCompleted?: boolean;
  prerequisiteTopicIds?: string[];
}

export const topicsService = {
  async getTopicsByGoal(goalId: string): Promise<Topic[]> {
    const { data } = await apiClient.get<Topic[]>(`/topics/goal/${goalId}`);
    return data;
  },

  async getTopic(id: string): Promise<Topic> {
    const { data } = await apiClient.get<Topic>(`/topics/${id}`);
    return data;
  },

  async createTopic(payload: CreateTopicPayload): Promise<Topic> {
    const { data } = await apiClient.post<Topic>('/topics', payload);
    return data;
  },

  async updateTopic(id: string, payload: UpdateTopicPayload): Promise<Topic> {
    const { data } = await apiClient.patch<Topic>(`/topics/${id}`, payload);
    return data;
  },

  async completeTopic(id: string): Promise<Topic> {
    const { data } = await apiClient.patch<Topic>(`/topics/${id}/complete`);
    return data;
  },

  async reopenTopic(id: string): Promise<Topic> {
    const { data } = await apiClient.patch<Topic>(`/topics/${id}/reopen`);
    return data;
  },

  async reorderTopics(goalId: string, topicIds: string[]): Promise<Topic[]> {
    const { data } = await apiClient.patch<Topic[]>(
      `/topics/goal/${goalId}/reorder`,
      { topicIds },
    );
    return data;
  },

  async deleteTopic(id: string): Promise<void> {
    await apiClient.delete(`/topics/${id}`);
  },
};
