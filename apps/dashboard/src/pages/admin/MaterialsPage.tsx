import { useState, useMemo } from 'react';
import { Typography, Table, Button, Drawer, Form, Input, InputNumber, Select, Tag, Space, App, Popconfirm } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { materialsApi } from '@alblue/api-client';
import type { CreateMaterialRequest } from '@alblue/api-client';
import { useAuthStore } from '@alblue/auth';
import type { MaterialDto } from '@alblue/shared-types';

const { Title } = Typography;

function getErrorMessage(err: unknown, fallback: string): string {
  const resp = (err as { response?: { data?: { error?: { code?: string; message?: string } } } })
    ?.response?.data?.error;
  return resp?.message || fallback;
}

/**
 * Admin → Materijali. Saša 08.06.2026 — material master CRUD for the Magacin
 * module. Kod is unique per tenant + immutable after create (BE enforces).
 */
export function MaterialsPage() {
  const tenantId = useAuthStore((s) => s.tenantId);
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<MaterialDto | null>(null);
  const [createForm] = Form.useForm<CreateMaterialRequest>();
  const [editForm] = Form.useForm<Omit<CreateMaterialRequest, 'code'>>();
  const [search, setSearch] = useState('');
  const [kategorijaFilter, setKategorijaFilter] = useState<string | undefined>();
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(true);

  const { data, isLoading } = useQuery({
    queryKey: ['materials', tenantId, search, kategorijaFilter, isActiveFilter],
    queryFn: () =>
      materialsApi
        .getAll({
          search: search || undefined,
          category: kategorijaFilter,
          isActive: isActiveFilter,
          pageSize: 500,
        })
        .then((r) => r.data.items),
    enabled: !!tenantId,
  });

  // Build distinct category dropdown from current dataset (simple v1).
  const kategorijaOptions = useMemo(() => {
    const set = new Set<string>();
    (data ?? []).forEach((m) => set.add(m.category));
    return Array.from(set).sort().map((k) => ({ label: k, value: k }));
  }, [data]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['materials'] });

  const createMutation = useMutation({
    mutationFn: (values: CreateMaterialRequest) => materialsApi.create(values).then((r) => r.data),
    onSuccess: () => {
      message.success('Materijal kreiran.');
      setCreateOpen(false);
      createForm.resetFields();
      invalidate();
    },
    onError: (err) => message.error(getErrorMessage(err, 'Greška pri kreiranju materijala.')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: Omit<CreateMaterialRequest, 'code'> }) =>
      materialsApi.update(id, values).then((r) => r.data),
    onSuccess: () => {
      message.success('Materijal sačuvan.');
      setEditing(null);
      invalidate();
    },
    onError: (err) => message.error(getErrorMessage(err, 'Greška pri čuvanju materijala.')),
  });

  const setActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      (isActive ? materialsApi.activate(id) : materialsApi.deactivate(id)),
    onSuccess: () => invalidate(),
    onError: (err) => message.error(getErrorMessage(err, 'Greška.')),
  });

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>Materijali</Title>

      <Space wrap style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Pretraga po kodu ili nazivu"
          allowClear
          style={{ width: 280 }}
          onSearch={setSearch}
          onChange={(e) => !e.target.value && setSearch('')}
        />
        <Select
          allowClear
          placeholder="Sve kategorije"
          style={{ width: 220 }}
          options={kategorijaOptions}
          value={kategorijaFilter}
          onChange={setKategorijaFilter}
        />
        <Select
          style={{ width: 150 }}
          value={isActiveFilter}
          onChange={setIsActiveFilter}
          options={[
            { label: 'Aktivni', value: true },
            { label: 'Neaktivni', value: false },
            { label: 'Svi', value: undefined as unknown as boolean },
          ]}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
          Novi materijal
        </Button>
      </Space>

      <Table<MaterialDto>
        loading={isLoading}
        dataSource={data}
        rowKey="id"
        size="middle"
        scroll={{ x: 1100 }}
        pagination={{ pageSize: 50, showSizeChanger: true }}
        columns={[
          { title: 'Kod', dataIndex: 'code', width: 100, fixed: 'left' },
          { title: 'Naziv', dataIndex: 'name', width: 240, fixed: 'left' },
          { title: 'JM', dataIndex: 'unit', width: 70 },
          { title: 'Kategorija', dataIndex: 'category', width: 160 },
          {
            title: 'Dimenzije (X × Y × Z)',
            width: 180,
            render: (_, m) => {
              const xs = [m.dimensionX, m.dimensionY, m.dimensionZ].filter((v) => v != null);
              return xs.length === 0 ? '—' : xs.join(' × ');
            },
          },
          { title: 'Min', dataIndex: 'minQuantity', width: 70, align: 'right' as const },
          { title: 'Max', dataIndex: 'maxQuantity', width: 70, align: 'right' as const },
          { title: 'Pozicija', dataIndex: 'location', width: 120, render: (v: string | null) => v || '—' },
          {
            title: 'Status',
            dataIndex: 'isActive',
            width: 100,
            render: (v: boolean) => v ? <Tag color="green">Aktivan</Tag> : <Tag>Neaktivan</Tag>,
          },
          {
            title: '',
            width: 180,
            render: (_, m) => (
              <Space>
                <Button size="small" onClick={() => {
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
                }}>
                  Izmeni
                </Button>
                {m.isActive ? (
                  <Popconfirm title="Deaktiviraj materijal?" onConfirm={() => setActiveMutation.mutate({ id: m.id, isActive: false })}>
                    <Button size="small" danger>Deaktiviraj</Button>
                  </Popconfirm>
                ) : (
                  <Button size="small" onClick={() => setActiveMutation.mutate({ id: m.id, isActive: true })}>
                    Aktiviraj
                  </Button>
                )}
              </Space>
            ),
          },
        ]}
      />

      <Drawer
        title="Novi materijal"
        open={createOpen}
        onClose={() => { setCreateOpen(false); createForm.resetFields(); }}
        width={520}
        destroyOnClose
      >
        <Form<CreateMaterialRequest>
          form={createForm}
          layout="vertical"
          onFinish={(values) => createMutation.mutate(values)}
          initialValues={{ minQuantity: 0, maxQuantity: 0 }}
        >
          <Form.Item label="Kod" name="code" rules={[{ required: true, message: 'Kod je obavezan.' }]}>
            <Input maxLength={50} />
          </Form.Item>
          <Form.Item label="Naziv" name="name" rules={[{ required: true, message: 'Naziv je obavezan.' }]}>
            <Input maxLength={200} />
          </Form.Item>
          <Form.Item label="Jedinica mere" name="unit" rules={[{ required: true, message: 'Jedinica mere je obavezna.' }]}>
            <Input maxLength={20} placeholder="kom, m2, kg..." />
          </Form.Item>
          <Form.Item label="Kategorija" name="category" rules={[{ required: true, message: 'Kategorija je obavezna.' }]}>
            <Input maxLength={100} placeholder="Profil, Lim, Staklo..." />
          </Form.Item>
          <Space.Compact style={{ width: '100%' }}>
            <Form.Item label="Min" name="minQuantity" style={{ flex: 1 }} rules={[{ required: true }]}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Max" name="maxQuantity" style={{ flex: 1 }} rules={[{ required: true }]}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Space.Compact>
          <Space.Compact style={{ width: '100%' }}>
            <Form.Item label="Dim X" name="dimensionX" style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: '100%' }} placeholder="mm" />
            </Form.Item>
            <Form.Item label="Dim Y" name="dimensionY" style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: '100%' }} placeholder="mm" />
            </Form.Item>
            <Form.Item label="Dim Z" name="dimensionZ" style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: '100%' }} placeholder="mm" />
            </Form.Item>
          </Space.Compact>
          <Form.Item label="Pozicija" name="location">
            <Input maxLength={100} />
          </Form.Item>
          <Form.Item label="Napomena" name="notes">
            <Input.TextArea rows={2} maxLength={1000} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={createMutation.isPending}>Sačuvaj</Button>
        </Form>
      </Drawer>

      <Drawer
        title={editing ? `Izmeni materijal: ${editing.code}` : ''}
        open={!!editing}
        onClose={() => setEditing(null)}
        width={520}
        destroyOnClose
      >
        <Form<Omit<CreateMaterialRequest, 'code'>>
          form={editForm}
          layout="vertical"
          onFinish={(values) => editing && updateMutation.mutate({ id: editing.id, values })}
        >
          <Form.Item label="Naziv" name="name" rules={[{ required: true }]}>
            <Input maxLength={200} />
          </Form.Item>
          <Form.Item label="Jedinica mere" name="unit" rules={[{ required: true }]}>
            <Input maxLength={20} />
          </Form.Item>
          <Form.Item label="Kategorija" name="category" rules={[{ required: true }]}>
            <Input maxLength={100} />
          </Form.Item>
          <Space.Compact style={{ width: '100%' }}>
            <Form.Item label="Min" name="minQuantity" style={{ flex: 1 }} rules={[{ required: true }]}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Max" name="maxQuantity" style={{ flex: 1 }} rules={[{ required: true }]}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Space.Compact>
          <Space.Compact style={{ width: '100%' }}>
            <Form.Item label="Dim X" name="dimensionX" style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Dim Y" name="dimensionY" style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Dim Z" name="dimensionZ" style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Space.Compact>
          <Form.Item label="Pozicija" name="location">
            <Input maxLength={100} />
          </Form.Item>
          <Form.Item label="Napomena" name="notes">
            <Input.TextArea rows={2} maxLength={1000} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={updateMutation.isPending}>Sačuvaj</Button>
        </Form>
      </Drawer>
    </div>
  );
}
