import type {
  WorkSessionDto,
  ActiveWorkSessionDto,
  PagedResult,
  CheckInRequest,
  CheckOutRequest,
} from '@alblue/shared-types';
import { apiClient } from '../axios-instance';

export const workSessionsApi = {
  getAll(date: string) {
    return apiClient.get<PagedResult<WorkSessionDto>>('/work-sessions', { params: { date } });
  },

  /** Calling worker's open session + auto-logout alarm timestamps. 204 → null. */
  getCurrent() {
    return apiClient.get<ActiveWorkSessionDto | ''>('/work-sessions/current', {
      validateStatus: (s) => s === 200 || s === 204,
    });
  },

  checkIn(data: CheckInRequest) {
    return apiClient.post<WorkSessionDto>('/work-sessions/check-in', data);
  },

  checkOut(data: CheckOutRequest) {
    return apiClient.post<WorkSessionDto>('/work-sessions/check-out', data);
  },
};
