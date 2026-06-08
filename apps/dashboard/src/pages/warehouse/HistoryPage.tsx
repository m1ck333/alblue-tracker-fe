import { useState } from 'react';
import { Typography, Table, Tag, Space, DatePicker, Select, Input, Empty } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { warehouseApi, materialsApi } from '@alblue/api-client';
import { useAuthStore } from '@alblue/auth';
import { useTranslation } from '@alblue/i18n';
import { StockMovementType } from '@alblue/shared-types';
import type { StockMovementDto } from '@alblue/shared-types';
import { useTableHeight } from '../../hooks/useTableHeight';
import dayjs from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;

export function HistoryPage() {
  const tenantId = useAuthStore((s) => s.tenantId);
  const { t } = useTranslation('dashboard');
  const { ref: tableWrapperRef, height: tableBodyHeight } = useTableHeight();

  const [type, setType] = useState<StockMovementType | undefined>();
  const [materialId, setMaterialId] = useState<string | undefined>();
  const [docRef, setDocRef] = useState('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const { data: materials } = useQuery({
    queryKey: ['materials-for-history', tenantId],
    queryFn: () => materialsApi.getAll({ pageSize: 500 }).then((r) => r.data.items),
    enabled: !!tenantId,
  });

  const { data, isLoading } = useQuery({
    queryKey: [
      'warehouse-history', tenantId, type, materialId, docRef,
      dateRange[0]?.format('YYYY-MM-DD'), dateRange[1]?.format('YYYY-MM-DD'),
      page, pageSize,
    ],
    queryFn: () =>
      warehouseApi
        .getStockHistory({
          type,
          materialId,
          docRef: docRef || undefined,
          from: dateRange[0]?.format('YYYY-MM-DD'),
          to: dateRange[1]?.format('YYYY-MM-DD'),
          page,
          pageSize,
        })
        .then((r) => r.data),
    enabled: !!tenantId,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>{t('warehouse.historyTitle')}</Title>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <Select
          allowClear
          placeholder={t('warehouse.type')}
          style={{ width: 140 }}
          options={[
            { label: t('warehouse.inflowLabel'), value: StockMovementType.Inflow },
            { label: t('warehouse.outflowLabel'), value: StockMovementType.Outflow },
          ]}
          value={type}
          onChange={(v) => { setType(v); setPage(1); }}
        />
        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder={t('warehouse.allMaterials')}
          style={{ width: 260 }}
          options={(materials ?? []).map((m) => ({ label: `${m.code} — ${m.name}`, value: m.id }))}
          value={materialId}
          onChange={(v) => { setMaterialId(v); setPage(1); }}
        />
        <Input
          allowClear
          placeholder={t('warehouse.documentReferenceSearch')}
          style={{ width: 260 }}
          value={docRef}
          onChange={(e) => setDocRef(e.target.value)}
        />
        <RangePicker
          format="DD.MM.YYYY"
          value={dateRange}
          onChange={(v) => { setDateRange((v ?? [null, null]) as [dayjs.Dayjs | null, dayjs.Dayjs | null]); setPage(1); }}
        />
      </div>

      <div ref={tableWrapperRef} style={{ flex: 1, minHeight: 0 }}>
        <Table<StockMovementDto>
          loading={isLoading}
          dataSource={data?.items}
          rowKey="id"
          size="middle"
          scroll={{ x: 'max-content', y: tableBodyHeight }}
          pagination={{
            current: page,
            pageSize,
            total: data?.totalCount,
            showSizeChanger: true,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
          }}
          locale={{ emptyText: <Empty description={t('warehouse.historyEmpty')} image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
          columns={[
            {
              title: t('warehouse.movementDate'),
              dataIndex: 'movementDate',
              width: 140,
              fixed: 'left' as const,
              render: (v: string) => dayjs(v).format('DD.MM.YYYY HH:mm'),
            },
            {
              title: t('warehouse.type'),
              dataIndex: 'type',
              width: 100,
              fixed: 'left' as const,
              render: (v: 'Inflow' | 'Outflow') =>
                v === 'Inflow' ? <Tag color="green">{t('warehouse.inflowLabel')}</Tag> : <Tag color="orange">{t('warehouse.outflowLabel')}</Tag>,
            },
            { title: t('warehouse.code'), dataIndex: 'materialCode', width: 100, fixed: 'left' as const },
            { title: t('warehouse.name'), dataIndex: 'materialName', width: 240, fixed: 'left' as const },
            { title: t('warehouse.unit'), dataIndex: 'unit', width: 60 },
            {
              title: t('warehouse.quantity'),
              width: 110,
              align: 'right' as const,
              render: (_, r) => {
                const sign = r.type === 'Outflow' ? '-' : '+';
                return `${sign}${r.quantity.toLocaleString('sr-RS')}`;
              },
            },
            { title: t('warehouse.category'), dataIndex: 'category', width: 140 },
            { title: t('warehouse.documentReference'), dataIndex: 'documentReference', width: 200 },
            {
              title: t('warehouse.unitPrice'),
              dataIndex: 'unitPrice',
              width: 120,
              align: 'right' as const,
              render: (v: number) => v.toLocaleString('sr-RS', { minimumFractionDigits: 2 }),
            },
            {
              title: t('warehouse.total'),
              dataIndex: 'totalPrice',
              width: 130,
              align: 'right' as const,
              render: (v: number) => v.toLocaleString('sr-RS', { minimumFractionDigits: 2 }),
            },
            {
              title: t('warehouse.notes'),
              dataIndex: 'notes',
              render: (v: string | null) => v || '—',
            },
          ]}
        />
      </div>
    </div>
  );
}
