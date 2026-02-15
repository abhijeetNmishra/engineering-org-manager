
import { processEmployeeRows, BulkUploadRow } from "./src/utils/csvProcessor";
import { ShiptOrgState, Employee, ModuleNode } from "./src/domain/types";

// Mock minimal state
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

import fs from "fs";

const logBuffer: string[] = [];
const log = (msg: string) => {
    console.log(msg);
    logBuffer.push(msg);
};
const error = (msg: string) => {
    console.error(msg);
    logBuffer.push(msg);
};

log("Starting Verification of Strict Submodule Rules...\n");

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

fs.writeFileSync("verification_results.txt", logBuffer.join("\n"));

if (failed > 0) process.exit(1);
