import { sql } from '@vercel/postgres';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function listModules() {
  try {
    const { rows } = await sql`SELECT id, name, workstream, type, icon FROM modules ORDER BY workstream, name`;
    console.log(JSON.stringify(rows, null, 2));
  } catch (error) {
    console.error(error);
  }
}

listModules();
