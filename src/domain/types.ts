export type RoleLevel =
  | "VP"
  | "Director"
  | "Senior Principal Engineer"
  | "Principal Engineer"
  | "Senior Engineering Manager"
  | "Engineering Manager"
  | "Staff Engineer"
  | "Senior Engineer"
  | "Engineer"
  | "Associate Engineer";

export type WorkstreamType = "Vertical" | "Horizontal";

export type WorkstreamKey =
  | "Search"
  | "Browse"
  | "SEO"
  | "Pricing"
  | "Promo"
  | "Checkout"
  | "Fulfillment"
  | "Personalization"
  | "Platform"
  | "Observability";

export type LocationTag = "US" | "Nearshore" | "Offshore";

// NEW: Skill types
export type SkillLevel = "Junior" | "Mid" | "Senior" | "Staff" | "Principal";

export type TechnicalSkill =
  | "Frontend - Web"
  | "Frontend - App"
  | "Frontend - All"
  | "Fullstack"
  | "Backend"
  | "AI/ML"
  | "Backend - Search"
  | "DevOps/SRE"
  | "Architecture"
  | "GraphQL"
  | "API Design";

// NEW: Module health types
export type ModuleHealth = "Healthy" | "At Risk" | "Critical";
export type ModulePriority = "P0" | "P1" | "P2" | "P3";
export type ModuleEffort = "XS" | "S" | "M" | "L" | "XL";

export interface ModuleNode {
  id: string;
  name: string;
  workstream: WorkstreamKey;
  type: WorkstreamType;
  parentId?: string;
  directorId?: string; // Director who owns this module
  tags?: string[]; // e.g. "Tier-0", "Revenue", "Customer-Experience"
  
  // NEW: Module health metrics
  health?: ModuleHealth;
  priority?: ModulePriority;
  effort?: ModuleEffort;
  dependencies?: string[]; // Module IDs this depends on
  description?: string;
}

export interface Employee {
  id: string;
  name: string;
  title: RoleLevel;
  location: LocationTag;
  managerId?: string; // reporting line
  workstreams: WorkstreamKey[]; // vertical/horizontal alignment
  moduleOwnershipIds: string[]; // modules they own / co-own
  notes?: string;
  
  // NEW: Skills and career progression
  primarySkills?: TechnicalSkill[];
  secondarySkills?: TechnicalSkill[];
  skillLevel?: SkillLevel;
  tenure?: number; // months at company
  email?: string;
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