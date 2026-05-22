import type { DecodedToken, UserProfile } from '@/types';

function base64UrlDecode(input: string): string {
  const pad = input.length % 4 === 0 ? '' : '='.repeat(4 - (input.length % 4));
  const base64 = (input + pad).replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64);
  try {
    return decodeURIComponent(
      binary
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    );
  } catch {
    return binary;
  }
}

export function decodeJwt(token: string): DecodedToken | null {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    const json = base64UrlDecode(payload);
    return JSON.parse(json) as DecodedToken;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const decoded = decodeJwt(token);
  if (!decoded?.exp) return true;
  return decoded.exp * 1000 < Date.now();
}

function asArray(value?: string | string[]): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export function profileFromToken(token: string): UserProfile | null {
  const decoded = decodeJwt(token);
  if (!decoded) return null;
  const roles = [...asArray(decoded.roles), ...asArray(decoded.role)];
  const userName =
    decoded.user_name || decoded.preferred_username || decoded.name || decoded.email || decoded.sub || '';
  const firstName = decoded.given_name || '';
  const lastName = decoded.family_name || '';
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || userName;
  return {
    id: decoded.sub || '',
    userName,
    email: decoded.email || '',
    firstName,
    lastName,
    fullName,
    roles,
    isAdmin: roles.some((r) => r.toLowerCase() === 'administrator' || r.toLowerCase() === 'admin'),
  };
}
