import { apiClient } from './api';
import type { SystemSettings } from '../types';

export interface UpdateSettingsPayload {
  minSessionMinutes?: number;
  maxSessionMinutes?: number;
  maxPrerequisitesPerTopic?: number;
}

export const settingsService = {
  async getSettings(): Promise<SystemSettings> {
    const { data } = await apiClient.get<SystemSettings>('/settings');
    return data;
  },

  async updateSettings(payload: UpdateSettingsPayload): Promise<SystemSettings> {
    const { data } = await apiClient.patch<SystemSettings>('/settings', payload);
    return data;
  },
};
