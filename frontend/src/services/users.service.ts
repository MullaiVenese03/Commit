import { apiClient } from './api';
import type { User } from '../types';

export interface UpdateUserPayload {
  name?: string;
}

export const usersService = {
  async getMe(): Promise<User> {
    const { data } = await apiClient.get<User>('/users/me');
    return data;
  },

  async updateMe(payload: UpdateUserPayload): Promise<User> {
    const { data } = await apiClient.patch<User>('/users/me', payload);
    return data;
  },

  async getUser(id: string): Promise<User> {
    const { data } = await apiClient.get<User>(`/users/${id}`);
    return data;
  },
};
