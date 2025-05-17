import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { AuthProvider } from '@common/hooks/useAuth';
import theme from '@app/theme';

/**
 * デフォルトのラッパープロバイダー
 */
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          {children}
        </MemoryRouter>
      </ThemeProvider>
    </AuthProvider>
  );
};

/**
 * カスタムレンダー関数
 * ここでデフォルトのプロバイダーやラッパーを設定します
 */
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

// テスト用ユーティリティをre-exportする
export * from '@testing-library/react';
export { customRender as render };