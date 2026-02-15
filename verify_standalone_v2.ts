
import fs from "fs";

// --- MOCK TYPES ---
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
  tags?: string[];
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

export interface BulkUploadRow {
    "Full Name": string;
    "Email": string;
    "Role": string;
    "Primary Skill": string;
    "Workstream": string;
    "Status"?: string;
    "Reports To"?: string;
    "Location"?: string;
    "Tenure"?: string;
    "Secondary Skills"?: string;
    "Submodules"?: string;
    "Notes"?: string;
}

export interface ProcessResult {
    newState: ShiptOrgState;
    logs: { type: "success" | "warning" | "error"; message: string }[];
    createdCount: number;
    updatedCount: number;
}

// --- COPIED LOGIC FROM src/utils/csvProcessor.ts ---

function processEmployeeRows(
    rows: BulkUploadRow[],
    currentState: ShiptOrgState
): ProcessResult {
    const logs: { type: "success" | "warning" | "error"; message: string }[] = [];
    let updatedCount = 0;
    let createdCount = 0;

    // Clone state for mutation
    const nextEmployees = [...currentState.employees];
    const nextModules = [...currentState.modules];
    const emailToIdMap = new Map<string, string>();

    // Build email map from existing
    nextEmployees.forEach(e => {
        if (e.email) emailToIdMap.set(e.email.toLowerCase(), e.id);
    });

    // 2. Process Structure (Workstreams & Submodules)
    const workstreamMap = new Map<string, string>(); // Name -> ID

    // Index existing modules (workstreams = top-level modules without parentId)
    nextModules.forEach(m => {
        if (!m.parentId) {
            workstreamMap.set(m.name, m.id);
        }
    });

    rows.forEach((row) => {
        // Normalize inputs
        const workstreamName = row["Workstream"]?.trim();
        const submodulesStr = row["Submodules"]?.trim();

        if (!workstreamName) return;

        // Ensure Workstream Module Exists
        if (!workstreamMap.has(workstreamName)) {
            const newId = `ws-${workstreamName.toLowerCase().replace(/\s+/g, '-')}`;
            const newModule: ModuleNode = {
                id: newId,
                name: workstreamName,
                workstream: workstreamName, // It defines itself
                type: "Vertical", // Default to Vertical
                tags: ["Imported"],
                icon: "folder" // Default icon
            };
            nextModules.push(newModule);
            workstreamMap.set(workstreamName, newId);
            logs.push({ type: "success", message: `Created new Workstream: ${workstreamName}` });
        }

        const workstreamId = workstreamMap.get(workstreamName)!;

        // Ensure Submodules Exist
        if (submodulesStr) {
            const subs = submodulesStr.split(",").map(s => s.trim()).filter(Boolean);
            subs.forEach(subName => {
                // Check if exists under this parent
                const exists = nextModules.some(m => m.name === subName && m.parentId === workstreamId);
                if (!exists) {
                    const subId = `mod-${subName.toLowerCase().replace(/\s+/g, '-')}-${Math.random().toString(36).substr(2, 4)}`;
                    nextModules.push({
                        id: subId,
                        name: subName,
                        workstream: workstreamName,
                        parentId: workstreamId,
                        type: "Vertical", // Inherit
                        tags: ["Imported"]
                    });
                }
            });
        }
    });

    // 3. Process People Upsert & ID Resolution
    const upsertMap = new Map<string, Employee>(); // Email -> Employee Object
    const emailToManagerEmail = new Map<string, string>(); // Email -> Manager Email
    const newOwnership: Ownership[] = [...(currentState.ownership || [])];

    rows.forEach(row => {
        const email = row["Email"]?.trim().toLowerCase();
        if (!email) return;

        const existingId = emailToIdMap.get(email);
        const id = existingId || `emp-${Math.random().toString(36).substr(2, 9)}`;

        // Map the intent
        if (row["Reports To"]) {
            emailToManagerEmail.set(email, row["Reports To"].trim().toLowerCase());
        }

        // Find existing object to preserve fields
        const existingEmp = nextEmployees.find(e => e.id === existingId);

        // Default baseline if new
        const baseEmp: Partial<Employee> = existingEmp || {
            id,
            moduleOwnershipIds: [],
            workstreams: [],
            secondarySkills: []
        };

        const statusRaw = row["Status"]?.toLowerCase();
        let status: "active" | "on_leave" | "open" = "active";
        if (statusRaw === "open") status = "open";
        else if (statusRaw?.includes("leave")) status = "on_leave";

        const name = row["Full Name"]?.trim() || baseEmp.name || "Unknown";
        const title = row["Role"]?.trim() || baseEmp.title || "Contributor";
        const primarySkill = row["Primary Skill"]?.trim() || baseEmp.primarySkill || "Generalist";
        const location = (row["Location"]?.trim() as any) || baseEmp.location || "US";
        const tenure = row["Tenure"] ? parseInt(row["Tenure"]) : baseEmp.tenure || 0;
        const secondarySkills = row["Secondary Skills"]?.split(",").map(s => s.trim()).filter(Boolean) || baseEmp.secondarySkills || [];
        const notes = row["Notes"]?.trim() || baseEmp.notes;
        const workstreams = row["Workstream"] ? [row["Workstream"].trim()] : (baseEmp.workstreams || []);

        // Resolve submodule names -> IDs using strict hierarchy
        const submodulesStr = row["Submodules"]?.trim();
        const workstreamName = row["Workstream"]?.trim();
        const workstreamId = workstreamName ? workstreamMap.get(workstreamName) : undefined;
        let resolvedSubmoduleIds: string[] = baseEmp.moduleOwnershipIds || [];

        // 2. Enforce Role-Based Rules
        // targeted roles: Manager, Director, VP, Head, Lead, Principal, Staff, Distinguished
        const allowMultipleSubmodules = /Manager|Director|Principal|VP|Head|Lead|Staff|Distinguished/i.test(title);

        if (submodulesStr && workstreamId) {
            const subNames = submodulesStr.split(",").map(s => s.trim()).filter(Boolean);

            // 1. Resolve to IDs (validating hierarchy)
            const validSubmoduleIds: string[] = [];
            subNames.forEach(subName => {
                const mod = nextModules.find(m => m.name === subName && m.parentId === workstreamId);
                if (mod) {
                    validSubmoduleIds.push(mod.id);
                } else {
                    logs.push({ type: "warning", message: `Submodule "${subName}" not found under workstream "${workstreamName}" for ${name}. Skipped.` });
                }
            });

            if (allowMultipleSubmodules) {
                // Leaders & Senior ICs can have multiple
                resolvedSubmoduleIds = validSubmoduleIds;
            } else {
                // Standard ICs must have exactly one
                if (validSubmoduleIds.length === 0) {
                    logs.push({ type: "warning", message: `IC ${name} has no valid submodules. Mapped to Workstream only (Unassigned).` });
                    resolvedSubmoduleIds = [];
                } else if (validSubmoduleIds.length > 1) {
                    logs.push({ type: "warning", message: `IC ${name} has ${validSubmoduleIds.length} submodules. Strict rule: Standard ICs get 1. Using first found.` });
                    resolvedSubmoduleIds = [validSubmoduleIds[0]];
                } else {
                    resolvedSubmoduleIds = validSubmoduleIds;
                }
            }

            // Create ownership records
            resolvedSubmoduleIds.forEach(modId => {
                const alreadyExists = newOwnership.some(o => o.moduleId === modId && o.ownerId === id);
                if (!alreadyExists) {
                    newOwnership.push({ moduleId: modId, ownerId: id, ownershipType: allowMultipleSubmodules ? "Primary" : "Contributor" });
                }
            });
        } else if (!allowMultipleSubmodules && workstreamId && (!submodulesStr || submodulesStr.length === 0)) {
            // IC with NO submodule string at all
            logs.push({ type: "warning", message: `IC ${name} has no submodules listed. Mapped to Workstream only (Unassigned).` });
        }

        const newEmp: Employee = {
            id,
            moduleOwnershipIds: resolvedSubmoduleIds,
            managerId: baseEmp.managerId, // Will be updated in validation pass
            email: row["Email"]?.trim(), // Keep original case
            name,
            title,
            primarySkill,
            location,
            status,
            tenure,
            secondarySkills,
            notes,
            workstreams
        };

        if (existingId) updatedCount++;
        else createdCount++;

        upsertMap.set(email, newEmp);

        // Also update the global ID map so subsequent rows (reports) can find this person
        emailToIdMap.set(email, id);
    });

    // 4. Resolve Managers
    upsertMap.forEach((emp, email) => {
        const managerEmail = emailToManagerEmail.get(email);
        if (managerEmail) {
            const managerId = emailToIdMap.get(managerEmail);
            if (managerId) {
                emp.managerId = managerId;
            } else {
                logs.push({ type: "warning", message: `Could not find manager with email: ${managerEmail} for ${emp.name}` });
            }
        }
    });

    // 5. Commit to State
    // Remove old versions of upserted people from nextEmployees
    const finalEmployees = nextEmployees.filter(e => {
        const email = e.email?.toLowerCase();
        return !email || !upsertMap.has(email);
    });

    // Add all from upsertMap
    upsertMap.forEach(emp => finalEmployees.push(emp));

    // Log ownership mapping summary
    const existingOwnershipCount = currentState.ownership?.length || 0;
    const newMappingsCount = newOwnership.length - existingOwnershipCount;
    if (newMappingsCount > 0) {
        logs.push({ type: "success", message: `Created ${newMappingsCount} submodule ownership mapping(s) from the Submodules column.` });
    }

    const newState: ShiptOrgState = {
        ...currentState,
        employees: finalEmployees,
        modules: nextModules,
        ownership: newOwnership
    };

    return { newState, logs, createdCount, updatedCount };
}

// --- TEST CASE RUNNER ---

const mockState: ShiptOrgState = {
    employees: [],
    modules: [
        { id: "ws-eng", name: "Engineering", workstream: "Engineering", type: "Vertical", tags: [] },
        { id: "ws-prod", name: "Product", workstream: "Product", type: "Vertical", tags: [] },
        { id: "mod-platform", name: "Platform", parentId: "ws-eng", workstream: "Engineering", type: "Vertical", tags: [] },
        { id: "mod-arch", name: "Architecture", parentId: "ws-eng", workstream: "Engineering", type: "Vertical", tags: [] },
        { id: "mod-mobile", name: "Mobile", parentId: "ws-eng", workstream: "Engineering", type: "Vertical", tags: [] }
    ],
    ownership: []
};

const testCases: { name: string; row: BulkUploadRow; expectedSubmoduleCount: number; expectedWarning?: string }[] = [
    {
        name: "Director (Leader) - Multiple Submodules",
        row: {
            "Full Name": "Alice Director", "Email": "alice@test.com", "Role": "Director",
            "Workstream": "Engineering", "Submodules": "Platform, Architecture",
            "Primary Skill": "", "Status": "Active"
        },
        expectedSubmoduleCount: 2
    },
    {
        name: "Principal Eng (Senior IC) - Multiple Submodules",
        row: {
            "Full Name": "Bob Principal", "Email": "bob@test.com", "Role": "Principal Engineer",
            "Workstream": "Engineering", "Submodules": "Platform, Architecture",
            "Primary Skill": "", "Status": "Active"
        },
        expectedSubmoduleCount: 2
    },
    {
        name: "Staff Eng (Senior IC) - Multiple Submodules",
        row: {
            "Full Name": "Carol Staff", "Email": "carol@test.com", "Role": "Staff Engineer",
            "Workstream": "Engineering", "Submodules": "Platform, Architecture",
            "Primary Skill": "", "Status": "Active"
        },
        expectedSubmoduleCount: 2
    },
    {
        name: "Distinguished Eng (Senior IC) - Multiple Submodules",
        row: {
            "Full Name": "Dan Distinguished", "Email": "dan@test.com", "Role": "Distinguished Engineer",
            "Workstream": "Engineering", "Submodules": "Platform, Architecture",
            "Primary Skill": "", "Status": "Active"
        },
        expectedSubmoduleCount: 2
    },
    {
        name: "Standard IC - Single Submodule",
        row: {
            "Full Name": "Dave Dev", "Email": "dave@test.com", "Role": "Senior Engineer",
            "Workstream": "Engineering", "Submodules": "Platform",
            "Primary Skill": "", "Status": "Active"
        },
        expectedSubmoduleCount: 1
    },
    {
        name: "Standard IC - Multiple Submodules (Strict Rule Violation)",
        row: {
            "Full Name": "Eve Dev", "Email": "eve@test.com", "Role": "Senior Engineer",
            "Workstream": "Engineering", "Submodules": "Platform, Mobile",
            "Primary Skill": "", "Status": "Active"
        },
        expectedSubmoduleCount: 1, // Should be clamped to 1
        expectedWarning: "Strict rule: Standard ICs get 1"
    },
    {
        name: "Standard IC - No Submodules",
        row: {
            "Full Name": "Frank Dev", "Email": "frank@test.com", "Role": "Engineer II",
            "Workstream": "Engineering", "Submodules": "",
            "Primary Skill": "", "Status": "Active"
        },
        expectedSubmoduleCount: 0,
        expectedWarning: "IC has no submodules listed"
    }
];

const logBuffer: string[] = [];
const log = (msg: string) => {
    console.log(msg);
    logBuffer.push(msg);
};
const error = (msg: string) => {
    console.error(msg);
    logBuffer.push(msg);
};

log("Starting Verification of Strict Submodule Rules (V2 - Standalone)...\n");

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
    log(`Test ${index + 1}: ${test.name}`);
    const result = processEmployeeRows([test.row], mockState);
    const emp = result.newState.employees[0];
    const subCount = emp.moduleOwnershipIds.length;
    
    // Check Count
    let resultPass = subCount === test.expectedSubmoduleCount;
    if (!resultPass) {
        error(`  FAILED Count: Expected ${test.expectedSubmoduleCount}, got ${subCount}`);
    }

    // Check Warning if expected
    if (test.expectedWarning) {
        const hasWarning = result.logs.some(l => l.message.includes(test.expectedWarning!));
        if (!hasWarning) {
             error(`  FAILED Warning: Expected log containing "${test.expectedWarning}", but not found.`);
             resultPass = false;
        }
    }

    if (resultPass) {
        log("  PASSED ✅");
        passed++;
    } else {
        log("  FAILED ❌");
        failed++;
    }
    log("---------------------------------------------------");
});

log(`\nVerification Complete: ${passed} Passed, ${failed} Failed.`);

fs.writeFileSync("verification_results_v2.txt", logBuffer.join("\n"));

if (failed > 0) process.exit(1);
