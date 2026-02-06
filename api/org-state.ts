import { sql } from '@vercel/postgres';
import { VercelRequest, VercelResponse } from '@vercel/node';
import type { ShiptOrgState } from '../src/domain/types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // GET /api/org-state - Fetch full state
    if (req.method === 'GET') {
      const [employees, modules, ownership] = await Promise.all([
        sql`SELECT * FROM employees`,
        sql`SELECT * FROM modules`,
        sql`SELECT * FROM ownership`
      ]);

      // Map DB rows to domain types
      const state: ShiptOrgState = {
        employees: employees.rows.map(e => ({
          ...e,
          workstreams: e.workstreams || [],
          moduleOwnershipIds: e.module_ids || [],
          primarySkill: (e.primary_skills && e.primary_skills.length > 0) ? e.primary_skills[0] : null,
          secondarySkills: e.secondary_skills || [],
          // Ensure correct camelCase mapping from DB snake_case if needed
          managerId: e.manager_id,
          skillLevel: e.skill_level,
          tenure: e.tenure,
          email: e.email,
          status: e.status,
          notes: e.notes
        })) as any, 
        modules: modules.rows.map(m => ({
          ...m,
          parentId: m.parent_id,
          directorId: m.director_id,
          tags: m.tags || [],
          dependencies: m.dependencies || [],
          icon: m.icon
        })) as any,
        ownership: ownership.rows.map(o => ({
          moduleId: o.module_id,
          ownerId: o.owner_id,
          ownershipType: o.ownership_type
        })) as any
      };

      return res.status(200).json(state);
    }

    // PUT /api/org-state - Bulk Replace (for Import/Reset)
    if (req.method === 'PUT') {
      const state = req.body as ShiptOrgState;
      
      // Transaction-like approach (though Vercel HTTP is stateless, we can chain queries)
      // 1. Truncate tables
      await sql`TRUNCATE TABLE ownership, modules, employees CASCADE`;

      // 2. Insert Employees
      for (const emp of state.employees) {
        await sql`
          INSERT INTO employees (id, name, title, location, manager_id, workstreams, module_ids, primary_skills, secondary_skills, skill_level, tenure, email, status, notes)
          VALUES (
            ${emp.id}, ${emp.name}, ${emp.title}, ${emp.location}, ${emp.managerId || null},
            ${JSON.stringify(emp.workstreams)}, ${JSON.stringify(emp.moduleOwnershipIds)},
            ${JSON.stringify(emp.primarySkill ? [emp.primarySkill] : [])}, ${JSON.stringify(emp.secondarySkills || [])},
            ${emp.skillLevel || null}, ${emp.tenure || null}, ${emp.email || null},
            ${emp.status || 'active'}, ${emp.notes || null}
          )
        `;
      }

      // 3. Insert Modules
      for (const mod of state.modules) {
        await sql`
          INSERT INTO modules (id, name, workstream, type, parent_id, director_id, tags, health, priority, effort, dependencies, description, icon)
          VALUES (
            ${mod.id}, ${mod.name}, ${mod.workstream}, ${mod.type},
            ${mod.parentId || null}, ${mod.directorId || null},
            ${JSON.stringify(mod.tags || [])}, ${mod.health || null},
            ${mod.priority || null}, ${mod.effort || null},
            ${JSON.stringify(mod.dependencies || [])}, ${mod.description || null},
            ${mod.icon || null}
          )
        `;
      }

      // 4. Insert Ownership
      for (const own of state.ownership) {
        await sql`
          INSERT INTO ownership (module_id, owner_id, ownership_type)
          VALUES (${own.moduleId}, ${own.ownerId}, ${own.ownershipType})
        `;
      }

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
