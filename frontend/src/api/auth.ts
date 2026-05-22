import axios from 'axios';
import { identityClient } from './axios';
import type { TokenResponse } from '@/types';

const IDENTITY_URL = import.meta.env.VITE_IDENTITY_URL || 'http://localhost:6011';
const CLIENT_ID = import.meta.env.VITE_CLIENT_ID || 'tedu_microservices_postman';
const CLIENT_SECRET = import.meta.env.VITE_CLIENT_SECRET || 'SuperStrongSecret';
const SCOPE = 'openid profile email roles offline_access tedu_microservices_api.read tedu_microservices_api.write';

export async function login(username: string, password: string): Promise<TokenResponse> {
  const params = new URLSearchParams();
  params.append('grant_type', 'password');
  params.append('client_id', CLIENT_ID);
  params.append('client_secret', CLIENT_SECRET);
  params.append('username', username);
  params.append('password', password);
  params.append('scope', SCOPE);

  const response = await axios.post<TokenResponse>(`${IDENTITY_URL}/connect/token`, params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return response.data;
}

export async function refreshToken(refreshToken: string): Promise<TokenResponse> {
  const params = new URLSearchParams();
  params.append('grant_type', 'refresh_token');
  params.append('client_id', CLIENT_ID);
  params.append('client_secret', CLIENT_SECRET);
  params.append('refresh_token', refreshToken);

  const response = await axios.post<TokenResponse>(`${IDENTITY_URL}/connect/token`, params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return response.data;
}

export interface AccountResponse {
  id?: string;
  userName?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  address?: string;
}

export async function getAccount(): Promise<AccountResponse> {
  const response = await identityClient.get<AccountResponse>('/api/account');
  return response.data;
}
