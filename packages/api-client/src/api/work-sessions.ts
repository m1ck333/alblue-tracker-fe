import type { WorkSessionDto, PagedResult } from '@alblue/shared-types';
import type { CheckInRequest, CheckOutRequest } from '@alblue/shared-types';
import { apiClient } from '../axios-instance';

export const workSessionsApi = {
  getAll(date: string) {
    return apiClient.get<PagedResult<WorkSessionDto>>('/work-sessions', { params: { date } });
  },

  checkIn(data: CheckInRequest) {
    return apiClient.post<WorkSessionDto>('/work-sessions/check-in', data);
  },

  checkOut(data: CheckOutRequest) {
    return apiClient.post<WorkSessionDto>('/work-sessions/check-out', data);
  },
};
