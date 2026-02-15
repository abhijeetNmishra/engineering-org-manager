// MOCK TYPES to avoid import issues
export type RoleLevel = string;
export type WorkstreamType = "Vertical" | "Horizontal";
export type WorkstreamKey = string;
export type LocationTag = "US" | "Nearshore" | "Offshore";
export type SkillLevel = "Junior" | "Mid" | "Senior" | "Staff" | "Principal";
export type TechnicalSkill = string;
export type ModuleHealth = "Healthy" | "At Risk" | "Critical";
export type ModulePriority = "P0" | "P1" | "P2" | "P3";
export type ModuleEffort = "XS" | "S" | "M" | "L" | "XL";

export interface ModuleNode {
  id: string;
  name: string;
  workstream: WorkstreamKey;
  type: WorkstreamType;
  parentId?: string;
  directorId?: string;
  tags?: string[];
  health?: ModuleHealth;
  priority?: ModulePriority;
  effort?: ModuleEffort;
  dependencies?: string[];
  description?: string;
  icon?: string;
}

export interface Employee {
  id: string;
  name: string;
  title: RoleLevel;
  location: LocationTag;
  managerId?: string;
  workstreams: WorkstreamKey[];
  moduleOwnershipIds: string[];
  notes?: string;
  primarySkill: TechnicalSkill;
  secondarySkills: TechnicalSkill[];
  skillLevel?: SkillLevel;
  tenure?: number;
  email?: string;
  status?: "active" | "on_leave" | "open";
}

export interface Ownership {
  moduleId: string;
  ownerId: string;
  ownershipType: "Primary" | "Secondary" | "Contributor";
}

export interface ShiptOrgState {
  employees: Employee[];
  modules: ModuleNode[];
  ownership: Ownership[];
}

// MOCK DATA
const mockEmployees: Employee[] = [
    { id: '1', name: 'VP Traffic', title: 'VP', location: 'US', workstreams: ['Traffic'], moduleOwnershipIds: [], primarySkill: 'Management', secondarySkills: [] },
    { id: '2', name: 'Director SEO', title: 'Director', location: 'US', managerId: '1', workstreams: ['Traffic'], moduleOwnershipIds: [], primarySkill: 'SEO', secondarySkills: [] },
    { id: '3', name: 'Engineer A', title: 'Engineer', location: 'US', managerId: '2', workstreams: ['Traffic'], moduleOwnershipIds: ['sub-seo'], primarySkill: 'React', secondarySkills: [] }, // Mapped via profile
    { id: '4', name: 'Engineer B', title: 'Engineer', location: 'US', managerId: '2', workstreams: [], moduleOwnershipIds: [], primarySkill: 'Go', secondarySkills: [] }, // NOT mapped, NOT in workstream (should be found by wide search if mapped to submodule)
    { id: '5', name: 'Engineer C', title: 'Engineer', location: 'US', managerId: '2', workstreams: ['Traffic'], moduleOwnershipIds: [], primarySkill: 'React', secondarySkills: [] }, // In workstream, NOT mapped
];

const mockModules: ModuleNode[] = [
    { id: 'traffic', name: 'Traffic', workstream: 'Traffic', type: 'Vertical' },
    { id: 'sub-seo', name: 'SEO', workstream: 'Traffic', type: 'Vertical', parentId: 'traffic' },
    { id: 'sub-paid', name: 'Paid', workstream: 'Traffic', type: 'Vertical', parentId: 'traffic' },
];

const mockOwnership: Ownership[] = [
    { moduleId: 'sub-paid', ownerId: '4', ownershipType: 'Primary' } // Engineer B mapped to Paid via ownership table
];

const mockState: ShiptOrgState = {
    employees: mockEmployees,
    modules: mockModules,
    ownership: mockOwnership
};

// --- LOGIC FROM domain/moduleDeepDive.ts ---

interface OrgTreeNode {
    employee: Employee;
    children: OrgTreeNode[];
}

function buildOrgTree(people: Employee[], scopeIds: Set<string>): OrgTreeNode[] {
    const byId = new Map(people.map(p => [p.id, p]));
    const childrenMap = new Map<string, Employee[]>();
    const roots: Employee[] = [];

    people.forEach(p => {
        const managerId = p.managerId;
        if (!managerId || !scopeIds.has(managerId)) {
            roots.push(p);
        } else {
            const siblings = childrenMap.get(managerId) || [];
            siblings.push(p);
            childrenMap.set(managerId, siblings);
        }
    });

    const visited = new Set<string>();
    function buildNode(employee: Employee): OrgTreeNode {
        if (visited.has(employee.id)) return { employee, children: [] };
        visited.add(employee.id);
        const children = (childrenMap.get(employee.id) || [])
            .map(child => buildNode(child));
        return { employee, children };
    }

    return roots.map(root => buildNode(root));
}

function getModuleDeepDive(state: ShiptOrgState, moduleId: string) {
    const { employees, modules } = state;
    const module = modules.find(m => m.id === moduleId);
    if (!module) return null;

    const submodules = modules
        .filter(m => m.parentId === moduleId)
        .map(m => ({ id: m.id, name: m.name, icon: m.icon }));
    
    const submoduleIds = new Set(submodules.map(s => s.id));

    // REPLICATING THE FIX Logic
    const people = employees.filter(e => {
        if (e.workstreams?.includes(module.workstream)) return true;
        if (e.moduleOwnershipIds?.some(id => submoduleIds.has(id))) return true;
        const ownsSubmodule = state.ownership.some(o => 
            o.ownerId === e.id && submoduleIds.has(o.moduleId)
        );
        if (ownsSubmodule) return true;
        return false;
    });

    const peopleIds = new Set(people.map(p => p.id));
    const orgTree = buildOrgTree(people, peopleIds);

    return { module, submodules, people, orgTree };
}

// --- LOGIC FROM ModuleDeepDiveOverlay.tsx ---

function pruneTree(nodes: OrgTreeNode[], keptIds: Set<string>): OrgTreeNode[] {
    return nodes
        .map(node => {
            const isTarget = keptIds.has(node.employee.id);
            const keptChildren = pruneTree(node.children, keptIds);

            if (isTarget || keptChildren.length > 0) {
                return { ...node, children: keptChildren };
            }
            return null;
        })
        .filter((n): n is OrgTreeNode => n !== null);
}

// --- TEST RUNNER ---

function runTest(submoduleToFilter: string) {
    console.log(`\nTesting Filter: ${submoduleToFilter}`);
    
    const data = getModuleDeepDive(mockState, 'traffic');
    if (!data) { console.error('No data found'); return; }

    console.log(`Total People in View: ${data.people.length}`);
    data.people.forEach(p => console.log(` - ${p.name} (mapped: ${p.moduleOwnershipIds})`));

    // Filter Logic
    const mappedEmployeeIds = new Set<string>();
    mockState.ownership
        .filter(o => o.moduleId === submoduleToFilter)
        .forEach(o => mappedEmployeeIds.add(o.ownerId));

    data.people.forEach(p => {
        if (p.moduleOwnershipIds?.includes(submoduleToFilter)) {
            mappedEmployeeIds.add(p.id);
        }
    });

    console.log(`Mapped IDs: ${Array.from(mappedEmployeeIds)}`);

    const filteredTree = pruneTree(data.orgTree, mappedEmployeeIds);
    
    console.log('Filtered Tree Result:');
    function printTree(nodes: OrgTreeNode[], indent = 0) {
        nodes.forEach(n => {
            console.log(`${' '.repeat(indent)}* ${n.employee.name}`);
            printTree(n.children, indent + 2);
        });
    }
    if (filteredTree.length === 0) console.log('(Empty Tree)');
    else printTree(filteredTree);
}

// Scenarios
// 1. Filter by SEO (Engineer A is mapped via profile)
runTest('sub-seo');

// 2. Filter by Paid (Engineer B is mapped via ownership table, and was NOT in workstream originally)
runTest('sub-paid');

// 3. Filter by Non-Existent
runTest('sub-none');
