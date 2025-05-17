import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../utils/test-utils';
import RegisterForm from '@features/auth/components/RegisterForm';
import { useAuth } from '@common/hooks/useAuth';

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

describe('RegisterForm Component', () => {
  const mockRegister = jest.fn();
  const mockClearError = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    // useAuthのデフォルトの戻り値を設定
    (useAuth as jest.Mock).mockReturnValue({
      register: mockRegister,
      error: null,
      clearError: mockClearError,
      isLoading: false,
    });
  });
  
  it('正しいフォーム要素を表示する', () => {
    render(<RegisterForm />);
    
    // 氏名入力欄
    expect(screen.getByLabelText(/氏名/i)).toBeInTheDocument();
    
    // メールアドレス入力欄
    expect(screen.getByLabelText(/メールアドレス/i)).toBeInTheDocument();
    
    // パスワード入力欄
    expect(screen.getByLabelText('パスワード')).toBeInTheDocument();
    
    // 確認用パスワード入力欄
    expect(screen.getByLabelText(/パスワード（確認）/i)).toBeInTheDocument();
    
    // 会社名入力欄
    expect(screen.getByLabelText(/会社名/i)).toBeInTheDocument();
    
    // 登録ボタン
    expect(screen.getByRole('button', { name: /アカウント登録/i })).toBeInTheDocument();
    
    // ログインリンク
    expect(screen.getByText(/既にアカウントをお持ちの方は/i)).toBeInTheDocument();
    expect(screen.getByText(/こちら/i)).toHaveAttribute('href', '/login');
  });
  
  it('入力フィールドに値を入力できる', () => {
    render(<RegisterForm />);
    
    const nameInput = screen.getByLabelText(/氏名/i);
    const emailInput = screen.getByLabelText(/メールアドレス/i);
    const passwordInput = screen.getByLabelText('パスワード');
    const confirmPasswordInput = screen.getByLabelText(/パスワード（確認）/i);
    const organizationNameInput = screen.getByLabelText(/会社名/i);
    
    // 氏名を入力
    fireEvent.change(nameInput, { target: { value: 'テストユーザー' } });
    expect(nameInput).toHaveValue('テストユーザー');
    
    // メールアドレスを入力
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    expect(emailInput).toHaveValue('test@example.com');
    
    // パスワードを入力
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    expect(passwordInput).toHaveValue('password123');
    
    // 確認用パスワードを入力
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    expect(confirmPasswordInput).toHaveValue('password123');
    
    // 会社名を入力
    fireEvent.change(organizationNameInput, { target: { value: 'テスト株式会社' } });
    expect(organizationNameInput).toHaveValue('テスト株式会社');
  });
  
  it('バリデーションエラーを表示する', async () => {
    render(<RegisterForm />);
    
    const registerButton = screen.getByRole('button', { name: /アカウント登録/i });
    
    // 空の状態でフォームを送信
    fireEvent.click(registerButton);
    
    // バリデーションエラーメッセージを確認
    expect(await screen.findByText(/氏名を入力してください/i)).toBeInTheDocument();
    expect(await screen.findByText(/メールアドレスを入力してください/i)).toBeInTheDocument();
    expect(await screen.findByText(/パスワードを入力してください/i)).toBeInTheDocument();
    expect(await screen.findByText(/パスワード（確認）を入力してください/i)).toBeInTheDocument();
    expect(await screen.findByText(/会社名を入力してください/i)).toBeInTheDocument();
    
    // 不一致のパスワードを入力
    const nameInput = screen.getByLabelText(/氏名/i);
    const emailInput = screen.getByLabelText(/メールアドレス/i);
    const passwordInput = screen.getByLabelText('パスワード');
    const confirmPasswordInput = screen.getByLabelText(/パスワード（確認）/i);
    const organizationNameInput = screen.getByLabelText(/会社名/i);
    
    fireEvent.change(nameInput, { target: { value: 'テストユーザー' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'different-password' } });
    fireEvent.change(organizationNameInput, { target: { value: 'テスト株式会社' } });
    
    fireEvent.click(registerButton);
    
    // パスワード不一致のエラーメッセージ
    expect(await screen.findByText(/パスワードが一致しません/i)).toBeInTheDocument();
  });
  
  it('有効なフォーム送信時に登録処理を呼び出す', async () => {
    render(<RegisterForm />);
    
    const nameInput = screen.getByLabelText(/氏名/i);
    const emailInput = screen.getByLabelText(/メールアドレス/i);
    const passwordInput = screen.getByLabelText('パスワード');
    const confirmPasswordInput = screen.getByLabelText(/パスワード（確認）/i);
    const organizationNameInput = screen.getByLabelText(/会社名/i);
    const registerButton = screen.getByRole('button', { name: /アカウント登録/i });
    
    // 有効な入力値を設定
    fireEvent.change(nameInput, { target: { value: 'テストユーザー' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    fireEvent.change(organizationNameInput, { target: { value: 'テスト株式会社' } });
    
    // フォームを送信
    fireEvent.click(registerButton);
    
    // 登録関数が正しいパラメータで呼び出されたことを確認
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith('テストユーザー', 'test@example.com', 'password123', 'テスト株式会社');
    });
    
    // 登録成功後にナビゲートされることを確認（ダミーのresolveを追加）
    mockRegister.mockResolvedValue({});
    fireEvent.click(registerButton);
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });
  
  it('認証エラーが表示される', () => {
    const errorMessage = '登録に失敗しました。入力内容を確認してください。';
    
    // エラーがある状態をモック
    (useAuth as jest.Mock).mockReturnValue({
      register: mockRegister,
      error: errorMessage,
      clearError: mockClearError,
      isLoading: false,
    });
    
    render(<RegisterForm />);
    
    // エラーメッセージが表示されていることを確認
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });
  
  it('パスワード表示切り替えが機能する', () => {
    render(<RegisterForm />);
    
    const passwordInput = screen.getByLabelText('パスワード');
    const confirmPasswordInput = screen.getByLabelText(/パスワード（確認）/i);
    const visibilityToggles = screen.getAllByLabelText(/パスワードの表示切り替え/i);
    
    // パスワード表示の切り替え
    expect(passwordInput).toHaveAttribute('type', 'password');
    fireEvent.click(visibilityToggles[0]);
    expect(passwordInput).toHaveAttribute('type', 'text');
    
    // 確認用パスワード表示の切り替え
    expect(confirmPasswordInput).toHaveAttribute('type', 'password');
    fireEvent.click(visibilityToggles[1]);
    expect(confirmPasswordInput).toHaveAttribute('type', 'text');
  });
});