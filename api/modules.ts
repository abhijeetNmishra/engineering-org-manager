import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // GET /api/modules - List all
    if (req.method === 'GET') {
      const { rows } = await sql`SELECT * FROM modules ORDER BY name ASC`;
      return res.status(200).json(rows);
    }

    // POST /api/modules - Create or Update
    if (req.method === 'POST') {
      const mod = req.body;
      
      await sql`
        INSERT INTO modules (id, name, workstream, type, parent_id, director_id, tags, health, priority, effort, dependencies, description, icon)
        VALUES (
          ${mod.id},
          ${mod.name},
          ${mod.workstream},
          ${mod.type},
          ${mod.parentId || null},
          ${mod.directorId || null},
          ${JSON.stringify(mod.tags || [])},
          ${mod.health || null},
          ${mod.priority || null},
          ${mod.effort || null},
          ${JSON.stringify(mod.dependencies || [])},
          ${mod.description || null},
          ${mod.icon || null}
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          workstream = EXCLUDED.workstream,
          type = EXCLUDED.type,
          parent_id = EXCLUDED.parent_id,
          director_id = EXCLUDED.director_id,
          tags = EXCLUDED.tags,
          health = EXCLUDED.health,
          priority = EXCLUDED.priority,
          effort = EXCLUDED.effort,
          dependencies = EXCLUDED.dependencies,
          description = EXCLUDED.description,
          icon = EXCLUDED.icon;
      `;
      
      return res.status(200).json({ success: true });
    }

    // DELETE /api/modules
    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id || Array.isArray(id)) return res.status(400).json({ error: 'Missing ID' });

      await sql`DELETE FROM modules WHERE id = ${id}`;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
