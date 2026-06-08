import { apiClient } from '../axios-instance';
import type { StanjeRowDto, StockMovementDto, PagedResult } from '@alblue/shared-types';
import type { StockMovementType } from '@alblue/shared-types';

export interface StockEntryLineRequest {
  materialId: string;
  quantity: number;
  unitPrice: number | null;
  notes: string | null;
}

export interface CreateStockEntryRequest {
  type: StockMovementType;
  documentReference: string;
  movementDate: string; // ISO
  notes: string | null;
  lines: StockEntryLineRequest[];
}

export interface GetIstorijaParams {
  type?: StockMovementType;
  materialId?: string;
  docRef?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export const magacinApi = {
  getStanje() {
    return apiClient.get<StanjeRowDto[]>('/magacin/stanje');
  },
  getIstorija(params: GetIstorijaParams = {}) {
    return apiClient.get<PagedResult<StockMovementDto>>('/magacin/istorija', { params });
  },
  createEntry(data: CreateStockEntryRequest) {
    return apiClient.post<StockMovementDto[]>('/magacin/entries', data);
  },
};
