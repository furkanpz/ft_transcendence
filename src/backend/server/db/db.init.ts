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
    // Veritabanı zaten varsa, yeniden başlatma
    const dbExists = fs.existsSync(dbPath);
    if (dbExists) {
      console.log('Database already exists, skipping initialization');
      return;
    }

    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    const sql_init = fs.readFileSync(path.join(process.cwd(), 'server/db/init.sql'), 'utf-8');
    db.exec(sql_init);
    console.log('DB CREATED');
    await db.close();
  } catch (error) {
    console.error('DB INIT ERROR', error);
  }
}

initializeDatabase();
