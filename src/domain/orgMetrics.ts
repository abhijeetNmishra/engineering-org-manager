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