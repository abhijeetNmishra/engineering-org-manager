import type { Employee, ShiptOrgState, WorkstreamKey } from "./types";

export type SpanSeverity = "ok" | "warn" | "risk";

export interface SpanRow {
  leaderId: string;
  leaderName: string;
  leaderTitle: string;
  directReports: number;
  totalReports: number; // full subtree count
  severity: SpanSeverity;
  flags: string[];
}

export interface WorkstreamCoverageRow {
  workstream: WorkstreamKey;
  modules: number;
  ownedModules: number;
  unownedModules: number;
  people: number;
  peoplePerModule: number;
  severity: SpanSeverity;
  flags: string[];
}

function uniq<T>(arr: T[]) {
  return Array.from(new Set(arr));
}

function buildChildrenMap(employees: Employee[]) {
  const children = new Map<string, Employee[]>();
  for (const e of employees) {
    if (!e.managerId) continue;
    const arr = children.get(e.managerId) ?? [];
    arr.push(e);
    children.set(e.managerId, arr);
  }
  return children;
}

function subtreeCount(children: Map<string, Employee[]>, rootId: string): number {
  const kids = children.get(rootId) ?? [];
  let total = kids.length;
  for (const k of kids) total += subtreeCount(children, k.id);
  return total;
}

// Opinionated defaults (tweak to match Shipt norms)
function spanThresholds(title: string) {
  // Direct report thresholds
  // - VP can run larger span; Directors/SEMs typically tighter
  if (title === "VP") return { warnAbove: 10, riskAbove: 14, warnBelow: 3 };
  if (title === "Director") return { warnAbove: 8, riskAbove: 10, warnBelow: 3 };
  if (title === "Senior Engineering Manager") return { warnAbove: 7, riskAbove: 9, warnBelow: 3 };
  if (title === "Engineering Manager") return { warnAbove: 8, riskAbove: 10, warnBelow: 2 };
  // ICs shouldn’t be managers typically; but if they are, be conservative
  return { warnAbove: 6, riskAbove: 8, warnBelow: 1 };
}

export function computeSpanOfControl(state: ShiptOrgState): SpanRow[] {
  const children = buildChildrenMap(state.employees);
  const leaders = state.employees.filter((e) => (children.get(e.id) ?? []).length > 0);

  const rows: SpanRow[] = leaders.map((l) => {
    const directReports = (children.get(l.id) ?? []).length;
    const totalReports = subtreeCount(children, l.id);

    const t = spanThresholds(l.title);
    const flags: string[] = [];
    let severity: SpanSeverity = "ok";

    if (directReports >= t.riskAbove) {
      severity = "risk";
      flags.push(`High span: ${directReports} direct reports (risk ≥ ${t.riskAbove})`);
    } else if (directReports >= t.warnAbove) {
      severity = "warn";
      flags.push(`High span: ${directReports} direct reports (warn ≥ ${t.warnAbove})`);
    }

    if (directReports > 0 && directReports <= t.warnBelow) {
      // Low span can be a signal of layer bloat or mis-leveling
      // Don’t mark VP as risk for low span; just warn.
      if (severity === "ok") severity = "warn";
      flags.push(`Low span: ${directReports} direct reports (≤ ${t.warnBelow})`);
    }

    // Titles that usually indicate people management
    const isExpectedManager =
      l.title === "VP" ||
      l.title === "Director" ||
      l.title === "Senior Engineering Manager" ||
      l.title === "Engineering Manager";

    if (!isExpectedManager) {
      if (severity === "ok") severity = "warn";
      flags.push(`Non-standard manager title: ${l.title}`);
    }

    return {
      leaderId: l.id,
      leaderName: l.name,
      leaderTitle: l.title,
      directReports,
      totalReports,
      severity,
      flags,
    };
  });

  // Order: highest risk first, then span
  const sevRank: Record<SpanSeverity, number> = { risk: 2, warn: 1, ok: 0 };
  return rows.sort((a, b) => sevRank[b.severity] - sevRank[a.severity] || b.directReports - a.directReports);
}

export function computeOrphanEmployees(state: ShiptOrgState) {
  const ids = new Set(state.employees.map((e) => e.id));
  return state.employees.filter((e) => e.managerId && !ids.has(e.managerId));
}

export function computeWorkstreamCoverage(state: ShiptOrgState): WorkstreamCoverageRow[] {
  const allWorkstreams = uniq(state.modules.map((m) => m.workstream)) as WorkstreamKey[];

  const ownedSet = new Set(state.ownership.map((o) => o.moduleId));

  const rows = allWorkstreams.map((ws) => {
    const modules = state.modules.filter((m) => m.workstream === ws);
    const moduleCount = modules.length;

    const ownedModules = modules.filter((m) => ownedSet.has(m.id)).length;
    const unownedModules = moduleCount - ownedModules;

    const people = state.employees.filter((e) => e.workstreams.includes(ws)).length;

    const peoplePerModule = moduleCount === 0 ? 0 : Number((people / moduleCount).toFixed(2));

    const flags: string[] = [];
    let severity: SpanSeverity = "ok";

    if (unownedModules > 0) {
      severity = unownedModules >= 2 ? "risk" : "warn";
      flags.push(`Unowned modules: ${unownedModules}`);
    }

    // Coverage density heuristics
    if (moduleCount > 0 && peoplePerModule < 0.6) {
      // too many modules for too few people
      severity = severity === "ok" ? "warn" : severity;
      flags.push(`Thin coverage: ${peoplePerModule} people/module`);
    }

    if (moduleCount > 0 && peoplePerModule > 2.5) {
      // potentially overstaffed or too broad labeling
      severity = severity === "ok" ? "warn" : severity;
      flags.push(`Dense coverage: ${peoplePerModule} people/module`);
    }

    return {
      workstream: ws,
      modules: moduleCount,
      ownedModules,
      unownedModules,
      people,
      peoplePerModule,
      severity,
      flags,
    };
  });

  const sevRank: Record<SpanSeverity, number> = { risk: 2, warn: 1, ok: 0 };
  return rows.sort((a, b) => sevRank[b.severity] - sevRank[a.severity] || b.modules - a.modules);
}

export function severityTagColor(sev: SpanSeverity) {
  if (sev === "risk") return "red";
  if (sev === "warn") return "gold";
  return "green";
}

// ============================================
// NEW: PRD Intelligence Dashboard Metrics
// ============================================

import type { 
  LeaderMetrics, 
  ModuleSummary, 
  OrgStats, 
  DistributionItem,
  TechnicalSkill,
  RoleLevel 
} from "./types";

// Color palette for modules (used in charts and badges)
export const MODULE_COLORS: Record<string, string> = {
  "Search": "#6B21EF",
  "Browse": "#3B82F6",
  "SEO": "#10B981",
  "Pricing": "#F59E0B",
  "Promo": "#EC4899",
  "Checkout": "#EF4444",
  "Fulfillment": "#8B5CF6",
  "Personalization": "#06B6D4",
  "Platform": "#84CC16",
  "Observability": "#F97316",
};

// Check if employee is a leader (has direct reports)
function isLeader(employees: Employee[], employeeId: string): boolean {
  return employees.some(e => e.managerId === employeeId);
}

// Get all direct reports for an employee
function getDirectReports(employees: Employee[], managerId: string): Employee[] {
  return employees.filter(e => e.managerId === managerId);
}

// Compute overall org statistics
export function computeOrgStats(state: ShiptOrgState): OrgStats {
  const { employees, modules } = state;
  
  // Count by status
  const activeCount = employees.filter(e => e.status !== "on_leave" && e.status !== "open").length;
  const onLeaveCount = employees.filter(e => e.status === "on_leave").length;
  const openCount = employees.filter(e => e.status === "open").length;
  
  // Count leaders (people with direct reports)
  const leaderIds = new Set<string>();
  employees.forEach(e => {
    if (e.managerId) leaderIds.add(e.managerId);
  });
  const leaderCount = leaderIds.size;
  const icCount = employees.length - leaderCount;
  
  // Count modules and submodules
  const parentModules = modules.filter(m => !m.parentId);
  const submodules = modules.filter(m => m.parentId);
  
  // Compute average span of control
  let totalSpan = 0;
  let leaderWithReportsCount = 0;
  leaderIds.forEach(lid => {
    const directs = getDirectReports(employees, lid).length;
    if (directs > 0) {
      totalSpan += directs;
      leaderWithReportsCount++;
    }
  });
  const avgSpanOfControl = leaderWithReportsCount > 0 
    ? Math.round((totalSpan / leaderWithReportsCount) * 10) / 10 
    : 0;
  
  return {
    totalHeadcount: employees.length,
    activeCount,
    onLeaveCount,
    openCount,
    moduleCount: parentModules.length,
    submoduleCount: submodules.length,
    leaderCount,
    icCount,
    avgSpanOfControl,
  };
}

// Compute metrics for a specific leader
export function computeLeaderMetrics(
  state: ShiptOrgState, 
  employeeId: string
): LeaderMetrics | null {
  const { employees } = state;
  const children = buildChildrenMap(employees);
  
  const leader = employees.find(e => e.id === employeeId);
  if (!leader) return null;
  
  const directReports = getDirectReports(employees, employeeId);
  const totalReports = subtreeCount(children, employeeId);
  
  // Compute title mix from direct reports
  const titleMix: Record<string, number> = {};
  directReports.forEach(e => {
    const title = e.title as string;
    titleMix[title] = (titleMix[title] || 0) + 1;
  });
  
  // Compute skill mix from direct reports
  const skillMix: Record<string, number> = {};
  directReports.forEach(e => {
    if (e.primarySkills) {
      e.primarySkills.forEach(skill => {
        skillMix[skill] = (skillMix[skill] || 0) + 1;
      });
    }
  });
  
  // Find all workstreams touched by this leader's team
  const workstreamsTouched = [...new Set(directReports.flatMap(e => e.workstreams || []))];
  
  return {
    employeeId,
    name: leader.name,
    title: leader.title,
    directReports: directReports.length,
    totalReports,
    spanOfControl: directReports.length,
    titleMix,
    skillMix,
    workstreamsTouched,
  };
}

// Compute module summaries for landing page cards
export function computeModuleSummaries(state: ShiptOrgState): ModuleSummary[] {
  const { employees, modules, ownership } = state;
  
  // Group modules by parent (top-level modules)
  const topLevelModules = modules.filter(m => !m.parentId);
  
  return topLevelModules.map(mod => {
    // Find submodules
    const submodules = modules
      .filter(m => m.parentId === mod.id)
      .map(m => m.name);
    
    // Find employees assigned to this workstream
    const moduleEmployees = employees.filter(e => 
      e.workstreams?.includes(mod.workstream)
    );
    
    // Count ICs vs Leaders
    const leaders = moduleEmployees.filter(e => isLeader(employees, e.id));
    const icCount = moduleEmployees.length - leaders.length;
    
    // Skill distribution
    const skillDistribution: Record<string, number> = {};
    moduleEmployees.forEach(e => {
      if (e.primarySkills) {
        e.primarySkills.forEach(skill => {
          skillDistribution[skill] = (skillDistribution[skill] || 0) + 1;
        });
      }
    });
    
    // Find owners
    const moduleOwnership = ownership.filter(o => o.moduleId === mod.id);
    const owners = moduleOwnership.map(o => {
      const owner = employees.find(e => e.id === o.ownerId);
      return {
        id: o.ownerId,
        name: owner?.name || "Unknown",
        type: o.ownershipType,
      };
    });
    
    return {
      moduleId: mod.id,
      moduleName: mod.name,
      workstream: mod.workstream,
      submodules,
      headcount: moduleEmployees.length,
      icCount,
      leaderCount: leaders.length,
      skillDistribution,
      owners,
    };
  });
}

// Title distribution for charts
export function computeTitleDistribution(state: ShiptOrgState): DistributionItem[] {
  const titleCounts: Record<string, number> = {};
  
  state.employees.forEach(e => {
    const title = e.title as string;
    titleCounts[title] = (titleCounts[title] || 0) + 1;
  });
  
  // Order by engineering hierarchy
  const titleOrder: RoleLevel[] = [
    "VP",
    "Director",
    "Senior Principal Engineer",
    "Principal Engineer",
    "Senior Engineering Manager",
    "Engineering Manager",
    "Staff Engineer",
    "Senior Engineer",
    "Engineer",
    "Associate Engineer",
  ];
  
  return titleOrder
    .filter(title => titleCounts[title] > 0)
    .map(title => ({
      name: title,
      value: titleCounts[title],
    }));
}

// Skill distribution for charts
export function computeSkillDistribution(state: ShiptOrgState): DistributionItem[] {
  const skillCounts: Record<string, number> = {};
  
  state.employees.forEach(e => {
    if (e.primarySkills) {
      e.primarySkills.forEach(skill => {
        skillCounts[skill] = (skillCounts[skill] || 0) + 1;
      });
    }
  });
  
  return Object.entries(skillCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

// Span of control distribution for histogram
export function computeSpanDistribution(state: ShiptOrgState): DistributionItem[] {
  const spanRows = computeSpanOfControl(state);
  
  // Group by span count
  const spanCounts: Record<number, number> = {};
  spanRows.forEach(row => {
    const span = row.directReports;
    spanCounts[span] = (spanCounts[span] || 0) + 1;
  });
  
  // Convert to distribution items
  return Object.entries(spanCounts)
    .map(([span, count]) => ({
      name: `${span} reports`,
      value: count,
    }))
    .sort((a, b) => parseInt(a.name) - parseInt(b.name));
}

// Get all leaders (people with direct reports)
export function getLeaders(state: ShiptOrgState): Employee[] {
  const managerIds = new Set(
    state.employees
      .filter(e => e.managerId)
      .map(e => e.managerId!)
  );
  
  return state.employees.filter(e => managerIds.has(e.id));
}

// Module color helper
export function getModuleColor(workstream: string): string {
  return MODULE_COLORS[workstream] || "#6B7280";
}