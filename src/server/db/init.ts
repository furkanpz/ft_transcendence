import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

export const dbPath = path.join(__dirname, '../../db/database.sqlite');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}


async function initializeDatabase() {
  try {
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    const sql_init = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf-8');
    db.exec(sql_init);
    console.log('DB CREATED');
    await db.close();
  } catch (error) {
    console.error('DB INIT ERROR', error);
  }
}

initializeDatabase();
