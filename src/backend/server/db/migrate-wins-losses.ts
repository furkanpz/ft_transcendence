import { getDb } from './db.get';

async function migrateWinsLosses() {
    try {
        const db = await getDb();
        
        const tableInfo = await db.all("PRAGMA table_info(ft_users)");
        const hasWins = tableInfo.some((col: any) => col.name === 'wins');
        const hasLosses = tableInfo.some((col: any) => col.name === 'losses');
        
        if (!hasWins) {
            console.log('Adding wins column...');
            await db.run('ALTER TABLE ft_users ADD COLUMN wins INTEGER DEFAULT 0');
        }
        
        if (!hasLosses) {
            console.log('Adding losses column...');
            await db.run('ALTER TABLE ft_users ADD COLUMN losses INTEGER DEFAULT 0');
        }
        
        console.log('✅ Migration completed successfully');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    }
}

migrateWinsLosses();
