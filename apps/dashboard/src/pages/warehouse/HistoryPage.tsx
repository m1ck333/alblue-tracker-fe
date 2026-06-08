import { useState } from 'react';
import { Typography, Table, Tag, Space, DatePicker, Select, Input } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { warehouseApi, materialsApi } from '@alblue/api-client';
import { useAuthStore } from '@alblue/auth';
import { StockMovementType } from '@alblue/shared-types';
import type { StockMovementDto } from '@alblue/shared-types';
import dayjs from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;

/**
 * Magacin → Istorija transakcija. Paginated log of all Ulaz/Izlaz with
 * type/date/material/doc-ref filters.
 */
export function HistoryPage() {
  const tenantId = useAuthStore((s) => s.tenantId);
  const [type, setType] = useState<StockMovementType | undefined>();
  const [materialId, setMaterialId] = useState<string | undefined>();
  const [docRef, setDocRef] = useState('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const { data: materials } = useQuery({
    queryKey: ['materials-for-istorija', tenantId],
    queryFn: () => materialsApi.getAll({ pageSize: 500 }).then((r) => r.data.items),
    enabled: !!tenantId,
  });

  const { data, isLoading } = useQuery({
    queryKey: [
      'magacin-istorija', tenantId, type, materialId, docRef,
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
    <div style={{ padding: 24 }}>
      <Title level={3}>Istorija transakcija</Title>

      <Space wrap style={{ marginBottom: 16 }}>
        <Select
          allowClear
          placeholder="Tip"
          style={{ width: 120 }}
          options={[
            { label: 'Inflow', value: StockMovementType.Inflow },
            { label: 'Outflow', value: StockMovementType.Outflow },
          ]}
          value={type}
          onChange={(v) => { setType(v); setPage(1); }}
        />
        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder="Svi materijali"
          style={{ width: 260 }}
          options={(materials ?? []).map((m) => ({ label: `${m.code} — ${m.name}`, value: m.id }))}
          value={materialId}
          onChange={(v) => { setMaterialId(v); setPage(1); }}
        />
        <Input
          allowClear
          placeholder="Broj prijemnice / narudžbenice"
          style={{ width: 240 }}
          value={docRef}
          onChange={(e) => setDocRef(e.target.value)}
        />
        <RangePicker
          format="DD.MM.YYYY"
          value={dateRange}
          onChange={(v) => { setDateRange((v ?? [null, null]) as [dayjs.Dayjs | null, dayjs.Dayjs | null]); setPage(1); }}
        />
      </Space>

      <Table<StockMovementDto>
        loading={isLoading}
        dataSource={data?.items}
        rowKey="id"
        size="middle"
        scroll={{ x: 1300 }}
        pagination={{
          current: page,
          pageSize,
          total: data?.totalCount,
          showSizeChanger: true,
          onChange: (p, ps) => { setPage(p); setPageSize(ps); },
        }}
        columns={[
          {
            title: 'Datum',
            dataIndex: 'movementDate',
            width: 130,
            render: (v: string) => dayjs(v).format('DD.MM.YYYY HH:mm'),
          },
          {
            title: 'Tip',
            dataIndex: 'type',
            width: 90,
            render: (v: 'Inflow' | 'Outflow') =>
              v === 'Inflow' ? <Tag color="green">Ulaz</Tag> : <Tag color="orange">Izlaz</Tag>,
          },
          { title: 'Kod', dataIndex: 'materialCode', width: 90 },
          { title: 'Naziv', dataIndex: 'materialName', width: 240 },
          { title: 'JM', dataIndex: 'unit', width: 60 },
          {
            title: 'Količina',
            width: 100,
            align: 'right' as const,
            render: (_, r) => {
              const sign = r.type === 'Outflow' ? '-' : '+';
              return `${sign}${r.quantity.toLocaleString('sr-RS')}`;
            },
          },
          { title: 'Kategorija', dataIndex: 'category', width: 140 },
          { title: 'Prijemnica / Narudžbenica', dataIndex: 'documentReference', width: 200 },
          {
            title: 'Cena po JM',
            dataIndex: 'unitPrice',
            width: 110,
            align: 'right' as const,
            render: (v: number) => v.toLocaleString('sr-RS', { minimumFractionDigits: 2 }),
          },
          {
            title: 'Ukupno',
            dataIndex: 'totalPrice',
            width: 120,
            align: 'right' as const,
            render: (v: number) => v.toLocaleString('sr-RS', { minimumFractionDigits: 2 }),
          },
          {
            title: 'Napomena',
            dataIndex: 'notes',
            render: (v: string | null) => v || '—',
          },
        ]}
      />
    </div>
  );
}
