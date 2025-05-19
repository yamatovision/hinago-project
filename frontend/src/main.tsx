/**
 * アプリケーションエントリーポイント
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';

// アプリケーションのルートDOM要素
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

// Reactアプリケーションをマウント
const root = createRoot(rootElement);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);