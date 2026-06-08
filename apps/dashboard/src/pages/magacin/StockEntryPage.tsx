import { useMemo } from 'react';
import { Typography, Form, Input, InputNumber, DatePicker, Button, Table, Select, Space, App, Popconfirm } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { magacinApi, materialsApi } from '@alblue/api-client';
import { useAuthStore } from '@alblue/auth';
import { StockMovementType } from '@alblue/shared-types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

function getErrorMessage(err: unknown, fallback: string): string {
  const resp = (err as { response?: { data?: { error?: { code?: string; message?: string } } } })
    ?.response?.data?.error;
  return resp?.message || fallback;
}

interface LineFormShape {
  materialId?: string;
  quantity?: number;
  unitPrice?: number | null;
  notes?: string;
}

interface EntryFormShape {
  documentReference?: string;
  movementDate: dayjs.Dayjs;
  notes?: string;
  lines: LineFormShape[];
}

/**
 * Magacin → Ulaz/Izlaz. Saša 08.06.2026 Excel ("Ulaz" + "Izlaz" sheets).
 * Same shape — only the document-reference label and the create direction
 * differ. type prop drives both.
 */
export function StockEntryPage({ type }: { type: StockMovementType }) {
  const tenantId = useAuthStore((s) => s.tenantId);
  const queryClient = useQueryClient();
  const { message } = App.useApp();
  const [form] = Form.useForm<EntryFormShape>();

  const isUlaz = type === StockMovementType.Ulaz;
  const docLabel = isUlaz ? 'Broj prijemnice' : 'Broj narudžbenice';
  const title = isUlaz ? 'Ulaz materijala (prijemnica)' : 'Izlaz materijala (po narudžbenici)';
  const submitLabel = isUlaz ? 'Sačuvaj prijemnicu' : 'Sačuvaj izlaz';

  const { data: materials } = useQuery({
    queryKey: ['materials-for-magacin', tenantId],
    queryFn: () => materialsApi.getAll({ isActive: true, pageSize: 500 }).then((r) => r.data.items),
    enabled: !!tenantId,
  });

  const materialMap = useMemo(() => {
    const m = new Map<string, typeof materials extends (infer U)[] | undefined ? U : never>();
    (materials ?? []).forEach((mat) => m.set(mat.id, mat));
    return m;
  }, [materials]);

  const materialOptions = (materials ?? []).map((m) => ({
    label: `${m.code} — ${m.name}`,
    value: m.id,
  }));

  const mutation = useMutation({
    mutationFn: (values: EntryFormShape) =>
      magacinApi.createEntry({
        type,
        documentReference: values.documentReference!.trim(),
        movementDate: values.movementDate.toISOString(),
        notes: values.notes ?? null,
        lines: (values.lines ?? []).map((l) => ({
          materialId: l.materialId!,
          quantity: l.quantity!,
          unitPrice: l.unitPrice ?? null,
          notes: l.notes ?? null,
        })),
      }),
    onSuccess: () => {
      message.success(isUlaz ? 'Ulaz sačuvan.' : 'Izlaz sačuvan.');
      form.resetFields();
      form.setFieldsValue({ movementDate: dayjs(), lines: [{}] });
      queryClient.invalidateQueries({ queryKey: ['magacin-stanje'] });
      queryClient.invalidateQueries({ queryKey: ['magacin-istorija'] });
    },
    onError: (err) => message.error(getErrorMessage(err, 'Greška pri snimanju.')),
  });

  return (
    <div style={{ padding: 24, maxWidth: 1200 }}>
      <Title level={3}>{title}</Title>

      <Form<EntryFormShape>
        form={form}
        layout="vertical"
        initialValues={{ movementDate: dayjs(), lines: [{}] }}
        onFinish={(values) => mutation.mutate(values)}
      >
        <Space wrap style={{ marginBottom: 16 }}>
          <Form.Item label={docLabel} name="documentReference" required rules={[{ required: true, message: `${docLabel} je obavezan.` }]}>
            <Input placeholder={isUlaz ? '2026/043' : 'ORD-2026-006'} style={{ width: 220 }} maxLength={50} />
          </Form.Item>
          <Form.Item label="Datum" name="movementDate" required>
            <DatePicker format="DD.MM.YYYY" style={{ width: 160 }} />
          </Form.Item>
          <Form.Item label="Napomena (zaglavlje)" name="notes">
            <Input style={{ width: 320 }} />
          </Form.Item>
        </Space>

        <Text strong>Stavke materijala</Text>
        <Form.List name="lines">
          {(fields, { add, remove }) => (
            <>
              <Table
                size="small"
                pagination={false}
                style={{ marginTop: 8, marginBottom: 12 }}
                dataSource={fields.map((f) => ({ ...f, key: f.key }))}
                columns={[
                  {
                    title: 'Materijal',
                    width: 280,
                    render: (_, field) => (
                      <Form.Item name={[field.name, 'materialId']} noStyle rules={[{ required: true, message: 'Izaberi materijal' }]}>
                        <Select showSearch optionFilterProp="label" options={materialOptions} placeholder="Izaberi…" style={{ width: '100%' }} />
                      </Form.Item>
                    ),
                  },
                  {
                    title: 'Količina',
                    width: 110,
                    render: (_, field) => (
                      <Form.Item name={[field.name, 'quantity']} noStyle rules={[{ required: true, message: 'Količina' }]}>
                        <InputNumber min={0.001} step={1} style={{ width: '100%' }} />
                      </Form.Item>
                    ),
                  },
                  {
                    title: isUlaz ? 'Cena po JM' : 'Cena po JM (opciono)',
                    width: 140,
                    render: (_, field) => (
                      <Form.Item name={[field.name, 'unitPrice']} noStyle rules={isUlaz ? [{ required: true, message: 'Cena' }] : undefined}>
                        <InputNumber
                          min={0}
                          step={1}
                          style={{ width: '100%' }}
                          placeholder={isUlaz ? '' : 'Preuzima poslednju'}
                        />
                      </Form.Item>
                    ),
                  },
                  {
                    title: 'Napomena',
                    render: (_, field) => (
                      <Form.Item name={[field.name, 'notes']} noStyle>
                        <Input placeholder="—" />
                      </Form.Item>
                    ),
                  },
                  {
                    title: '',
                    width: 50,
                    render: (_, field) =>
                      fields.length > 1 ? (
                        <Popconfirm title="Ukloni stavku?" onConfirm={() => remove(field.name)}>
                          <Button danger size="small" icon={<DeleteOutlined />} />
                        </Popconfirm>
                      ) : null,
                  },
                ]}
              />
              <Button onClick={() => add({})} icon={<PlusOutlined />}>Dodaj stavku</Button>
            </>
          )}
        </Form.List>

        <div style={{ marginTop: 24 }}>
          <Button type="primary" htmlType="submit" loading={mutation.isPending}>{submitLabel}</Button>
        </div>
      </Form>
    </div>
  );
}
