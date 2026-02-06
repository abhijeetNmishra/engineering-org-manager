import { sql } from '@vercel/postgres';

export async function setupDatabase() {
  try {
    // Employees Table
    await sql`
      CREATE TABLE IF NOT EXISTS employees (
        id            TEXT PRIMARY KEY,
        name          TEXT NOT NULL,
        title         TEXT NOT NULL,
        location      TEXT DEFAULT 'US',
        manager_id    TEXT, -- No foreign key initially to avoid circular dependency issues during bulk load
        workstreams   JSONB DEFAULT '[]',
        module_ids    JSONB DEFAULT '[]',
        primary_skills   JSONB DEFAULT '[]',
        secondary_skills JSONB DEFAULT '[]',
        skill_level   TEXT,
        tenure        INTEGER,
        email         TEXT,
        status        TEXT DEFAULT 'active',
        notes         TEXT,
        created_at    TIMESTAMPTZ DEFAULT NOW(),
        updated_at    TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // Modules Table
    await sql`
      CREATE TABLE IF NOT EXISTS modules (
        id          TEXT PRIMARY KEY,
        name        TEXT NOT NULL,
        workstream  TEXT NOT NULL,
        type        TEXT NOT NULL,
        parent_id   TEXT,
        director_id TEXT,
        tags        JSONB DEFAULT '[]',
        health      TEXT,
        priority    TEXT,
        effort      TEXT,
        dependencies JSONB DEFAULT '[]',
        description TEXT,
        icon        TEXT
      );
    `;

    // Ownership Table
    await sql`
      CREATE TABLE IF NOT EXISTS ownership (
        module_id      TEXT REFERENCES modules(id) ON DELETE CASCADE,
        owner_id       TEXT REFERENCES employees(id) ON DELETE CASCADE,
        ownership_type TEXT NOT NULL,
        PRIMARY KEY (module_id, owner_id)
      );
    `;

    console.log('Database schema initialized successfully');
    return { success: true };
  } catch (error) {
    console.error('Failed to initialize database:', error);
    return { success: false, error };
  }
}

setupDatabase();

