// Changed from union to string to allow dynamic roles
export type RoleLevel = string;

export type WorkstreamType = "Vertical" | "Horizontal";

// Changed from union to string to allow dynamic creation
export type WorkstreamKey = string;

export type LocationTag = "US" | "Nearshore" | "Offshore";

// NEW: Skill types
export type SkillLevel = "Junior" | "Mid" | "Senior" | "Staff" | "Principal";

// Changed from union to string to allow dynamic creation
export type TechnicalSkill = string;

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
  
  // NEW: Status for active/leave/open tracking
  status?: EmployeeStatus;
}

// NEW: Employee status for tracking availability
export type EmployeeStatus = "active" | "on_leave" | "open";

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

// ============================================
// COMPUTED METRICS (for PRD Intelligence Dashboard)
// ============================================

// Leader-level metrics for insights panel
export interface LeaderMetrics {
  employeeId: string;
  name: string;
  title: string;
  directReports: number;
  totalReports: number;
  spanOfControl: number;
  titleMix: Record<string, number>;  // { "Staff Engineer": 3, "Senior": 5 }
  skillMix: Record<string, number>;  // { "Backend": 4, "Frontend": 4 }
  workstreamsTouched: string[];
}

// Module summary for landing page cards
export interface ModuleSummary {
  moduleId: string;
  moduleName: string;
  workstream: string;
  submodules: string[];
  headcount: number;
  icCount: number;
  leaderCount: number;
  skillDistribution: Record<string, number>;
  owners: { id: string; name: string; type: string }[];
}

// Overall org statistics
export interface OrgStats {
  totalHeadcount: number;
  activeCount: number;
  onLeaveCount: number;
  openCount: number;
  moduleCount: number;
  submoduleCount: number;
  leaderCount: number;
  icCount: number;
  avgSpanOfControl: number;
}

// Distribution type for charts
export interface DistributionItem {
  name: string;
  value: number;
  color?: string;
}