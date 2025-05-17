import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../utils/test-utils';
import LoginForm from '@features/auth/components/LoginForm';
import { useAuth } from '@common/hooks/useAuth';
import { MemoryRouter } from 'react-router-dom';

// useAuthフックをモック
jest.mock('@common/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

// useNavigateをモック
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('LoginForm Component', () => {
  const mockLogin = jest.fn();
  const mockClearError = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    // useAuthのデフォルトの戻り値を設定
    (useAuth as jest.Mock).mockReturnValue({
      login: mockLogin,
      error: null,
      clearError: mockClearError,
      isLoading: false,
    });
  });
  
  it('正しいフォーム要素を表示する', () => {
    render(<LoginForm />);
    
    // メールアドレス入力欄
    expect(screen.getByLabelText(/メールアドレス/i)).toBeInTheDocument();
    
    // パスワード入力欄
    expect(screen.getByLabelText(/パスワード/i)).toBeInTheDocument();
    
    // ログイン状態を保持するチェックボックス
    expect(screen.getByLabelText(/ログイン状態を保持する/i)).toBeInTheDocument();
    
    // パスワードをお忘れですか？リンク
    expect(screen.getByText(/パスワードをお忘れですか？/i)).toBeInTheDocument();
    
    // ログインボタン
    expect(screen.getByRole('button', { name: /ログイン/i })).toBeInTheDocument();
    
    // 登録リンク
    expect(screen.getByText(/アカウントをお持ちでない方は/i)).toBeInTheDocument();
    expect(screen.getByText(/こちら/i)).toHaveAttribute('href', '/register');
  });
  
  it('入力フィールドに値を入力できる', () => {
    render(<LoginForm />);
    
    const emailInput = screen.getByLabelText(/メールアドレス/i);
    const passwordInput = screen.getByLabelText(/パスワード/i);
    const rememberMeCheckbox = screen.getByLabelText(/ログイン状態を保持する/i);
    
    // メールアドレスを入力
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    expect(emailInput).toHaveValue('test@example.com');
    
    // パスワードを入力
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    expect(passwordInput).toHaveValue('password123');
    
    // チェックボックスをクリック
    fireEvent.click(rememberMeCheckbox);
    expect(rememberMeCheckbox).toBeChecked();
  });
  
  it('バリデーションエラーを表示する', async () => {
    render(<LoginForm />);
    
    const loginButton = screen.getByRole('button', { name: /ログイン/i });
    
    // 空の状態でフォームを送信
    fireEvent.click(loginButton);
    
    // バリデーションエラーメッセージを確認
    expect(await screen.findByText(/メールアドレスを入力してください/i)).toBeInTheDocument();
    expect(await screen.findByText(/パスワードを入力してください/i)).toBeInTheDocument();
    
    // 無効なメールアドレスを入力
    const emailInput = screen.getByLabelText(/メールアドレス/i);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(loginButton);
    
    // 無効なメールアドレスのバリデーションエラー
    expect(await screen.findByText(/有効なメールアドレスを入力してください/i)).toBeInTheDocument();
    
    // 短すぎるパスワードを入力
    const passwordInput = screen.getByLabelText(/パスワード/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: '12345' } });
    fireEvent.click(loginButton);
    
    // パスワード長のバリデーションエラー
    expect(await screen.findByText(/パスワードは6文字以上で入力してください/i)).toBeInTheDocument();
  });
  
  it('有効なフォーム送信時にログイン処理を呼び出す', async () => {
    render(<LoginForm />);
    
    const emailInput = screen.getByLabelText(/メールアドレス/i);
    const passwordInput = screen.getByLabelText(/パスワード/i);
    const rememberMeCheckbox = screen.getByLabelText(/ログイン状態を保持する/i);
    const loginButton = screen.getByRole('button', { name: /ログイン/i });
    
    // 有効な入力値を設定
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(rememberMeCheckbox);
    
    // フォームを送信
    fireEvent.click(loginButton);
    
    // ログイン関数が正しいパラメータで呼び出されたことを確認
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123', true);
    });
    
    // ログイン成功後にナビゲートされることを確認（ダミーのresolveを追加）
    mockLogin.mockResolvedValue({});
    fireEvent.click(loginButton);
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });
  
  it('認証エラーが表示される', () => {
    const errorMessage = 'ログインに失敗しました。メールアドレスとパスワードを確認してください。';
    
    // エラーがある状態をモック
    (useAuth as jest.Mock).mockReturnValue({
      login: mockLogin,
      error: errorMessage,
      clearError: mockClearError,
      isLoading: false,
    });
    
    render(<LoginForm />);
    
    // エラーメッセージが表示されていることを確認
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });
  
  it('パスワード表示切り替えが機能する', () => {
    render(<LoginForm />);
    
    const passwordInput = screen.getByLabelText(/パスワード/i);
    const visibilityToggle = screen.getByLabelText(/パスワードの表示切り替え/i);
    
    // 初期状態ではパスワードは非表示
    expect(passwordInput).toHaveAttribute('type', 'password');
    
    // 表示切り替えボタンをクリック
    fireEvent.click(visibilityToggle);
    
    // パスワードが表示される
    expect(passwordInput).toHaveAttribute('type', 'text');
    
    // もう一度クリックすると非表示に戻る
    fireEvent.click(visibilityToggle);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });
});