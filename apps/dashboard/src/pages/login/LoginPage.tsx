import { useNavigate, Link, Navigate } from 'react-router-dom';
import { Card, Form, Input, Button, Typography, Alert, theme } from 'antd';
import { UserOutlined, LockOutlined, BankOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useAuthStore } from '@alblue/auth';
import { useTranslation } from '@alblue/i18n';

const { Title } = Typography;

export function LoginPage() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { login, isLoading, error, isAuthenticated } = useAuthStore();
  const { t } = useTranslation('dashboard');
  const { token } = theme.useToken();

  // Already signed in → bounce to role-based landing. Without this, an authed
  // user who manually navigated to /login would just see the form again.
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const onFinish = async (values: { email: string; password: string; tenantCode: string }) => {
    try {
      await login(values.email, values.password, values.tenantCode);
      navigate('/', { replace: true });
    } catch {
      // Error is handled by the store
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
    <Card style={{ width: 400, boxShadow: token.boxShadow }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          {t('login.title')}
        </Title>
        <Typography.Text type="secondary">{t('login.subtitle')}</Typography.Text>
      </div>

      {error && (
        <Alert message={t(`common:errors.${error === 'NOT_FOUND' ? 'INVALID_CREDENTIALS' : error}`, { defaultValue: '' }) || t('login.failed')} type="error" showIcon style={{ marginBottom: 16 }} />
      )}

      <Form form={form} onFinish={onFinish} layout="vertical" scrollToFirstError={{ behavior: "smooth", block: "center" }} size="large">
        <Form.Item
          name="tenantCode"
          rules={[{ required: true, message: t('common:validation.enterTenantCode') }]}
        >
          <Input prefix={<BankOutlined />} placeholder={t('login.tenantCode')} />
        </Form.Item>

        <Form.Item
          name="email"
          rules={[
            { required: true, message: t('common:validation.enterEmail') },
            { type: 'email', message: t('common:validation.enterValidEmail') },
          ]}
        >
          <Input prefix={<UserOutlined />} placeholder={t('login.email')} />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[{ required: true, message: t('common:validation.enterPassword') }]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder={t('login.password')} />
        </Form.Item>

        <Form.Item style={{ marginBottom: 8 }}>
          <Button type="primary" htmlType="submit" block loading={isLoading}>
            {t('common:actions.signIn')}
          </Button>
        </Form.Item>
      </Form>
      <div style={{ textAlign: 'center', marginTop: 12 }}>
        <Link to="/about">
          <InfoCircleOutlined /> {t('about.learnMore')}
        </Link>
      </div>
    </Card>
    </div>
  );
}
