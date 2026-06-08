import { useMemo, useState } from 'react';
import { Typography, Table, Tag, Space, Input, Select, Empty } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { warehouseApi } from '@alblue/api-client';
import { useAuthStore } from '@alblue/auth';
import type { StockBalanceRowDto } from '@alblue/shared-types';

const { Title } = Typography;

function statusTag(status: StockBalanceRowDto['status']) {
  switch (status) {
    case 'BelowMin': return <Tag color="red">⚠ ISPOD MIN</Tag>;
    case 'AboveMax': return <Tag color="orange">↑ IZNAD MAX</Tag>;
    default: return <Tag color="green">✓ OK</Tag>;
  }
}

/**
 * Magacin → Stanje. Read-only view of current inventory + status flags.
 * Rows sorted by status first (warnings on top — Saša Excel pattern).
 */
export function StockPage() {
  const tenantId = useAuthStore((s) => s.tenantId);
  const [search, setSearch] = useState('');
  const [category, setKategorija] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<StockBalanceRowDto['status'] | undefined>();

  const { data, isLoading } = useQuery({
    queryKey: ['magacin-stanje', tenantId],
    queryFn: () => warehouseApi.getStockBalances().then((r) => r.data),
    enabled: !!tenantId,
    refetchInterval: 30_000,
  });

  const filtered = useMemo(() => {
    let rows = data ?? [];
    if (category) rows = rows.filter((r) => r.category === category);
    if (statusFilter) rows = rows.filter((r) => r.status === statusFilter);
    if (search) {
      const s = search.toLowerCase();
      rows = rows.filter((r) => r.code.toLowerCase().includes(s) || r.name.toLowerCase().includes(s));
    }
    return rows;
  }, [data, search, category, statusFilter]);

  const kategorijaOptions = useMemo(() => {
    const set = new Set<string>();
    (data ?? []).forEach((r) => set.add(r.category));
    return Array.from(set).sort().map((k) => ({ label: k, value: k }));
  }, [data]);

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>Stanje magacina</Title>

      <Space wrap style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Pretraga"
          allowClear
          style={{ width: 240 }}
          onSearch={setSearch}
          onChange={(e) => !e.target.value && setSearch('')}
        />
        <Select
          allowClear
          placeholder="Sve kategorije"
          style={{ width: 200 }}
          options={kategorijaOptions}
          value={category}
          onChange={setKategorija}
        />
        <Select
          allowClear
          placeholder="Svi statusi"
          style={{ width: 180 }}
          options={[
            { label: '⚠ ISPOD MIN', value: 'BelowMin' },
            { label: '↑ IZNAD MAX', value: 'AboveMax' },
            { label: '✓ OK', value: 'Ok' },
          ]}
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as StockBalanceRowDto['status'] | undefined)}
        />
      </Space>

      <Table<StockBalanceRowDto>
        loading={isLoading}
        dataSource={filtered}
        rowKey="materialId"
        size="middle"
        scroll={{ x: 1100 }}
        pagination={{ pageSize: 50, showSizeChanger: true }}
        locale={{ emptyText: <Empty description="Nema materijala" /> }}
        columns={[
          { title: 'Status', dataIndex: 'status', width: 130, render: statusTag, fixed: 'left' },
          { title: 'Kod', dataIndex: 'code', width: 90, fixed: 'left' },
          { title: 'Naziv', dataIndex: 'name', width: 220, fixed: 'left' },
          { title: 'JM', dataIndex: 'unit', width: 60 },
          { title: 'Kategorija', dataIndex: 'category', width: 140 },
          {
            title: 'Količina',
            dataIndex: 'quantity',
            width: 100,
            align: 'right' as const,
            render: (v: number) => v.toLocaleString('sr-RS'),
          },
          { title: 'Min', dataIndex: 'minQuantity', width: 70, align: 'right' as const },
          { title: 'Max', dataIndex: 'maxQuantity', width: 70, align: 'right' as const },
          {
            title: 'Cena po JM',
            dataIndex: 'latestUnitPrice',
            width: 110,
            align: 'right' as const,
            render: (v: number) => v.toLocaleString('sr-RS', { minimumFractionDigits: 2 }),
          },
          {
            title: 'Ukupna totalValue',
            dataIndex: 'totalValue',
            width: 120,
            align: 'right' as const,
            render: (v: number) => v.toLocaleString('sr-RS', { minimumFractionDigits: 2 }),
          },
          { title: 'Pozicija', dataIndex: 'location', width: 100, render: (v: string | null) => v || '—' },
        ]}
      />
    </div>
  );
}
