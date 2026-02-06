import { sql } from '@vercel/postgres';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

export async function migrate() {
  try {
    console.log('Running migration: Add icon column to modules table...');
    
    await sql`
      ALTER TABLE modules 
      ADD COLUMN IF NOT EXISTS icon TEXT;
    `;
    
    console.log('Migration successful: icon column added.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
