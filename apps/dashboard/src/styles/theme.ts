import { theme as antdTheme, type ThemeConfig } from 'antd';

const sharedTokens = {
  colorPrimary: '#1677ff',
  borderRadius: 6,
};

const sharedComponents: ThemeConfig['components'] = {
  Form: {
    itemMarginBottom: 20,
    verticalLabelPadding: '0 0 4px',
  },
};

export const lightTheme: ThemeConfig = {
  algorithm: antdTheme.defaultAlgorithm,
  token: {
    ...sharedTokens,
    colorBgContainer: '#ffffff',
  },
  components: {
    ...sharedComponents,
    Layout: {
      siderBg: '#001529',
      headerBg: '#ffffff',
    },
  },
};

export const darkTheme: ThemeConfig = {
  algorithm: antdTheme.darkAlgorithm,
  token: sharedTokens,
  components: {
    ...sharedComponents,
    Layout: {
      siderBg: '#000814',
    },
  },
};

export const theme = lightTheme;
