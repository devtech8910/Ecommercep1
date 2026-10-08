import { getAccountUsers } from './account-store.mjs';

export async function resolveAccountUser(request) {
  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  const users = await getAccountUsers();
  return users.find(user => user.token === token && !user.deletionScheduled) || null;
}
