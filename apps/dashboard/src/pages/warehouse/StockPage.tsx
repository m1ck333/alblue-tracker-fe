import { useEffect, useMemo, useState } from 'react';
import { Typography, Table, Tag, Space, Input, Select, Empty } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { warehouseApi } from '@alblue/api-client';
import { useAuthStore } from '@alblue/auth';
import { useTranslation } from '@alblue/i18n';
import type { StockBalanceRowDto } from '@alblue/shared-types';
import { useTableHeight } from '../../hooks/useTableHeight';
import { TableExportButton } from '../../components/TableExportButton';
import type { ExportColumn } from '../../utils/exportTable';
import dayjs from 'dayjs';

const { Title } = Typography;

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function StockPage() {
  const tenantId = useAuthStore((s) => s.tenantId);
  const { t } = useTranslation('dashboard');
  const { ref: tableWrapperRef, height: tableBodyHeight } = useTableHeight();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [category, setCategory] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<StockBalanceRowDto['status'] | undefined>();

  const { data, isLoading } = useQuery({
    queryKey: ['warehouse-stock', tenantId],
    queryFn: () => warehouseApi.getStockBalances().then((r) => r.data),
    enabled: !!tenantId,
    refetchInterval: 30_000,
  });

  function statusTag(status: StockBalanceRowDto['status']) {
    switch (status) {
      case 'BelowMin': return <Tag color="red">{t('warehouse.statusBelowMin')}</Tag>;
      case 'AboveMax': return <Tag color="orange">{t('warehouse.statusAboveMax')}</Tag>;
      default: return <Tag color="green">{t('warehouse.statusOk')}</Tag>;
    }
  }

  const filtered = useMemo(() => {
    let rows = data ?? [];
    if (category) rows = rows.filter((r) => r.category === category);
    if (statusFilter) rows = rows.filter((r) => r.status === statusFilter);
    if (debouncedSearch) {
      const s = debouncedSearch.toLowerCase();
      rows = rows.filter((r) => r.code.toLowerCase().includes(s) || r.name.toLowerCase().includes(s));
    }
    return rows;
  }, [data, debouncedSearch, category, statusFilter]);

  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    (data ?? []).forEach((r) => set.add(r.category));
    return Array.from(set).sort().map((k) => ({ label: k, value: k }));
  }, [data]);

  const exportColumns: ExportColumn<StockBalanceRowDto>[] = [
    { header: t('materials.status'), value: (r) => r.status === 'BelowMin' ? t('warehouse.statusBelowMin') : r.status === 'AboveMax' ? t('warehouse.statusAboveMax') : t('warehouse.statusOk'), width: 14 },
    { header: t('warehouse.code'), value: (r) => r.code, width: 12 },
    { header: t('warehouse.name'), value: (r) => r.name, width: 24 },
    { header: t('warehouse.unit'), value: (r) => r.unit, width: 8 },
    { header: t('warehouse.category'), value: (r) => r.category, width: 18 },
    { header: t('warehouse.quantity'), value: (r) => r.quantity, align: 'right', width: 12 },
    { header: t('warehouse.min'), value: (r) => r.minQuantity, align: 'right', width: 8 },
    { header: t('warehouse.max'), value: (r) => r.maxQuantity, align: 'right', width: 8 },
    { header: t('warehouse.unitPrice'), value: (r) => r.latestUnitPrice, align: 'right', width: 14 },
    { header: t('warehouse.totalValue'), value: (r) => r.totalValue, align: 'right', width: 14 },
    { header: t('warehouse.location'), value: (r) => r.location ?? '', width: 14 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>{t('warehouse.stockTitle')}</Title>
        <Space>
          <TableExportButton
            onFetchAll={async () => filtered}
            columns={exportColumns}
            options={{
              fileName: `warehouse-stock-${dayjs().format('YYYY-MM-DD')}`,
              title: t('warehouse.stockTitle'),
              sheetName: t('warehouse.stockTitle'),
            }}
          />
        </Space>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <Input.Search
          placeholder={t('warehouse.searchPlaceholder')}
          allowClear
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 260 }}
        />
        <Select
          allowClear
          placeholder={t('warehouse.allCategories')}
          style={{ width: 200 }}
          options={categoryOptions}
          value={category}
          onChange={setCategory}
        />
        <Select
          allowClear
          placeholder={t('warehouse.allStatuses')}
          style={{ width: 200 }}
          options={[
            { label: t('warehouse.statusBelowMin'), value: 'BelowMin' },
            { label: t('warehouse.statusAboveMax'), value: 'AboveMax' },
            { label: t('warehouse.statusOk'), value: 'Ok' },
          ]}
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as StockBalanceRowDto['status'] | undefined)}
        />
      </div>

      <div ref={tableWrapperRef} style={{ flex: 1, minHeight: 0 }}>
        <Table<StockBalanceRowDto>
          loading={isLoading}
          dataSource={filtered}
          rowKey="materialId"
          size="middle"
          scroll={{ x: 'max-content', y: tableBodyHeight }}
          pagination={{ pageSize: 50, showSizeChanger: true }}
          locale={{ emptyText: <Empty description={t('warehouse.stockEmpty')} image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
          columns={[
            { title: t('warehouse.code'), dataIndex: 'code', width: 110, fixed: 'left' },
            { title: t('warehouse.name'), dataIndex: 'name', width: 240, fixed: 'left' },
            { title: t('materials.status'), dataIndex: 'status', width: 140, align: 'center' as const, render: statusTag },
            { title: t('warehouse.unit'), dataIndex: 'unit', width: 70, align: 'center' as const },
            { title: t('warehouse.category'), dataIndex: 'category', width: 160 },
            {
              title: t('warehouse.quantity'),
              dataIndex: 'quantity',
              width: 110,
              align: 'right' as const,
              render: (v: number) => v.toLocaleString('sr-RS'),
            },
            { title: t('warehouse.min'), dataIndex: 'minQuantity', width: 80, align: 'right' as const },
            { title: t('warehouse.max'), dataIndex: 'maxQuantity', width: 80, align: 'right' as const },
            {
              title: t('warehouse.unitPrice'),
              dataIndex: 'latestUnitPrice',
              width: 120,
              align: 'right' as const,
              render: (v: number) => v.toLocaleString('sr-RS', { minimumFractionDigits: 2 }),
            },
            {
              title: t('warehouse.totalValue'),
              dataIndex: 'totalValue',
              width: 130,
              align: 'right' as const,
              render: (v: number) => v.toLocaleString('sr-RS', { minimumFractionDigits: 2 }),
            },
            { title: t('warehouse.location'), dataIndex: 'location', width: 120, render: (v: string | null) => v || '—' },
          ]}
        />
      </div>
    </div>
  );
}
