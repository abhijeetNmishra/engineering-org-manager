import type { Employee, ModuleNode, ShiptOrgState } from "./types";

export interface OrgTreeNode {
    employee: Employee;
    children: OrgTreeNode[];
}

export interface ModuleDeepDiveData {
    module: ModuleNode;
    submodules: { id: string; name: string; icon?: string }[];
    people: Employee[];
    stats: {
        total: number;
        leaders: number;
        ics: number;
    };
    orgTree: OrgTreeNode[];
}

/**
 * Get deep dive data for a module, including scoped org chart
 */
export function getModuleDeepDive(
    state: ShiptOrgState,
    moduleId: string
): ModuleDeepDiveData | null {
    const { employees, modules } = state;

    // Find the module
    const module = modules.find(m => m.id === moduleId);
    if (!module) return null;

    // Find submodules
    const submodules = modules
        .filter(m => m.parentId === moduleId)
        .map(m => ({ id: m.id, name: m.name, icon: m.icon }));

    // Get set of submodule IDs for quick lookup
    const submoduleIds = new Set(submodules.map(s => s.id));

    // Find employees in this workstream OR mapped to its submodules
    const people = employees.filter(e => {
        // 1. Explicit workstream tag
        if (e.workstream === module.workstream) return true;

        // 2. Mapped to a submodule via ownership list (on employee object)
        if (e.moduleOwnershipIds?.some(id => submoduleIds.has(id))) return true;

        // 3. Mapped via global ownership table
        const ownsSubmodule = state.ownership.some(o => 
            o.ownerId === e.id && submoduleIds.has(o.moduleId)
        );
        if (ownsSubmodule) return true;

        return false;
    });

    // Create set of people IDs for quick lookup
    const peopleIds = new Set(people.map(p => p.id));

    // Identify leaders (people with direct reports in this set)
    const leaderIds = new Set<string>();
    people.forEach(p => {
        if (p.managerId && peopleIds.has(p.managerId)) {
            leaderIds.add(p.managerId);
        }
    });

    const leaders = leaderIds.size;
    const ics = people.length - leaders;

    // Build org tree with cycle protection
    const orgTree = buildOrgTree(people, peopleIds);

    return {
        module,
        submodules,
        people,
        stats: {
            total: people.length,
            leaders,
            ics,
        },
        orgTree,
    };
}

export interface SubmoduleFilterResult {
    /** Employee IDs that match the submodule filter */
    matchedIds: Set<string>;
    /** Whether any ownership mapping data exists for this workstream's submodules */
    hasMappingData: boolean;
}

/**
 * Get employees for a specific submodule using strict filtering.
 * 
 * Strategy:
 * - Return ONLY employees explicitly mapped to this submodule.
 * - No fallback to workstream members.
 * - Uses `ownership` table and `moduleOwnershipIds` as source of truth.
 */
export function getSubmoduleEmployees(
    state: ShiptOrgState,
    submoduleId: string,
    workstreamPeople: Employee[]
): SubmoduleFilterResult {
    const { ownership } = state;

    // Strict filtering: find employees explicitly mapped to THIS submodule
    const matchedIds = new Set<string>();

    // Source A: Ownership table (Global SOT)
    ownership
        .filter(o => o.moduleId === submoduleId)
        .forEach(o => matchedIds.add(o.ownerId));

    // Source B: Employee's own module list (Local SOT - for completeness)
    workstreamPeople.forEach(p => {
        const ids = Array.isArray(p.moduleOwnershipIds) ? p.moduleOwnershipIds : [];
        if (ids.includes(submoduleId)) {
            matchedIds.add(p.id);
        }
    });

    const hasMappingData = matchedIds.size > 0;

    return { matchedIds, hasMappingData };
}

/**
 * Build hierarchical org tree from flat list
 * Handles: managers outside scope (treated as roots), cycles
 */
function buildOrgTree(people: Employee[], scopeIds: Set<string>): OrgTreeNode[] {
    const childrenMap = new Map<string, Employee[]>();
    const roots: Employee[] = [];

    // Build children map and identify roots
    people.forEach(p => {
        const managerId = p.managerId;
        
        // Root if: no manager, or manager not in scope
        if (!managerId || !scopeIds.has(managerId)) {
            roots.push(p);
        } else {
            const siblings = childrenMap.get(managerId) || [];
            siblings.push(p);
            childrenMap.set(managerId, siblings);
        }
    });

    // Recursively build tree with cycle protection
    const visited = new Set<string>();

    function buildNode(employee: Employee): OrgTreeNode {
        if (visited.has(employee.id)) {
            // Cycle detected - return leaf node
            return { employee, children: [] };
        }
        visited.add(employee.id);

        const children = (childrenMap.get(employee.id) || [])
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(child => buildNode(child));

        return { employee, children };
    }

    // Sort roots by name
    return roots
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(root => buildNode(root));
}
