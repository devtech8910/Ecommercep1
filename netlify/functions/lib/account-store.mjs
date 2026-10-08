import { getStore } from '@netlify/blobs';

const STORE_NAME = 'fashion-company-accounts';
const USERS_KEY = 'users.json';

function getAccountStore() {
  const siteID = process.env.NETLIFY_BLOBS_SITE_ID || process.env.NETLIFY_SITE_ID || process.env.SITE_ID;
  const token = process.env.NETLIFY_BLOBS_TOKEN || process.env.NETLIFY_AUTH_TOKEN;
  if (siteID && token) return getStore({ name: STORE_NAME, siteID, token, consistency: 'strong' });
  return getStore({ name: STORE_NAME, consistency: 'strong' });
}

export async function getAccountUsers() {
  const data = await getAccountStore().get(USERS_KEY, { type: 'json', consistency: 'strong' });
  if (data == null) return [];
  if (!Array.isArray(data)) throw new Error('Account storage contains invalid user data.');
  return data;
}

export async function saveAccountUsers(users) {
  if (!Array.isArray(users)) throw new TypeError('Account users must be an array.');
  await getAccountStore().setJSON(USERS_KEY, users);
}
