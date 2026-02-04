import { sql } from '@vercel/postgres';

export { sql };

// Helper to ensure connection is ready
export async function checkConnection() {
  try {
    await sql`SELECT 1`;
    return true;
  } catch (e) {
    console.error('Database connection failed:', e);
    return false;
  }
}
