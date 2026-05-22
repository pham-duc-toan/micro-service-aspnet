import { identityClient } from './axios';
import type { RolePermission } from '@/types';

export async function listRolePermissions(roleId: string): Promise<RolePermission[]> {
  const { data } = await identityClient.get<RolePermission[]>(`/api/permissions/roles/${roleId}`);
  return data;
}

export async function addRolePermission(roleId: string, permission: RolePermission): Promise<void> {
  await identityClient.post(`/api/permissions/roles/${roleId}`, permission);
}

export async function deleteRolePermission(
  roleId: string,
  func: string,
  command: string,
): Promise<void> {
  await identityClient.delete(
    `/api/permissions/roles/${encodeURIComponent(roleId)}/function/${encodeURIComponent(func)}/command/${encodeURIComponent(command)}`,
  );
}

export async function replaceRolePermissions(
  roleId: string,
  permissions: RolePermission[],
): Promise<void> {
  await identityClient.post(`/api/permissions/roles/${roleId}/update-permissions`, permissions);
}
