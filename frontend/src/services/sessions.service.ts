import { apiClient } from './api';
import type { StudySession } from '../types';

export interface FilterSessionsParams {
  goalId?: string;
  topicId?: string;
  learnerId?: string;
  startDate?: string;
  endDate?: string;
}

export interface CreateSessionPayload {
  topicId: string;
  studyDate: string;
  minutes: number;
  note?: string;
}

export interface UpdateSessionPayload {
  studyDate?: string;
  minutes?: number;
  note?: string;
}

export const sessionsService = {
  async getSessions(params?: FilterSessionsParams): Promise<StudySession[]> {
    const { data } = await apiClient.get<StudySession[]>('/sessions', { params });
    return data;
  },

  async getSession(id: string): Promise<StudySession> {
    const { data } = await apiClient.get<StudySession>(`/sessions/${id}`);
    return data;
  },

  async createSession(payload: CreateSessionPayload): Promise<StudySession> {
    const { data } = await apiClient.post<StudySession>('/sessions', payload);
    return data;
  },

  async updateSession(id: string, payload: UpdateSessionPayload): Promise<StudySession> {
    const { data } = await apiClient.patch<StudySession>(`/sessions/${id}`, payload);
    return data;
  },

  async deleteSession(id: string): Promise<void> {
    await apiClient.delete(`/sessions/${id}`);
  },
};
