import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withAuth } from './middleware/auth.js';

async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // GET /api/employees - List all
    if (req.method === 'GET') {
      const { rows } = await sql`SELECT * FROM employees ORDER BY name ASC`;
      return res.status(200).json(rows);
    }

    // POST /api/employees - Create or Update (if ID matches)
    if (req.method === 'POST') {
      const emp = req.body;
      
      // Basic validation
      if (!emp.id || !emp.name || !emp.title) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      await sql`
        INSERT INTO employees (id, name, title, location, manager_id, workstreams, module_ids, primary_skills, secondary_skills, skill_level, tenure, email, status, notes, updated_at)
        VALUES (
          ${emp.id}, 
          ${emp.name}, 
          ${emp.title}, 
          ${emp.location || 'US'}, 
          ${emp.managerId || null}, 
          ${JSON.stringify(emp.workstreams || [])}, 
          ${JSON.stringify(emp.moduleOwnershipIds || [])}, 
          ${JSON.stringify(emp.primarySkill ? [emp.primarySkill] : [])}, 
          ${JSON.stringify(emp.secondarySkills || [])}, 
          ${emp.skillLevel || null}, 
          ${emp.tenure || null}, 
          ${emp.email || null}, 
          ${emp.status || 'active'}, 
          ${emp.notes || null},
          NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          title = EXCLUDED.title,
          location = EXCLUDED.location,
          manager_id = EXCLUDED.manager_id,
          workstreams = EXCLUDED.workstreams,
          module_ids = EXCLUDED.module_ids,
          primary_skills = EXCLUDED.primary_skills,
          secondary_skills = EXCLUDED.secondary_skills,
          skill_level = EXCLUDED.skill_level,
          tenure = EXCLUDED.tenure,
          email = EXCLUDED.email,
          status = EXCLUDED.status,
          notes = EXCLUDED.notes,
          updated_at = NOW();
      `;
      
      return res.status(200).json({ success: true });
    }

    // DELETE /api/employees - Delete by ID query param
    if (req.method === 'DELETE') {
      const { id } = req.query;
      
      if (!id || Array.isArray(id)) {
        return res.status(400).json({ error: 'Missing employee ID' });
      }

      // Safe delete: Reassign reports to manager first?
      // For MVP: Optional - could just set manager_id to null for reports.
      // Let's implement orphan protection: find manager of to-be-deleted emp
      const { rows: [target] } = await sql`SELECT manager_id FROM employees WHERE id = ${id}`;
      const newManagerId = target?.manager_id || null;

      // Update reports to point to new manager
      await sql`UPDATE employees SET manager_id = ${newManagerId} WHERE manager_id = ${id}`;
      
      // Delete the employee
      await sql`DELETE FROM employees WHERE id = ${id}`;
      
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

export default withAuth(handler);
