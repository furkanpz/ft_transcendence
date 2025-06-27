import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { dbPath } from './init'


let db: Database | null = null;

export async function getDb()
{
	if (!db)
		db = await open({
			filename: dbPath,
			driver: sqlite3.Database
		});
	return db;
}