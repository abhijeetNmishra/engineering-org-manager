"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_COLORS = exports.SKILL_COLORS = exports.MODULE_COLORS = void 0;
exports.computeSpanOfControl = computeSpanOfControl;
exports.computeOrphanEmployees = computeOrphanEmployees;
exports.computeWorkstreamCoverage = computeWorkstreamCoverage;
exports.severityTagColor = severityTagColor;
exports.computeOrgStats = computeOrgStats;
exports.computeLeaderMetrics = computeLeaderMetrics;
exports.computeModuleSummaries = computeModuleSummaries;
exports.computeTitleDistribution = computeTitleDistribution;
exports.computeSkillDistribution = computeSkillDistribution;
exports.computeSpanDistribution = computeSpanDistribution;
exports.getLeaders = getLeaders;
exports.getModuleColor = getModuleColor;
exports.computeSpanByRole = computeSpanByRole;
exports.computeAttributeComposition = computeAttributeComposition;
exports.getDescendants = getDescendants;
exports.getSkillColor = getSkillColor;
exports.getTitleColor = getTitleColor;
function uniq(arr) {
    return Array.from(new Set(arr));
}
function buildChildrenMap(employees) {
    var _a;
    const children = new Map();
    for (const e of employees) {
        if (!e.managerId)
            continue;
        const arr = (_a = children.get(e.managerId)) !== null && _a !== void 0 ? _a : [];
        arr.push(e);
        children.set(e.managerId, arr);
    }
    return children;
}
function subtreeCount(children, rootId) {
    var _a;
    const kids = (_a = children.get(rootId)) !== null && _a !== void 0 ? _a : [];
    let total = kids.length;
    for (const k of kids)
        total += subtreeCount(children, k.id);
    return total;
}
// Opinionated defaults (tweak to match Shipt norms)
function spanThresholds(title) {
    // Direct report thresholds
    // - VP can run larger span; Directors/SEMs typically tighter
    if (title === "VP")
        return { warnAbove: 10, riskAbove: 14, warnBelow: 3 };
    if (title === "Director")
        return { warnAbove: 8, riskAbove: 10, warnBelow: 3 };
    if (title === "Senior Engineering Manager")
        return { warnAbove: 7, riskAbove: 9, warnBelow: 3 };
    if (title === "Engineering Manager")
        return { warnAbove: 8, riskAbove: 10, warnBelow: 2 };
    // ICs shouldn’t be managers typically; but if they are, be conservative
    return { warnAbove: 6, riskAbove: 8, warnBelow: 1 };
}
function computeSpanOfControl(state) {
    const children = buildChildrenMap(state.employees);
    const leaders = state.employees.filter((e) => { var _a; return ((_a = children.get(e.id)) !== null && _a !== void 0 ? _a : []).length > 0; });
    const rows = leaders.map((l) => {
        var _a;
        const directReports = ((_a = children.get(l.id)) !== null && _a !== void 0 ? _a : []).length;
        const totalReports = subtreeCount(children, l.id);
        const t = spanThresholds(l.title);
        const flags = [];
        let severity = "ok";
        if (directReports >= t.riskAbove) {
            severity = "risk";
            flags.push(`High span: ${directReports} direct reports (risk ≥ ${t.riskAbove})`);
        }
        else if (directReports >= t.warnAbove) {
            severity = "warn";
            flags.push(`High span: ${directReports} direct reports (warn ≥ ${t.warnAbove})`);
        }
        if (directReports > 0 && directReports <= t.warnBelow) {
            // Low span can be a signal of layer bloat or mis-leveling
            // Don’t mark VP as risk for low span; just warn.
            if (severity === "ok")
                severity = "warn";
            flags.push(`Low span: ${directReports} direct reports (≤ ${t.warnBelow})`);
        }
        // Titles that usually indicate people management
        const isExpectedManager = l.title === "VP" ||
            l.title === "Director" ||
            l.title === "Senior Engineering Manager" ||
            l.title === "Engineering Manager";
        if (!isExpectedManager) {
            if (severity === "ok")
                severity = "warn";
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
    const sevRank = { risk: 2, warn: 1, ok: 0 };
    return rows.sort((a, b) => sevRank[b.severity] - sevRank[a.severity] || b.directReports - a.directReports);
}
function computeOrphanEmployees(state) {
    const ids = new Set(state.employees.map((e) => e.id));
    return state.employees.filter((e) => e.managerId && !ids.has(e.managerId));
}
function computeWorkstreamCoverage(state) {
    const allWorkstreams = uniq(state.modules.map((m) => m.workstream));
    const ownedSet = new Set(state.ownership.map((o) => o.moduleId));
    const rows = allWorkstreams.map((ws) => {
        const modules = state.modules.filter((m) => m.workstream === ws);
        const moduleCount = modules.length;
        const ownedModules = modules.filter((m) => ownedSet.has(m.id)).length;
        const unownedModules = moduleCount - ownedModules;
        const people = state.employees.filter((e) => e.workstream === ws).length;
        const peoplePerModule = moduleCount === 0 ? 0 : Number((people / moduleCount).toFixed(2));
        const flags = [];
        let severity = "ok";
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
    const sevRank = { risk: 2, warn: 1, ok: 0 };
    return rows.sort((a, b) => sevRank[b.severity] - sevRank[a.severity] || b.modules - a.modules);
}
function severityTagColor(sev) {
    if (sev === "risk")
        return "red";
    if (sev === "warn")
        return "gold";
    return "green";
}
// Color palette for modules (used in charts and badges)
// Color palette for modules (used in charts and badges)
exports.MODULE_COLORS = {
    // Core Workstreams
    "Traffic, Discovery & Growth": "#FF9B26", // Orange
    "Consideration": "#8B5CF6", // Purple
    "Purchase & Post Purchase": "#10B981", // Green
    "MP Engineering": "#3B82F6", // Blue
    "Agentic Experience": "#EC4899", // Pink
    "Foundation": "#6366F1", // Indigo
    // Legacy / Other
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
function isLeader(employees, employeeId) {
    return employees.some(e => e.managerId === employeeId);
}
// Get all direct reports for an employee
function getDirectReports(employees, managerId) {
    return employees.filter(e => e.managerId === managerId);
}
// Compute overall org statistics
function computeOrgStats(state) {
    const { employees, modules } = state;
    // Count by status
    const activeCount = employees.filter(e => e.status !== "on_leave" && e.status !== "open").length;
    const onLeaveCount = employees.filter(e => e.status === "on_leave").length;
    const openCount = employees.filter(e => e.status === "open").length;
    // Count leaders (people with direct reports)
    const leaderIds = new Set();
    employees.forEach(e => {
        if (e.managerId)
            leaderIds.add(e.managerId);
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
function computeLeaderMetrics(state, employeeId) {
    const { employees } = state;
    const children = buildChildrenMap(employees);
    const leader = employees.find(e => e.id === employeeId);
    if (!leader)
        return null;
    const directReports = getDirectReports(employees, employeeId);
    const totalReports = subtreeCount(children, employeeId);
    // Compute title mix from direct reports
    const titleMix = {};
    directReports.forEach(e => {
        const title = e.title;
        titleMix[title] = (titleMix[title] || 0) + 1;
    });
    // Compute skill mix from direct reports
    const skillMix = {};
    directReports.forEach(e => {
        if (e.primarySkill) {
            skillMix[e.primarySkill] = (skillMix[e.primarySkill] || 0) + 1;
        }
    });
    // Find all workstreams touched by this leader's team
    const workstreamsTouched = [...new Set(directReports.map(e => e.workstream || "Unassigned"))];
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
function computeModuleSummaries(state) {
    const { employees, modules, ownership } = state;
    // Group modules by parent (top-level modules)
    const topLevelModules = modules.filter(m => !m.parentId);
    return topLevelModules.map(mod => {
        // Find submodules
        const submodules = modules
            .filter(m => m.parentId === mod.id)
            .map(m => m.name);
        // Find employees assigned to this workstream
        const moduleEmployees = employees.filter(e => e.workstream === mod.workstream);
        // Count ICs vs Leaders
        const leaders = moduleEmployees.filter(e => isLeader(employees, e.id));
        const icCount = moduleEmployees.length - leaders.length;
        // Skill distribution
        const skillDistribution = {};
        moduleEmployees.forEach(e => {
            if (e.primarySkill) {
                skillDistribution[e.primarySkill] = (skillDistribution[e.primarySkill] || 0) + 1;
            }
        });
        // Find owners
        const moduleOwnership = ownership.filter(o => o.moduleId === mod.id);
        const owners = moduleOwnership.map(o => {
            const owner = employees.find(e => e.id === o.ownerId);
            return {
                id: o.ownerId,
                name: (owner === null || owner === void 0 ? void 0 : owner.name) || "Unknown",
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
function computeTitleDistribution(state) {
    const titleCounts = {};
    state.employees.forEach(e => {
        const title = e.title;
        titleCounts[title] = (titleCounts[title] || 0) + 1;
    });
    // Order by engineering hierarchy
    const titleOrder = [
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
function computeSkillDistribution(state) {
    const skillCounts = {};
    state.employees.forEach(e => {
        if (e.primarySkill) {
            skillCounts[e.primarySkill] = (skillCounts[e.primarySkill] || 0) + 1;
        }
    });
    return Object.entries(skillCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
}
// Span of control distribution for histogram
function computeSpanDistribution(state) {
    const spanRows = computeSpanOfControl(state);
    // Group by span count
    const spanCounts = {};
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
function getLeaders(state) {
    const managerIds = new Set(state.employees
        .filter(e => e.managerId)
        .map(e => e.managerId));
    return state.employees.filter(e => managerIds.has(e.id));
}
// Module color helper
function getModuleColor(workstream) {
    return exports.MODULE_COLORS[workstream] || "#6B7280";
}
// Compute span of control metrics grouped by role/title
function computeSpanByRole(state) {
    const { employees } = state;
    const leaders = getLeaders(state);
    const children = buildChildrenMap(employees);
    // Group leaders by title
    const leadersByTitle = {};
    leaders.forEach(l => {
        const title = l.title || "Unknown";
        leadersByTitle[title] = (leadersByTitle[title] || []);
        leadersByTitle[title].push(l);
    });
    return Object.entries(leadersByTitle).map(([role, roleLeaders]) => {
        const spans = roleLeaders.map(l => { var _a; return ((_a = children.get(l.id)) !== null && _a !== void 0 ? _a : []).length; });
        const totalReports = roleLeaders.reduce((sum, l) => sum + subtreeCount(children, l.id), 0);
        const minSpan = Math.min(...spans);
        const maxSpan = Math.max(...spans);
        const avgSpan = spans.reduce((a, b) => a + b, 0) / spans.length;
        return {
            role,
            leaderCount: roleLeaders.length,
            avgSpan: Math.round(avgSpan * 10) / 10,
            minSpan,
            maxSpan,
            totalReports
        };
    }).sort((a, b) => b.avgSpan - a.avgSpan);
}
// Generic composition metric (e.g. by Skill, Location, Status)
function computeAttributeComposition(state, attribute, colorMap) {
    const { employees } = state;
    const total = employees.length;
    if (total === 0)
        return [];
    const counts = {};
    employees.forEach(e => {
        let val = e[attribute];
        // Handle array attributes (take first or treat as group?)
        // PRD implies "distinct value of a chosen attribute". 
        // For arrays like workstreams, usually we want "Primary" or specific handling.
        // For now, assume scalar or take first if array (e.g. primarySkill).
        if (Array.isArray(val)) {
            val = val[0];
        }
        const label = val || "Unknown";
        counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts)
        .map(([label, count]) => ({
        label,
        count,
        percentage: Math.round((count / total) * 100),
        color: colorMap ? colorMap[label] : undefined
    }))
        .sort((a, b) => b.count - a.count);
}
// ============================================
// HIERARCHY HELPERS
// ============================================
function getDescendants(state, rootId) {
    const childrenMap = buildChildrenMap(state.employees);
    const descendants = [];
    function traverse(currentId) {
        var _a;
        const kids = (_a = childrenMap.get(currentId)) !== null && _a !== void 0 ? _a : [];
        for (const kid of kids) {
            descendants.push(kid);
            traverse(kid.id);
        }
    }
    traverse(rootId);
    return descendants;
}
// ============================================
// SEMANTIC COLOR HELPERS
// ============================================
exports.SKILL_COLORS = {
    // Backend / Core
    "Go": "#10B981", // Emerald
    "Python": "#34D399",
    "Java": "#059669",
    "Ruby": "#D946EF", // Fuchsia
    "Backend": "#10B981",
    "Backend - Search": "#059669",
    // Frontend
    "React": "#3B82F6", // Blue
    "TypeScript": "#60A5FA",
    "JavaScript": "#93C5FD",
    "Mobile": "#F59E0B", // Amber
    "iOS": "#FBBF24",
    "Android": "#F59E0B",
    "Frontend - Web": "#3B82F6",
    "Frontend - App": "#60A5FA",
    "Frontend - All": "#2563EB",
    // Data / AI
    "Data Science": "#8B5CF6", // Violet
    "Machine Learning": "#7C3AED",
    "ML Engineering": "#8B5CF6",
    "SQL": "#A78BFA",
    // Product/Design/Leadership
    "Product": "#EC4899", // Pink
    "Design": "#F472B6",
    "Leadership": "#7C3AED",
    // Default for others
    "Unknown": "#9CA3AF"
};
exports.ROLE_COLORS = {
    // Executive / Leadership
    "VP Of Engineering": "#7C3AED", // Deep Violet
    "Director Of Engineering": "#8B5CF6",
    "Senior Engineering Manager": "#EC4899", // Pink
    "Engineering Manager": "#F472B6",
    // Technical Leadership (IC)
    "Senior Principal Engineer - Frontend": "#D97706", // Deep Amber
    "Senior Principal Engineer - Backend + AI": "#D97706",
    "Principal Engineer": "#F59E0B", // Amber (Gold)
    "Staff Engineer": "#FBBF24",
    "Staff Machine Learning Engineer": "#FBBF24",
    // Senior ICs
    "Senior Engineer": "#10B981", // Emerald
    "Senior Machine Learning Engineer": "#10B981",
    // ICs
    "Engineer": "#34D399",
    "Machine Learning Engineer": "#34D399",
    "Associate Engineer": "#6EE7B7",
    "Associate": "#6EE7B7",
    // Contractors / Other
    "Contractor": "#9CA3AF", // Gray
    "Unknown": "#6B7280"
};
function getSkillColor(skill) {
    return exports.SKILL_COLORS[skill] || "#9CA3AF";
}
function getTitleColor(title) {
    return exports.ROLE_COLORS[title] || "#6B7280";
}
