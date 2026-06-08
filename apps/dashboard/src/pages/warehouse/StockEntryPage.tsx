import { Typography, Form, Input, InputNumber, DatePicker, Button, Table, Select, Space, App, Popconfirm } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { warehouseApi, materialsApi } from '@alblue/api-client';
import { useAuthStore } from '@alblue/auth';
import { useTranslation } from '@alblue/i18n';
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

export function StockEntryPage({ type }: { type: StockMovementType }) {
  const tenantId = useAuthStore((s) => s.tenantId);
  const queryClient = useQueryClient();
  const { message } = App.useApp();
  const { t } = useTranslation('dashboard');
  const [form] = Form.useForm<EntryFormShape>();

  const isInflow = type === StockMovementType.Inflow;
  const docLabel = isInflow ? t('warehouse.documentReferenceInflow') : t('warehouse.documentReferenceOutflow');
  const docPlaceholder = isInflow ? t('warehouse.documentReferenceInflowPlaceholder') : t('warehouse.documentReferenceOutflowPlaceholder');
  const title = isInflow ? t('warehouse.inflowTitle') : t('warehouse.outflowTitle');
  const submitLabel = isInflow ? t('warehouse.saveInflow') : t('warehouse.saveOutflow');

  const { data: materials } = useQuery({
    queryKey: ['materials-for-warehouse', tenantId],
    queryFn: () => materialsApi.getAll({ isActive: true, pageSize: 500 }).then((r) => r.data.items),
    enabled: !!tenantId,
  });

  const materialOptions = (materials ?? []).map((m) => ({
    label: `${m.code} — ${m.name}`,
    value: m.id,
  }));

  const mutation = useMutation({
    mutationFn: (values: EntryFormShape) =>
      warehouseApi.createEntry({
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
      message.success(isInflow ? t('warehouse.inflowSaved') : t('warehouse.outflowSaved'));
      form.resetFields();
      form.setFieldsValue({ movementDate: dayjs(), lines: [{}] });
      queryClient.invalidateQueries({ queryKey: ['warehouse-stock'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse-history'] });
    },
    onError: (err) => message.error(getErrorMessage(err, t('warehouse.saveError'))),
  });

  return (
    <div style={{ padding: 0, maxWidth: 1200 }}>
      <Title level={4}>{title}</Title>

      <Form<EntryFormShape>
        form={form}
        layout="vertical"
        initialValues={{ movementDate: dayjs(), lines: [{}] }}
        onFinish={(values) => mutation.mutate(values)}
      >
        <Space wrap style={{ marginBottom: 16 }}>
          <Form.Item label={docLabel} name="documentReference" required rules={[{ required: true, message: t('warehouse.documentReferenceRequired') }]}>
            <Input placeholder={docPlaceholder} style={{ width: 220 }} maxLength={50} />
          </Form.Item>
          <Form.Item label={t('warehouse.date')} name="movementDate" required>
            <DatePicker format="DD.MM.YYYY" style={{ width: 160 }} />
          </Form.Item>
          <Form.Item label={t('warehouse.headerNotes')} name="notes">
            <Input style={{ width: 320 }} />
          </Form.Item>
        </Space>

        <div style={{ marginTop: 8 }}>
          <Text strong>{t('warehouse.lines')}</Text>
        </div>
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
                    title: t('warehouse.name'),
                    width: 280,
                    render: (_, field) => (
                      <Form.Item name={[field.name, 'materialId']} noStyle rules={[{ required: true, message: t('warehouse.lineMaterialRequired') }]}>
                        <Select showSearch optionFilterProp="label" options={materialOptions} placeholder={t('warehouse.selectMaterial')} style={{ width: '100%' }} />
                      </Form.Item>
                    ),
                  },
                  {
                    title: t('warehouse.quantity'),
                    width: 110,
                    render: (_, field) => (
                      <Form.Item name={[field.name, 'quantity']} noStyle rules={[{ required: true, message: t('warehouse.lineQuantityRequired') }]}>
                        <InputNumber min={0.001} step={1} style={{ width: '100%' }} />
                      </Form.Item>
                    ),
                  },
                  {
                    title: isInflow ? t('warehouse.unitPrice') : t('warehouse.unitPriceOptional'),
                    width: 160,
                    render: (_, field) => (
                      <Form.Item name={[field.name, 'unitPrice']} noStyle rules={isInflow ? [{ required: true }] : undefined}>
                        <InputNumber
                          min={0}
                          step={1}
                          style={{ width: '100%' }}
                          placeholder={isInflow ? '' : t('warehouse.unitPriceFallbackHint')}
                        />
                      </Form.Item>
                    ),
                  },
                  {
                    title: t('warehouse.notes'),
                    render: (_, field) => (
                      <Form.Item name={[field.name, 'notes']} noStyle>
                        <Input placeholder={t('warehouse.lineNotesPlaceholder')} />
                      </Form.Item>
                    ),
                  },
                  {
                    title: '',
                    width: 50,
                    render: (_, field) =>
                      fields.length > 1 ? (
                        <Popconfirm title={t('warehouse.removeLine')} onConfirm={() => remove(field.name)}>
                          <Button danger size="small" icon={<DeleteOutlined />} />
                        </Popconfirm>
                      ) : null,
                  },
                ]}
              />
              <Button onClick={() => add({})} icon={<PlusOutlined />}>{t('warehouse.addLine')}</Button>
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
