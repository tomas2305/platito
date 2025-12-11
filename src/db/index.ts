import { PlatitoDB } from './database';

const MAIN_DB_NAME = 'platito_db';
const TEST_DB_NAME = 'platito_db_testing';
const STORAGE_KEY = 'platito_active_db';

const readStoredName = (): string => {
	if (typeof localStorage === 'undefined') return MAIN_DB_NAME;
	const stored = localStorage.getItem(STORAGE_KEY);
	return stored === TEST_DB_NAME ? TEST_DB_NAME : MAIN_DB_NAME;
};

const persistName = (name: string) => {
	try {
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem(STORAGE_KEY, name);
		}
	} catch {
		// ignore persistence errors
	}
};

let activeDbName = readStoredName();
let dbInstance = new PlatitoDB(activeDbName);

export const getDB = (): PlatitoDB => dbInstance;

export const getActiveDatabaseName = (): string => activeDbName;

export const switchDatabase = async (target: 'main' | 'testing'): Promise<string> => {
	const nextName = target === 'testing' ? TEST_DB_NAME : MAIN_DB_NAME;
	if (nextName === activeDbName) return activeDbName;

	dbInstance.close();
	dbInstance = new PlatitoDB(nextName);
	activeDbName = nextName;
	persistName(nextName);
	return activeDbName;
};

export const getDatabaseLabels = () => ({
	main: MAIN_DB_NAME,
	testing: TEST_DB_NAME,
});

export { PlatitoDB } from './database';
export type { Account, Category, Tag, Transaction, AppSettings } from '../types';

