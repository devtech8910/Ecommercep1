const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const bcrypt = require(process.env.CATALOG_BCRYPT_MODULE || 'bcryptjs');
const catalog = require('../js/catalog-seed-data.js');

async function createLocalFlowFixture(password, accounts) {
  const root = path.resolve(__dirname, '..');
  const hash = await bcrypt.hash(password, 10);
  let users = accounts.map(account => ({ ...account, password: hash, token: crypto.randomUUID() }));
  const values = new Map([
    ['devtech-products/catalog.json', catalog.buildCatalog().map(({ imagePrompt, ...product }) => product)],
    ['fashion-company-accounts/users.json', users]
  ]);
  const state = { failWrites: false };
  global.__localFlowBcrypt = bcrypt;
  global.__localFlowStore = options => ({
    get: async key => structuredClone(values.get(options.name + '/' + key) ?? null),
    setJSON: async (key, value) => {
      if (state.failWrites && options.name === 'fashion-company-orders') throw new Error('Test storage is unavailable');
      values.set(options.name + '/' + key, structuredClone(value));
    }
  });
  global.__localFlowAccountUsers = {
    get: async () => structuredClone(values.get('fashion-company-accounts/users.json') || []),
    save: async nextUsers => {
      values.set('fashion-company-accounts/users.json', structuredClone(nextUsers));
      users = structuredClone(nextUsers);
    }
  };
  const instance = crypto.randomUUID();
  const load = code => import('data:text/javascript;base64,' + Buffer.from(code + '\n// ' + instance).toString('base64'));
  let source = await fs.readFile(path.join(root, 'netlify/functions/auth.js'), 'utf8');
  const auth = (await load(source
    .replace("import bcrypt from 'bcryptjs';", 'const bcrypt = global.__localFlowBcrypt;')
    .replace("import { getStore } from '@netlify/blobs';", 'const getStore = global.__localFlowStore;')
    .replace('const DEFAULT_ADMINS = getConfiguredAdmins();', 'const DEFAULT_ADMINS = [];'))).handler;
  source = await fs.readFile(path.join(root, 'netlify/functions/lib/account-session.mjs'), 'utf8');
  const resolveUser = (await load(source.replace("import { getAccountUsers } from './account-store.mjs';", 'const getAccountUsers = global.__localFlowAccountUsers.get;'))).resolveAccountUser;
  global.__localFlowResolve = resolveUser;
  const prepare = source => source
    .replace("import { getStore } from '@netlify/blobs';", 'const getStore = global.__localFlowStore;')
    .replace("import { resolveAccountUser } from './lib/account-session.mjs';", 'const resolveAccountUser = global.__localFlowResolve;');
  source = await fs.readFile(path.join(root, 'netlify/functions/orders.mjs'), 'utf8');
  const orders = (await load(prepare(source))).default;
  source = await fs.readFile(path.join(root, 'netlify/functions/products.mjs'), 'utf8');
  global.__localFlowCatalog = catalog;
  const products = (await load(prepare(source).replace("import catalog from '../../js/catalog-seed-data.js';", 'const catalog = global.__localFlowCatalog;'))).default;
  source = await fs.readFile(path.join(root, 'netlify/functions/banners.mjs'), 'utf8');
  global.__localFlowCampaign = require('../js/banner-defaults.js');
  const banners = (await load(prepare(source).replace("import campaign from '../../js/banner-defaults.js';", 'const campaign = global.__localFlowCampaign;'))).default;
  return { auth, orders, products, banners, resolveUser, values, state, get users() { return users; } };
}
module.exports = { createLocalFlowFixture };
