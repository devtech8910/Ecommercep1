const USERS_URL = process.env.CLOUD_DB_URL || 'https://jsonblob.com/api/jsonBlob/019f9cba-929a-7931-ad23-922a9b668aa9';

export async function resolveAccountUser(request) {
  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  if (/^dtf_token_admin_\d+$/.test(token)) return null;
  const response = await fetch(USERS_URL, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error('Account service is unavailable. Please try again.');
  const users = await response.json();
  if (!Array.isArray(users)) throw new Error('Account service returned invalid user data.');
  return users.find(user => user.token === token && !user.deletionScheduled) || null;
}
