import { useState, useEffect, useMemo } from 'react';
import {
  Typography, Table, Button, Drawer, Form, Input, InputNumber, Select, Tag, Space, App, Popconfirm, Empty,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { materialsApi } from '@alblue/api-client';
import type { CreateMaterialRequest } from '@alblue/api-client';
import { useAuthStore } from '@alblue/auth';
import { useTranslation } from '@alblue/i18n';
import type { MaterialDto } from '@alblue/shared-types';
import { useTableHeight } from '../../hooks/useTableHeight';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';
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

function getErrorMessage(err: unknown, fallback: string): string {
  const resp = (err as { response?: { data?: { error?: { code?: string; message?: string } } } })
    ?.response?.data?.error;
  return resp?.message || fallback;
}

export function MaterialsPage() {
  const tenantId = useAuthStore((s) => s.tenantId);
  const queryClient = useQueryClient();
  const { message } = App.useApp();
  const { t } = useTranslation('dashboard');
  const { ref: tableWrapperRef, height: tableBodyHeight } = useTableHeight();

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<MaterialDto | null>(null);
  const [createForm] = Form.useForm<CreateMaterialRequest>();
  const [editForm] = Form.useForm<Omit<CreateMaterialRequest, 'code'>>();

  const { guardedClose: guardedCreateClose, onValuesChange: onCreateValuesChange, markClean: markCreateClean } =
    useUnsavedChanges(createOpen);
  const { guardedClose: guardedEditClose, onValuesChange: onEditValuesChange, markClean: markEditClean } =
    useUnsavedChanges(!!editing);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState<string>('code');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => { setPage(1); }, [debouncedSearch, categoryFilter, isActiveFilter]);

  const { data: pagedResult, isLoading } = useQuery({
    queryKey: ['materials', tenantId, debouncedSearch, categoryFilter, isActiveFilter, page, pageSize, sortBy, sortDirection],
    queryFn: () =>
      materialsApi
        .getAll({
          search: debouncedSearch || undefined,
          category: categoryFilter,
          isActive: isActiveFilter,
          page,
          pageSize,
          sortBy,
          isDescending: sortDirection === 'desc',
        })
        .then((r) => r.data),
    enabled: !!tenantId,
  });

  const data = pagedResult?.items;

  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    (data ?? []).forEach((m) => set.add(m.category));
    return Array.from(set).sort().map((k) => ({ label: k, value: k }));
  }, [data]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['materials'] });

  const createMutation = useMutation({
    mutationFn: (values: CreateMaterialRequest) => materialsApi.create(values).then((r) => r.data),
    onSuccess: () => {
      message.success(t('materials.created'));
      markCreateClean();
      setCreateOpen(false);
      createForm.resetFields();
      invalidate();
    },
    onError: (err) => message.error(getErrorMessage(err, t('materials.createError'))),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: Omit<CreateMaterialRequest, 'code'> }) =>
      materialsApi.update(id, values).then((r) => r.data),
    onSuccess: () => {
      message.success(t('materials.saved'));
      markEditClean();
      setEditing(null);
      invalidate();
    },
    onError: (err) => message.error(getErrorMessage(err, t('materials.saveError'))),
  });

  const setActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      (isActive ? materialsApi.activate(id) : materialsApi.deactivate(id)),
    onSuccess: invalidate,
    onError: (err) => message.error(getErrorMessage(err, t('materials.saveError'))),
  });

  const exportColumns: ExportColumn<MaterialDto>[] = [
    { header: t('materials.code'), value: (m) => m.code, width: 12 },
    { header: t('materials.name'), value: (m) => m.name, width: 24 },
    { header: t('materials.unit'), value: (m) => m.unit, width: 8 },
    { header: t('materials.category'), value: (m) => m.category, width: 18 },
    { header: t('materials.dimX'), value: (m) => m.dimensionX ?? '', align: 'right', width: 10 },
    { header: t('materials.dimY'), value: (m) => m.dimensionY ?? '', align: 'right', width: 10 },
    { header: t('materials.dimZ'), value: (m) => m.dimensionZ ?? '', align: 'right', width: 10 },
    { header: t('materials.min'), value: (m) => m.minQuantity, align: 'right', width: 8 },
    { header: t('materials.max'), value: (m) => m.maxQuantity, align: 'right', width: 8 },
    { header: t('materials.location'), value: (m) => m.location ?? '', width: 14 },
    { header: t('materials.status'), value: (m) => m.isActive ? t('materials.statusActive') : t('materials.statusInactive'), width: 12 },
  ];

  const fetchAllForExport = async () => {
    const { data } = await materialsApi.getAll({
      search: debouncedSearch || undefined,
      category: categoryFilter,
      isActive: isActiveFilter,
      page: 1,
      pageSize: 10000,
    });
    return data.items;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>{t('materials.title')}</Title>
        <Space>
          <TableExportButton
            onFetchAll={fetchAllForExport}
            columns={exportColumns}
            options={{
              fileName: `materials-${dayjs().format('YYYY-MM-DD')}`,
              title: t('materials.title'),
              sheetName: t('materials.title'),
            }}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { createForm.resetFields(); setCreateOpen(true); }}>
            {t('materials.newMaterial')}
          </Button>
        </Space>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <Input.Search
          placeholder={t('materials.searchPlaceholder')}
          allowClear
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 260 }}
        />
        <Select
          allowClear
          placeholder={t('materials.allCategories')}
          style={{ width: 200 }}
          options={categoryOptions}
          value={categoryFilter}
          onChange={setCategoryFilter}
        />
        <Select
          placeholder={t('materials.status')}
          allowClear
          style={{ width: 150 }}
          value={isActiveFilter}
          onChange={setIsActiveFilter}
          options={[
            { label: t('materials.active'), value: true },
            { label: t('materials.inactive'), value: false },
          ]}
        />
      </div>

      <div ref={tableWrapperRef} style={{ flex: 1, minHeight: 0 }}>
        <Table<MaterialDto>
          loading={isLoading}
          dataSource={data}
          rowKey="id"
          size="middle"
          scroll={{ x: 'max-content', y: tableBodyHeight }}
          pagination={{
            current: page,
            pageSize,
            total: pagedResult?.totalCount,
            showSizeChanger: true,
          }}
          locale={{ emptyText: <Empty description={t('materials.empty')} image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
          onChange={(pagination, _filters, sorter) => {
            if (pagination.pageSize !== pageSize) {
              setPageSize(pagination.pageSize ?? 20);
              setPage(1);
              return;
            }
            const s = Array.isArray(sorter) ? sorter[0] : sorter;
            const newField = (s?.order ? (s.field as string) : undefined) ?? 'code';
            const newDir: 'asc' | 'desc' = s?.order === 'descend' ? 'desc' : 'asc';
            if (newField !== sortBy || newDir !== sortDirection) {
              setSortBy(newField);
              setSortDirection(newDir);
              setPage(1);
              return;
            }
            if (pagination.current !== page) setPage(pagination.current ?? 1);
          }}
          columns={[
            { title: t('materials.code'), dataIndex: 'code', width: 110, sorter: true, fixed: 'left' },
            { title: t('materials.name'), dataIndex: 'name', width: 260, sorter: true, fixed: 'left' },
            { title: t('materials.unit'), dataIndex: 'unit', width: 70 },
            { title: t('materials.category'), dataIndex: 'category', width: 160, sorter: true },
            {
              title: t('materials.dimensions'),
              width: 200,
              render: (_, m) => {
                const xs = [m.dimensionX, m.dimensionY, m.dimensionZ].filter((v) => v != null);
                return xs.length === 0 ? '—' : xs.join(' × ');
              },
            },
            { title: t('materials.min'), dataIndex: 'minQuantity', width: 80, align: 'right' as const },
            { title: t('materials.max'), dataIndex: 'maxQuantity', width: 80, align: 'right' as const },
            { title: t('materials.location'), dataIndex: 'location', width: 130, render: (v: string | null) => v || '—' },
            {
              title: t('materials.status'),
              dataIndex: 'isActive',
              width: 110,
              render: (v: boolean) => v ? <Tag color="green">{t('materials.statusActive')}</Tag> : <Tag>{t('materials.statusInactive')}</Tag>,
            },
            {
              title: '',
              width: 200,
              fixed: 'right' as const,
              render: (_, m) => (
                <Space>
                  <Button size="small" onClick={(e) => {
                    e.stopPropagation();
                    setEditing(m);
                    editForm.setFieldsValue({
                      name: m.name,
                      unit: m.unit,
                      category: m.category,
                      minQuantity: m.minQuantity,
                      maxQuantity: m.maxQuantity,
                      dimensionX: m.dimensionX,
                      dimensionY: m.dimensionY,
                      dimensionZ: m.dimensionZ,
                      location: m.location,
                      notes: m.notes,
                    });
                  }}>{t('common:actions.edit', { defaultValue: 'Edit' })}</Button>
                  {m.isActive ? (
                    <Popconfirm title={t('materials.deactivateConfirm')} onConfirm={() => setActiveMutation.mutate({ id: m.id, isActive: false })}>
                      <Button size="small" danger onClick={(e) => e.stopPropagation()}>{t('materials.deactivate')}</Button>
                    </Popconfirm>
                  ) : (
                    <Button size="small" onClick={(e) => { e.stopPropagation(); setActiveMutation.mutate({ id: m.id, isActive: true }); }}>
                      {t('materials.activate')}
                    </Button>
                  )}
                </Space>
              ),
            },
          ]}
        />
      </div>

      <Drawer
        title={t('materials.newMaterial')}
        open={createOpen}
        onClose={() => guardedCreateClose(() => { setCreateOpen(false); createForm.resetFields(); })}
        width={540}
        destroyOnClose
      >
        <Form<CreateMaterialRequest>
          form={createForm}
          layout="vertical"
          onValuesChange={onCreateValuesChange}
          onFinish={(values) => createMutation.mutate(values)}
          initialValues={{ minQuantity: 0, maxQuantity: 0 }}
        >
          <Form.Item label={t('materials.code')} name="code" rules={[{ required: true, message: t('materials.validation.codeRequired') }]}>
            <Input maxLength={50} />
          </Form.Item>
          <Form.Item label={t('materials.name')} name="name" rules={[{ required: true, message: t('materials.validation.nameRequired') }]}>
            <Input maxLength={200} />
          </Form.Item>
          <Form.Item label={t('materials.unit')} name="unit" rules={[{ required: true, message: t('materials.validation.unitRequired') }]}>
            <Input maxLength={20} placeholder={t('materials.unitPlaceholder')} />
          </Form.Item>
          <Form.Item label={t('materials.category')} name="category" rules={[{ required: true, message: t('materials.validation.categoryRequired') }]}>
            <Input maxLength={100} placeholder={t('materials.categoryPlaceholder')} />
          </Form.Item>
          <Space.Compact style={{ width: '100%' }}>
            <Form.Item label={t('materials.min')} name="minQuantity" style={{ flex: 1 }} rules={[{ required: true }]}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label={t('materials.max')} name="maxQuantity" style={{ flex: 1 }} rules={[{ required: true }]}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Space.Compact>
          <Space.Compact style={{ width: '100%' }}>
            <Form.Item label={t('materials.dimX')} name="dimensionX" style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: '100%' }} placeholder="mm" />
            </Form.Item>
            <Form.Item label={t('materials.dimY')} name="dimensionY" style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: '100%' }} placeholder="mm" />
            </Form.Item>
            <Form.Item label={t('materials.dimZ')} name="dimensionZ" style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: '100%' }} placeholder="mm" />
            </Form.Item>
          </Space.Compact>
          <Form.Item label={t('materials.location')} name="location">
            <Input maxLength={100} />
          </Form.Item>
          <Form.Item label={t('materials.notes')} name="notes">
            <Input.TextArea rows={2} maxLength={1000} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
            {t('common:actions.save', { defaultValue: 'Save' })}
          </Button>
        </Form>
      </Drawer>

      <Drawer
        title={editing ? `${t('materials.editMaterial')}: ${editing.code}` : ''}
        open={!!editing}
        onClose={() => guardedEditClose(() => setEditing(null))}
        width={540}
        destroyOnClose
      >
        <Form<Omit<CreateMaterialRequest, 'code'>>
          form={editForm}
          layout="vertical"
          onValuesChange={onEditValuesChange}
          onFinish={(values) => editing && updateMutation.mutate({ id: editing.id, values })}
        >
          <Form.Item label={t('materials.name')} name="name" rules={[{ required: true }]}>
            <Input maxLength={200} />
          </Form.Item>
          <Form.Item label={t('materials.unit')} name="unit" rules={[{ required: true }]}>
            <Input maxLength={20} />
          </Form.Item>
          <Form.Item label={t('materials.category')} name="category" rules={[{ required: true }]}>
            <Input maxLength={100} />
          </Form.Item>
          <Space.Compact style={{ width: '100%' }}>
            <Form.Item label={t('materials.min')} name="minQuantity" style={{ flex: 1 }} rules={[{ required: true }]}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label={t('materials.max')} name="maxQuantity" style={{ flex: 1 }} rules={[{ required: true }]}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Space.Compact>
          <Space.Compact style={{ width: '100%' }}>
            <Form.Item label={t('materials.dimX')} name="dimensionX" style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label={t('materials.dimY')} name="dimensionY" style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label={t('materials.dimZ')} name="dimensionZ" style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Space.Compact>
          <Form.Item label={t('materials.location')} name="location">
            <Input maxLength={100} />
          </Form.Item>
          <Form.Item label={t('materials.notes')} name="notes">
            <Input.TextArea rows={2} maxLength={1000} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={updateMutation.isPending}>
            {t('common:actions.save', { defaultValue: 'Save' })}
          </Button>
        </Form>
      </Drawer>
    </div>
  );
}
