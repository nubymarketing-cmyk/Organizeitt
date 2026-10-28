import type { UserRole } from '../types/database';

export function isStaffRole(role: UserRole): boolean {
  return role === 'agency_admin' || role === 'agency_member';
}
