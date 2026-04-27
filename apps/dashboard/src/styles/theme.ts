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
      triggerBg: '#000c17',
      triggerColor: '#ffffff',
    },
    Menu: {
      darkItemBg: '#001529',
      darkSubMenuItemBg: '#000c17',
      darkItemHoverBg: '#1a3045',
      darkPopupBg: '#001529',
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
      triggerBg: '#000408',
      triggerColor: '#ffffff',
    },
    Menu: {
      darkItemBg: '#000814',
      darkSubMenuItemBg: '#000408',
      darkItemHoverBg: '#0f1f33',
      darkPopupBg: '#000814',
    },
  },
};

export const theme = lightTheme;
