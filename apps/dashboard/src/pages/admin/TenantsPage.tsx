import { useState, useEffect } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import { useTableHeight } from '../../hooks/useTableHeight';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';
import {
  Table, Button, Drawer, Form, Input, Tag, App,
  Divider, Popconfirm, Select, DatePicker, Alert, InputNumber, Empty, Typography, Tooltip,
} from 'antd';
import { PlusOutlined, DeleteOutlined, StopOutlined, CheckCircleOutlined, EditOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tenantsApi, usersApi } from '@alblue/api-client';
import { UserRole } from '@alblue/shared-types';
import type { TenantDto, TenantPaymentDto } from '@alblue/shared-types';
import { useTranslation } from '@alblue/i18n';
import { passwordRules } from '../../utils/password';
import dayjs from 'dayjs';
import { TableExportButton } from '../../components/TableExportButton';
import type { ExportColumn } from '../../utils/exportTable';
import { PageHeader } from '../../components/PageHeader';
import { getTranslatedError } from '../../utils/errors';

// Defaults for warning / critical days seeded at tenant creation time so
// the new tenant's Admin has something sensible until they tune them via
// Profil firme (Milos 15.06.2026 — those numbers are the tenant's own
// settings, not a SuperAdmin concern).
const DEFAULT_WARNING_DAYS = 7;
const DEFAULT_CRITICAL_DAYS = 3;

interface TenantsPageProps {
  /** When true, suppress the top PageHeader — used when embedding this
   *  component as a tab panel inside FirmaPage so the parent owns the
   *  header. */
  hideHeader?: boolean;
}

export function TenantsPage({ hideHeader = false }: TenantsPageProps = {}) {
  const queryClient = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTenant, setEditTenant] = useState<TenantDto | null>(null);
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const { t } = useTranslation('dashboard');

  const { ref: tableWrapperRef, height: tableBodyHeight } = useTableHeight();
  const { guardedClose: guardedDrawerClose, onValuesChange: onDrawerValuesChange, markClean: markDrawerClean } = useUnsavedChanges(drawerOpen);

  // Naplata (billing) drawer state — nested inside the tenant edit Drawer
  // so a SA can record a new payment without losing the tenant they're on.
  const [paymentDrawerOpen, setPaymentDrawerOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<TenantPaymentDto | null>(null);
  const [paymentForm] = Form.useForm();
  const [blockReasonOpen, setBlockReasonOpen] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [paymentsYearFilter, setPaymentsYearFilter] = useState<number | undefined>(undefined);

  // ─── Filter & Pagination State ──────────────────────────
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(undefined);
  const [dateFrom, setDateFrom] = useState<dayjs.Dayjs | null>(null);
  const [dateTo, setDateTo] = useState<dayjs.Dayjs | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState<string | undefined>('name');
  const [sortDirection, setSortDirection] = useState<string | undefined>('asc');

  useEffect(() => { setPage(1); }, [debouncedSearch, isActiveFilter, dateFrom, dateTo]);

  const isCreating = drawerOpen && !editTenant;

  const { data: pagedResult, isLoading } = useQuery({
    queryKey: ['tenants', debouncedSearch, isActiveFilter, dateFrom?.format('YYYY-MM-DD'), dateTo?.format('YYYY-MM-DD'), page, pageSize, sortBy, sortDirection],
    queryFn: () => tenantsApi.getAll({
      search: debouncedSearch || undefined,
      isActive: isActiveFilter,
      createdFrom: dateFrom?.format('YYYY-MM-DD'),
      createdTo: dateTo?.format('YYYY-MM-DD'),
      page,
      pageSize,
      sortBy,
      sortDirection,
    }).then((r) => r.data),
  });

  const data = pagedResult?.items;

  const currentDetail = editTenant ? data?.find((item) => item.id === editTenant.id) ?? editTenant : null;

  // Tenant creation is a two-step server-side flow because tenant + user
  // live in different modules with different DbContexts (no shared
  // transaction). On admin-creation failure the tenant exists but is
  // adminless — we surface a clear error so a SuperAdmin can recover from
  // DB, and a future commit will add a "create Admin for tenant X" button.
  const createMutation = useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const tenant = await tenantsApi.create({
        name: values.name as string,
        code: values.code as string,
        defaultWarningDays: DEFAULT_WARNING_DAYS,
        defaultCriticalDays: DEFAULT_CRITICAL_DAYS,
        warningColor: '#FFA500',
        criticalColor: '#FF0000',
      });
      try {
        await usersApi.create({
          tenantId: tenant.data.id,
          email: values.adminEmail as string,
          firstName: values.adminFirstName as string,
          lastName: values.adminLastName as string,
          password: values.adminPassword as string,
          role: UserRole.Admin,
        });
      } catch (adminErr) {
        throw new Error(t('admin.tenants.adminCreateFailed', {
          defaultValue: 'Firma kreirana, ali inicijalni Admin nije. Kreiraj Admina ručno za ovu firmu.',
        }) + ' (' + ((adminErr as { message?: string })?.message ?? '') + ')');
      }
      return tenant.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      closeDrawer();
      message.success(t('admin.tenants.created'));
    },
    onError: (err) => message.error(getTranslatedError(err, t, t('admin.tenants.createFailed'))),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: Record<string, unknown> }) =>
      tenantsApi.update(id, { name: values.name as string }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      message.success(t('admin.tenants.updated'));
      markDrawerClean();
    },
    onError: (err) => message.error(getTranslatedError(err, t, t('admin.tenants.updateFailed'))),
  });

  // ─── Naplata (billing) — payments + block/unblock ──────────
  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['tenant-payments', editTenant?.id],
    queryFn: () => tenantsApi.listPayments(editTenant!.id).then((r) => r.data),
    enabled: !!editTenant?.id && drawerOpen,
  });

  const savePaymentMutation = useMutation({
    mutationFn: (values: Record<string, unknown>) => {
      const period = values.period as [dayjs.Dayjs, dayjs.Dayjs];
      const paidAt = values.paidAt as dayjs.Dayjs;
      const payload = {
        periodStart: period[0].format('YYYY-MM-DD'),
        periodEnd: period[1].format('YYYY-MM-DD'),
        amount: values.amount as number,
        currency: (values.currency as string)?.trim() || 'EUR',
        paidAt: paidAt.toISOString(),
        invoiceNumber: (values.invoiceNumber as string) || null,
        notes: (values.notes as string) || null,
      };
      return editingPayment
        ? tenantsApi.updatePayment(editTenant!.id, editingPayment.id, payload)
        : tenantsApi.addPayment(editTenant!.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-payments', editTenant?.id] });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      const wasEdit = !!editingPayment;
      setPaymentDrawerOpen(false);
      setEditingPayment(null);
      paymentForm.resetFields();
      message.success(
        wasEdit
          ? t('admin.tenants.billing.paymentUpdated', { defaultValue: 'Uplata izmenjena' })
          : t('admin.tenants.billing.paymentAdded', { defaultValue: 'Uplata zabeležena' })
      );
    },
    onError: (err) => message.error(getTranslatedError(err, t, t('admin.tenants.billing.paymentSaveFailed', { defaultValue: 'Greška pri čuvanju uplate' }))),
  });

  const deletePaymentMutation = useMutation({
    mutationFn: (paymentId: string) => tenantsApi.deletePayment(editTenant!.id, paymentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-payments', editTenant?.id] });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      message.success(t('admin.tenants.billing.paymentDeleted', { defaultValue: 'Uplata obrisana' }));
    },
    onError: (err) => message.error(getTranslatedError(err, t, t('admin.tenants.billing.paymentDeleteFailed', { defaultValue: 'Greška pri brisanju uplate' }))),
  });

  const blockMutation = useMutation({
    mutationFn: (reason: string | null) => tenantsApi.block(editTenant!.id, { reason }),
    onSuccess: (resp) => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      setEditTenant(resp.data);
      setBlockReasonOpen(false);
      setBlockReason('');
      message.success(t('admin.tenants.billing.blocked', { defaultValue: 'Firma blokirana' }));
    },
    onError: (err) => message.error(getTranslatedError(err, t, t('admin.tenants.billing.blockFailed', { defaultValue: 'Greška pri blokiranju' }))),
  });

  const unblockMutation = useMutation({
    mutationFn: () => tenantsApi.unblock(editTenant!.id),
    onSuccess: (resp) => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      setEditTenant(resp.data);
      message.success(t('admin.tenants.billing.unblocked', { defaultValue: 'Firma odblokirana' }));
    },
    onError: (err) => message.error(getTranslatedError(err, t, t('admin.tenants.billing.unblockFailed', { defaultValue: 'Greška pri odblokiranju' }))),
  });

  const openCreate = () => {
    form.resetFields();
    setEditTenant(null);
    setDrawerOpen(true);
  };

  const openEdit = (tenant: TenantDto) => {
    setEditTenant(tenant);
    form.setFieldsValue({ name: tenant.name, code: tenant.code });
    setDrawerOpen(true);
  };

  const doCloseDrawer = () => {
    setDrawerOpen(false);
    setEditTenant(null);
    form.resetFields();
  };

  const closeDrawer = (e?: React.MouseEvent | React.KeyboardEvent) => guardedDrawerClose(doCloseDrawer, e);

  const handleFinish = (values: Record<string, unknown>) => {
    if (isCreating) {
      createMutation.mutate(values);
    } else {
      updateMutation.mutate({ id: currentDetail!.id, values });
    }
  };

  // Overdue = no payment covers today. Covers both lapsed (paidThrough
  // is in the past) and never-paid (no payments at all). The two cases
  // are distinguished in the "Plaćeno do" column — lapsed shows a date,
  // never-paid shows "—".
  const isOverdue = (t: TenantDto) => !t.paidThrough || dayjs(t.paidThrough).endOf('day').isBefore(dayjs());

  const columns = [
    {
      title: t('common:labels.name'),
      dataIndex: 'name',
      sorter: true,
      sortOrder: sortBy === 'name' ? (sortDirection === 'desc' ? ('descend' as const) : ('ascend' as const)) : null,
      fixed: 'left' as const,
      width: 240,
    },
    {
      title: t('common:labels.code'),
      dataIndex: 'code',
      sorter: true,
      sortOrder: sortBy === 'code' ? (sortDirection === 'desc' ? ('descend' as const) : ('ascend' as const)) : null,
    },
    {
      title: t('common:labels.status'),
      dataIndex: 'isActive',
      width: 140,
      render: (_: unknown, record: TenantDto) => {
        if (record.blockedAt) {
          return <Tag color="red">{t('admin.tenants.billing.statusBlocked', { defaultValue: 'Blokirana' })}</Tag>;
        }
        if (isOverdue(record)) {
          const tooltipText = record.paidThrough
            ? t('admin.tenants.billing.paidThroughTooltip', { defaultValue: 'Plaćeno do' }) + ' ' + dayjs(record.paidThrough).format('DD.MM.YYYY.')
            : t('admin.tenants.billing.neverPaidTooltip', { defaultValue: 'Nema zabeleženih uplata' });
          return (
            <Tooltip title={tooltipText}>
              <Tag color="orange">{t('admin.tenants.billing.statusOverdue', { defaultValue: 'Kasni' })}</Tag>
            </Tooltip>
          );
        }
        return (
          <Tag color={record.isActive ? 'green' : 'default'}>
            {record.isActive ? t('common:status.active') : t('common:status.inactive')}
          </Tag>
        );
      },
    },
    {
      title: t('admin.tenants.billing.paidThrough', { defaultValue: 'Plaćeno do' }),
      dataIndex: 'paidThrough',
      width: 130,
      render: (d: string | null) => (d ? dayjs(d).format('DD.MM.YYYY.') : <Typography.Text type="secondary">—</Typography.Text>),
    },
    {
      title: t('admin.tenants.billing.lastPaid', { defaultValue: 'Poslednja uplata' }),
      dataIndex: 'lastPaidAt',
      width: 140,
      render: (d: string | null) => (d ? dayjs(d).format('DD.MM.YYYY.') : <Typography.Text type="secondary">—</Typography.Text>),
    },
    {
      title: t('common:labels.created'),
      dataIndex: 'createdAt',
      width: 130,
      sorter: true,
      sortOrder: sortBy === 'createdAt' ? (sortDirection === 'desc' ? ('descend' as const) : ('ascend' as const)) : null,
      render: (d: string) => dayjs(d).format('DD.MM.YYYY.'),
    },
  ];

  const exportColumns: ExportColumn<TenantDto>[] = [
    { header: t('common:labels.name'), value: (tn) => tn.name, width: 28 },
    { header: t('common:labels.code'), value: (tn) => tn.code, width: 14 },
    {
      header: t('common:labels.status'),
      value: (tn) => (tn.isActive ? t('common:status.active') : t('common:status.inactive')),
      cell: (tn) => (tn.isActive ? { fillColor: '#D9F2D9' } : { fillColor: '#F5F5F5' }),
      width: 14,
    },
    { header: t('common:labels.created'), value: (tn) => (tn.createdAt ? new Date(tn.createdAt) : null), width: 18 },
  ];
  const exportFilters: Array<{ label: string; value: string }> = [];
  if (debouncedSearch) exportFilters.push({ label: t('export.search'), value: debouncedSearch });
  if (isActiveFilter !== undefined) exportFilters.push({ label: t('export.isActive'), value: isActiveFilter ? t('common:status.active') : t('common:status.inactive') });
  if (dateFrom) exportFilters.push({ label: t('export.dateFrom'), value: dateFrom.format('DD.MM.YYYY.') });
  if (dateTo) exportFilters.push({ label: t('export.dateTo'), value: dateTo.format('DD.MM.YYYY.') });

  const fetchAllTenants = async (): Promise<TenantDto[]> => {
    const { data } = await tenantsApi.getAll({
      search: debouncedSearch || undefined,
      isActive: isActiveFilter,
      createdFrom: dateFrom?.format('YYYY-MM-DD'),
      createdTo: dateTo?.format('YYYY-MM-DD'),
      page: 1,
      pageSize: 10000,
      sortBy,
      sortDirection,
    });
    return data.items;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {!hideHeader && (
        <PageHeader
          title={t('admin.tenants.title')}
          actions={<><div style={{ display: 'flex', gap: 8 }}>
            <TableExportButton
              onFetchAll={fetchAllTenants}
              columns={exportColumns}
              options={{
                fileName: `tenants-${dayjs().format('YYYY-MM-DD')}`,
                title: `${t('common:appName')} — ${t('admin.tenants.title')}`,
                filters: exportFilters,
                sheetName: t('admin.tenants.title'),
              }}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              {t('admin.tenants.addTenant')}
            </Button>
          </div></>}
        />
      )}
      {hideHeader && (
        // When embedded as a tab panel, render the action row alone so the
        // user still has Export + Add Tenant CTAs without doubling page titles.
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 16 }}>
          <TableExportButton
            onFetchAll={fetchAllTenants}
            columns={exportColumns}
            options={{
              fileName: `tenants-${dayjs().format('YYYY-MM-DD')}`,
              title: `${t('common:appName')} — ${t('admin.tenants.title')}`,
              filters: exportFilters,
              sheetName: t('admin.tenants.title'),
            }}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            {t('admin.tenants.addTenant')}
          </Button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 , flexWrap: 'wrap' }}>
        <Input.Search
          placeholder={t('common:actions.search')}
          allowClear
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 260 }}
        />
        <Select
          placeholder={t('common:labels.status')}
          allowClear
          value={isActiveFilter}
          onChange={(v) => setIsActiveFilter(v)}
          style={{ width: 150 }}
          options={[
            { label: t('common:status.active'), value: true },
            { label: t('common:status.inactive'), value: false },
          ]}
        />
        <DatePicker
          value={dateFrom}
          onChange={setDateFrom}
          format="DD.MM.YYYY"
          allowClear
          placeholder={t('common:labels.dateFrom')}
        />
        <DatePicker
          value={dateTo}
          onChange={setDateTo}
          format="DD.MM.YYYY"
          allowClear
          placeholder={t('common:labels.dateTo')}
        />
      </div>

      <div ref={tableWrapperRef} style={{ flex: 1, minHeight: 0 }}>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 'max-content', y: tableBodyHeight }}
          pagination={{
            current: page,
            pageSize,
            total: pagedResult?.totalCount,
            showSizeChanger: true,
          }}
          onChange={(pagination, _filters, sorter) => {
            if (pagination.pageSize !== pageSize) {
              setPageSize(pagination.pageSize ?? 20);
              setPage(1);
              return;
            }
            const s = Array.isArray(sorter) ? sorter[0] : sorter;
            const newField = (s?.order ? (s.field as string) : undefined) ?? 'name';
            const newDir = (s?.order === 'descend' ? 'desc' : s?.order === 'ascend' ? 'asc' : undefined) ?? 'asc';
            if (newField !== sortBy || newDir !== sortDirection) {
              setSortBy(newField);
              setSortDirection(newDir);
              setPage(1);
              return;
            }
            if (pagination.current !== page) setPage(pagination.current ?? 1);
          }}
          onRow={(record) => ({
            onClick: () => openEdit(record),
            style: { cursor: 'pointer' },
          })}
        />
      </div>

      <Drawer
        title={isCreating ? t('admin.tenants.createTenant') : currentDetail?.name}
        open={drawerOpen}
        onClose={closeDrawer}
        width={Math.min(560, window.innerWidth)}
        extra={
          <div style={{ display: 'flex', gap: 8 }}>
            {isCreating && (
              <Button
                type="primary"
                onClick={() => form.submit()}
                loading={createMutation.isPending}
              >
                {t('common:actions.save')}
              </Button>
            )}
            {!isCreating && currentDetail && !currentDetail.blockedAt && (
              <Button
                danger
                icon={<StopOutlined />}
                onClick={() => { setBlockReason(''); setBlockReasonOpen(true); }}
              >
                {t('admin.tenants.billing.block', { defaultValue: 'Blokiraj' })}
              </Button>
            )}
            {!isCreating && currentDetail && currentDetail.blockedAt && (
              <Popconfirm
                title={t('admin.tenants.billing.unblockConfirm', { defaultValue: 'Odblokirati firmu?' })}
                onConfirm={() => unblockMutation.mutate()}
                okText={t('common:actions.confirm')}
                cancelText={t('common:actions.cancel')}
              >
                <Button icon={<CheckCircleOutlined />} loading={unblockMutation.isPending}>
                  {t('admin.tenants.billing.unblock', { defaultValue: 'Odblokiraj' })}
                </Button>
              </Popconfirm>
            )}
            {!isCreating && (
              <Button
                type="primary"
                onClick={() => form.submit()}
                loading={updateMutation.isPending}
              >
                {t('common:actions.save')}
              </Button>
            )}
          </div>
        }
      >
        {isCreating ? (
          <Form form={form} layout="vertical" scrollToFirstError={{ behavior: 'smooth', block: 'center' }} onFinish={handleFinish} onValuesChange={onDrawerValuesChange}>
            <Form.Item name="name" label={t('common:labels.name')} rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="code" label={t('common:labels.code')} rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            {/* Initial Admin user — only on creation. A SuperAdmin creates
                the tenant + first Admin in one drawer; the new Admin then
                manages everything else (warning/critical days, theme
                colors, later logo) from Profil firme. */}
            <Divider>{t('admin.tenants.initialAdmin', { defaultValue: 'Inicijalni Admin firme' })}</Divider>
            <Form.Item name="adminEmail" label={t('common:labels.email')} rules={[{ required: true, type: 'email' }]}>
              <Input />
            </Form.Item>
            <div style={{ display: 'flex', gap: 12 }}>
              <Form.Item name="adminFirstName" label={t('common:labels.firstName')} rules={[{ required: true }]} style={{ flex: 1 }}>
                <Input />
              </Form.Item>
              <Form.Item name="adminLastName" label={t('common:labels.lastName')} rules={[{ required: true }]} style={{ flex: 1 }}>
                <Input />
              </Form.Item>
            </div>
            <Form.Item name="adminPassword" label={t('common:labels.password')} rules={passwordRules(t)}>
              <Input.Password />
            </Form.Item>
          </Form>
        ) : currentDetail && (
          <>
            {currentDetail.blockedAt && (
              <Alert
                type="error"
                showIcon
                style={{ marginBottom: 16 }}
                message={t('admin.tenants.billing.blockedBanner', {
                  defaultValue: 'Firma je blokirana — korisnici ne mogu da se prijave.',
                })}
                description={
                  <>
                    <div>{t('admin.tenants.billing.blockedAt', { defaultValue: 'Datum blokade' })}: {dayjs(currentDetail.blockedAt).format('DD.MM.YYYY. HH:mm')}</div>
                    {currentDetail.blockedReason && (
                      <div>{t('admin.tenants.billing.blockedReason', { defaultValue: 'Razlog' })}: {currentDetail.blockedReason}</div>
                    )}
                  </>
                }
              />
            )}

            <Form
              form={form}
              layout="vertical"
              scrollToFirstError={{ behavior: 'smooth', block: 'center' }}
              onFinish={handleFinish}
              onValuesChange={onDrawerValuesChange}
            >
              <Form.Item name="name" label={t('common:labels.name')} rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="code" label={t('common:labels.code')}>
                <Input disabled />
              </Form.Item>
            </Form>

            <Divider>{t('admin.tenants.billing.payments', { defaultValue: 'Uplate' })}</Divider>

            {(() => {
              // Year filter — derived from existing payments so it stays
              // in sync without a hardcoded range. A short list collapses
              // to "all years" and we hide the filter.
              const years = Array.from(new Set(payments.map((p) => dayjs(p.paidAt).year()))).sort((a, b) => b - a);
              const filtered = paymentsYearFilter
                ? payments.filter((p) => dayjs(p.paidAt).year() === paymentsYearFilter)
                : payments;
              return (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <Select
                      placeholder={t('admin.tenants.billing.filterByYear', { defaultValue: 'Godina' })}
                      allowClear
                      value={paymentsYearFilter}
                      onChange={(v) => setPaymentsYearFilter(v)}
                      style={{ width: 140 }}
                      disabled={years.length === 0}
                      options={years.map((y) => ({ label: String(y), value: y }))}
                    />
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => {
                        setEditingPayment(null);
                        paymentForm.resetFields();
                        paymentForm.setFieldsValue({ currency: 'EUR', paidAt: dayjs() });
                        setPaymentDrawerOpen(true);
                      }}
                    >
                      {t('admin.tenants.billing.addPayment', { defaultValue: 'Dodaj uplatu' })}
                    </Button>
                  </div>

                  <Table
                    size="small"
                    loading={paymentsLoading}
                    dataSource={filtered}
                    rowKey="id"
                    pagination={false}
                    scroll={{ x: 'max-content' }}
                    locale={{ emptyText: <Empty description={t('admin.tenants.billing.noPayments', { defaultValue: 'Još nema uplata' })} /> }}
                    columns={[
                      {
                        title: t('admin.tenants.billing.paidAt', { defaultValue: 'Datum' }),
                        dataIndex: 'paidAt',
                        sorter: (a: TenantPaymentDto, b: TenantPaymentDto) => dayjs(a.paidAt).valueOf() - dayjs(b.paidAt).valueOf(),
                        defaultSortOrder: 'descend' as const,
                        render: (d: string) => dayjs(d).format('DD.MM.YYYY.'),
                        width: 110,
                      },
                      {
                        title: t('admin.tenants.billing.period', { defaultValue: 'Period' }),
                        sorter: (a: TenantPaymentDto, b: TenantPaymentDto) => dayjs(a.periodStart).valueOf() - dayjs(b.periodStart).valueOf(),
                        render: (_: unknown, row: TenantPaymentDto) => (
                          <span style={{ whiteSpace: 'nowrap' }}>
                            {`${dayjs(row.periodStart).format('DD.MM.YYYY.')} – ${dayjs(row.periodEnd).format('DD.MM.YYYY.')}`}
                          </span>
                        ),
                        width: 220,
                      },
                      {
                        title: t('admin.tenants.billing.amount', { defaultValue: 'Iznos' }),
                        sorter: (a: TenantPaymentDto, b: TenantPaymentDto) => a.amount - b.amount,
                        render: (_: unknown, row: TenantPaymentDto) =>
                          `${row.amount.toLocaleString('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${row.currency}`,
                        width: 130,
                      },
                      {
                        title: t('admin.tenants.billing.invoiceNumber', { defaultValue: 'Faktura' }),
                        dataIndex: 'invoiceNumber',
                        sorter: (a: TenantPaymentDto, b: TenantPaymentDto) => (a.invoiceNumber ?? '').localeCompare(b.invoiceNumber ?? ''),
                        render: (v: string | null) => v || <Typography.Text type="secondary">—</Typography.Text>,
                        width: 130,
                      },
                      {
                        title: t('admin.tenants.billing.notes', { defaultValue: 'Napomena' }),
                        dataIndex: 'notes',
                        render: (v: string | null) =>
                          v
                            ? (
                                <Tooltip title={v}>
                                  <Typography.Text ellipsis style={{ maxWidth: 200, display: 'inline-block' }}>{v}</Typography.Text>
                                </Tooltip>
                              )
                            : <Typography.Text type="secondary">—</Typography.Text>,
                        width: 200,
                      },
                      {
                        title: '',
                        width: 90,
                        fixed: 'right' as const,
                        render: (_: unknown, row: TenantPaymentDto) => (
                          <div style={{ display: 'flex', gap: 4 }}>
                            <Button
                              type="text"
                              icon={<EditOutlined />}
                              onClick={() => {
                                setEditingPayment(row);
                                paymentForm.resetFields();
                                paymentForm.setFieldsValue({
                                  paidAt: dayjs(row.paidAt),
                                  period: [dayjs(row.periodStart), dayjs(row.periodEnd)],
                                  amount: row.amount,
                                  currency: row.currency,
                                  invoiceNumber: row.invoiceNumber ?? undefined,
                                  notes: row.notes ?? undefined,
                                });
                                setPaymentDrawerOpen(true);
                              }}
                            />
                            <Popconfirm
                              title={t('admin.tenants.billing.deletePaymentConfirm', { defaultValue: 'Obrisati uplatu?' })}
                              onConfirm={() => deletePaymentMutation.mutate(row.id)}
                              okText={t('common:actions.confirm')}
                              cancelText={t('common:actions.cancel')}
                            >
                              <Button type="text" danger icon={<DeleteOutlined />} />
                            </Popconfirm>
                          </div>
                        ),
                      },
                    ]}
                  />
                </>
              );
            })()}
          </>
        )}
      </Drawer>

      {/* Nested drawer: add OR edit a payment without leaving the tenant
          drawer. Reused for both flows — `editingPayment` decides which
          mutation fires and what the header title says. */}
      <Drawer
        title={editingPayment
          ? t('admin.tenants.billing.editPayment', { defaultValue: 'Izmeni uplatu' })
          : t('admin.tenants.billing.addPayment', { defaultValue: 'Dodaj uplatu' })}
        open={paymentDrawerOpen}
        onClose={() => { setPaymentDrawerOpen(false); setEditingPayment(null); }}
        width={Math.min(420, window.innerWidth)}
        extra={
          <Button
            type="primary"
            loading={savePaymentMutation.isPending}
            onClick={() => paymentForm.submit()}
          >
            {t('common:actions.save')}
          </Button>
        }
      >
        <Form
          form={paymentForm}
          layout="vertical"
          onFinish={(values) => savePaymentMutation.mutate(values)}
        >
          <Form.Item name="paidAt" label={t('admin.tenants.billing.paidAt', { defaultValue: 'Datum uplate' })} rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
          </Form.Item>
          <Form.Item name="period" label={t('admin.tenants.billing.period', { defaultValue: 'Period pretplate' })} rules={[{ required: true }]}>
            <DatePicker.RangePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
          </Form.Item>
          <div style={{ display: 'flex', gap: 12 }}>
            <Form.Item name="amount" label={t('admin.tenants.billing.amount', { defaultValue: 'Iznos' })} rules={[{ required: true, type: 'number', min: 0.01 }]} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} min={0.01} step={1} precision={2} />
            </Form.Item>
            <Form.Item name="currency" label={t('admin.tenants.billing.currency', { defaultValue: 'Valuta' })} rules={[{ required: true }]} style={{ width: 100 }}>
              <Input maxLength={8} />
            </Form.Item>
          </div>
          <Form.Item name="invoiceNumber" label={t('admin.tenants.billing.invoiceNumber', { defaultValue: 'Broj fakture' })}>
            <Input maxLength={100} />
          </Form.Item>
          <Form.Item name="notes" label={t('admin.tenants.billing.notes', { defaultValue: 'Napomena' })}>
            <Input.TextArea rows={3} maxLength={2000} />
          </Form.Item>
        </Form>
      </Drawer>

      {/* Block confirmation modal — a separate drawer keeps the reason field
          first-class without crowding the Naplata tab. */}
      <Drawer
        title={t('admin.tenants.billing.block', { defaultValue: 'Blokiraj firmu' })}
        open={blockReasonOpen}
        onClose={() => setBlockReasonOpen(false)}
        width={Math.min(420, window.innerWidth)}
        extra={
          <Button
            danger
            type="primary"
            loading={blockMutation.isPending}
            onClick={() => blockMutation.mutate(blockReason || null)}
          >
            {t('admin.tenants.billing.block', { defaultValue: 'Blokiraj firmu' })}
          </Button>
        }
      >
        <Typography.Paragraph>
          {t('admin.tenants.billing.blockWarning', {
            defaultValue: 'Korisnici ove firme neće moći da se prijave dok ne odblokirate firmu.',
          })}
        </Typography.Paragraph>
        <Form layout="vertical">
          <Form.Item label={t('admin.tenants.billing.blockedReason', { defaultValue: 'Razlog (opciono)' })}>
            <Input.TextArea
              rows={3}
              maxLength={1000}
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder={t('admin.tenants.billing.blockReasonPlaceholder', {
                defaultValue: 'npr. Nije plaćena pretplata za poslednji kvartal',
              })}
            />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
