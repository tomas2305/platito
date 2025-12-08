import { PlatitoDB } from './database';

export const db = new PlatitoDB();

export { PlatitoDB } from './database';
export type { Account, Category, Tag, Transaction, AppSettings } from '../types';

