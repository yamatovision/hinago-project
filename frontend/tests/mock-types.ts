export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user';
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  USER = 'user',
}

export interface AuthResponse {
  user: User;
  token: {
    token: string;
    refreshToken: string;
    expiresAt: string;
  };
}