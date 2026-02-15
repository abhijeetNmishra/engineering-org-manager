import React, { createContext, useContext, useEffect, useMemo, useReducer, useState } from "react";
import { orgApi } from "../utils/orgApi";
import type { Employee, ModuleNode, Ownership, ShiptOrgState } from "../domain/types";
import { AppLoader } from "../components/AppLoader";

const STORAGE_KEY = "shipt-org-manager-state";

// Initial Empty State
const initialOrgState: ShiptOrgState = {
    employees: [],
    modules: [],
    ownership: []
};

type Action =
    | { type: "RESET_EMPLOYEES" }
    | { type: "RESET_MODULES" }
    | { type: "IMPORT_STATE"; payload: ShiptOrgState }
    | { type: "UPDATE_MANAGER"; employeeId: string; managerId?: string }
    | { type: "UPSERT_OWNERSHIP"; moduleId: string; ownerId: string; ownershipType: Ownership["ownershipType"] }
    | { type: "REMOVE_OWNERSHIP"; moduleId: string; ownerId: string }
    | { type: "ADD_EMPLOYEE"; employee: Employee }
    | { type: "UPDATE_EMPLOYEE"; employeeId: string; updates: Partial<Employee> }
    | { type: "DELETE_EMPLOYEE"; employeeId: string }
    | { type: "ADD_MODULE"; module: ModuleNode }
    | { type: "UPDATE_MODULE"; moduleId: string; updates: Partial<ModuleNode> }
    | { type: "DELETE_MODULE"; moduleId: string };

function reducer(state: ShiptOrgState, action: Action): ShiptOrgState {
    switch (action.type) {
        case "RESET_EMPLOYEES":
            return {
                ...state,
                employees: [],
                ownership: [] // Remove ownerships as they depend on employees
            };

        case "RESET_MODULES":
            return {
                ...state,
                modules: [],
                ownership: [] // Remove ownerships as they depend on modules
                // Employees remain but loose their workstream/module associations in UI context
            };

        case "IMPORT_STATE":
            return action.payload;

        case "UPDATE_MANAGER": {
            const employees = state.employees.map((e) =>
                e.id === action.employeeId ? { ...e, managerId: action.managerId || undefined } : e
            );
            return { ...state, employees };
        }

        case "UPSERT_OWNERSHIP": {
            const existingIdx = state.ownership.findIndex(
                (o) => o.moduleId === action.moduleId && o.ownerId === action.ownerId
            );
            const nextOwnership = [...state.ownership];

            if (existingIdx >= 0) {
                nextOwnership[existingIdx] = { ...nextOwnership[existingIdx], ownershipType: action.ownershipType };
            } else {
                nextOwnership.push({ moduleId: action.moduleId, ownerId: action.ownerId, ownershipType: action.ownershipType });
            }

            return { ...state, ownership: nextOwnership };
        }

        case "REMOVE_OWNERSHIP": {
            return {
                ...state,
                ownership: state.ownership.filter((o) => !(o.moduleId === action.moduleId && o.ownerId === action.ownerId)),
            };
        }

        case "ADD_EMPLOYEE": {
            return {
                ...state,
                employees: [...state.employees, action.employee],
            };
        }

        case "UPDATE_EMPLOYEE": {
            const employees = state.employees.map((e) =>
                e.id === action.employeeId ? { ...e, ...action.updates } : e
            );
            return { ...state, employees };
        }

        case "DELETE_EMPLOYEE": {
            // Remove employee and reassign their reports to their manager
            const employee = state.employees.find((e) => e.id === action.employeeId);
            const newManagerId = employee?.managerId;

            const employees = state.employees
                .filter((e) => e.id !== action.employeeId)
                .map((e) => (e.managerId === action.employeeId ? { ...e, managerId: newManagerId } : e));

            // Remove ownership entries
            const ownership = state.ownership.filter((o) => o.ownerId !== action.employeeId);

            return { ...state, employees, ownership };
        }

        case "ADD_MODULE": {
            return {
                ...state,
                modules: [...state.modules, action.module],
            };
        }

        case "UPDATE_MODULE": {
            const modules = state.modules.map((m) =>
                m.id === action.moduleId ? { ...m, ...action.updates } : m
            );
            return { ...state, modules };
        }

        case "DELETE_MODULE": {
            // Remove module and any ownership entries
            const modules = state.modules.filter((m) => m.id !== action.moduleId && m.parentId !== action.moduleId);
            const ownership = state.ownership.filter((o) => o.moduleId !== action.moduleId);
            return { ...state, modules, ownership };
        }

        default:
            return state;
    }
}

// Migration helper for legacy data
function migrateState(state: any): ShiptOrgState {
    if (!state || !state.employees) return state;

    const employees = state.employees.map((e: any) => {
        let updated = { ...e };

        // Migration: workstreams[] -> workstream (string)
        if (Array.isArray(updated.workstreams)) {
            updated.workstream = updated.workstreams[0] || "Unassigned";
            delete updated.workstreams;
        }

        // Migration: primarySkills[] -> primarySkill + secondarySkills[]
        if (Array.isArray(updated.primarySkills)) {
            const primary = updated.primarySkills[0] || "Backend"; // Default if empty
            const secondary = updated.primarySkills.slice(1);
            const existingSec = Array.isArray(updated.secondarySkills) ? updated.secondarySkills : [];

            // Create new object without primarySkills
            const { primarySkills, ...rest } = updated;
            updated = {
                ...rest,
                primarySkill: primary,
                secondarySkills: [...secondary, ...existingSec]
            };
        }
        return updated;
    });

    // Migration: Backfill icons for modules from mock data if missing
    const modules = (state.modules || []).map((m: any) => {
        if (!m.icon) {
            // Keep as is, no fallback available
            return m;
        }
        return m;
    });

    return { ...state, employees, modules };
}

// Load state from localStorage
function loadState(): ShiptOrgState {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return migrateState(JSON.parse(stored));
        }
    } catch (error) {
        console.error("Failed to load state from localStorage:", error);
    }
    return structuredClone(initialOrgState);
}

// Save state to localStorage
function saveState(state: ShiptOrgState) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
        console.error("Failed to save state to localStorage:", error);
    }
}

type Store = {
    state: ShiptOrgState;
    employeesById: Map<string, Employee>;
    dispatch: React.Dispatch<Action>;
};

const OrgStoreContext = createContext<Store | null>(null);

export function OrgStoreProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatchLocal] = useReducer(reducer, initialOrgState); // Start empty
    const [isLoaded, setIsLoaded] = useState(false);

    // Initial load from Server -> LocalStorage -> Mock
    useEffect(() => {
        async function hydrate() {
            try {
                // Try fetching from server first
                const serverState = await orgApi.loadState();
                dispatchLocal({ type: "IMPORT_STATE", payload: serverState });
            } catch (error) {
                console.warn("Backend unavailable, falling back to localStorage", error);
                // Fallback to localStorage
                const localState = loadState();
                if (localState) {
                    dispatchLocal({ type: "IMPORT_STATE", payload: localState });
                }
            } finally {
                setIsLoaded(true);
            }
        }
        hydrate();
    }, []);

    // Sync actions to backend
    const dispatch = async (action: Action) => {
        // 1. Optimistic update
        dispatchLocal(action);

        // 2. Sync to API (fire and forget for MVP)
        try {
            switch (action.type) {
                case "ADD_EMPLOYEE":
                    await orgApi.createEmployee(action.employee);
                    break;
                case "UPDATE_EMPLOYEE":
                case "UPDATE_MANAGER": // Both map to updateEmployee
                    // For UPDATE_MANAGER, we need the full updated employee object from state? 
                    // Actually, the reducer runs first, so 'state' here is STALE (closure).
                    // We need the *new* state. 
                    // For MVP simplicity: Just use the payload if possible, or refetch?
                    // Better: The API expects the full object.
                    // For UPDATE_EMPLOYEE, we can merge updates? No, API takes full object.
                    // We should pass the updated object.
                    // Let's rely on the reducer to have updated it? No, we don't have access to next state here easily.

                    // Workaround for MVP:
                    // Just save the whole state for complex ops, or construct the object.
                    // Let's implement granular sync where easy.
                    if (action.type === "UPDATE_EMPLOYEE") {
                        // We don't have the full new object easily without querying state.
                        // But we can construct it if we had the old one.
                        // Let's punt on perfect optimistic sync for complex updates and just saveState() periodically?
                        // "The system must support ... Update employee"

                        // Let's try to do it right.
                        // Only specific safe actions:
                        const emp = state.employees.find(e => e.id === action.employeeId);
                        if (emp) {
                            await orgApi.updateEmployee({ ...emp, ...action.updates });
                        }
                    } else if (action.type === "UPDATE_MANAGER") {
                        const emp = state.employees.find(e => e.id === action.employeeId);
                        if (emp) {
                            await orgApi.updateEmployee({ ...emp, managerId: action.managerId });
                        }
                    }
                    break;

                case "DELETE_EMPLOYEE":
                    await orgApi.deleteEmployee(action.employeeId);
                    break;

                case "ADD_MODULE":
                    await orgApi.createModule(action.module);
                    break;

                case "UPDATE_MODULE":
                    // Similar issue, need full object.
                    const mod = state.modules.find(m => m.id === action.moduleId);
                    if (mod) {
                        await orgApi.updateModule({ ...mod, ...action.updates });
                    }
                    break;

                case "DELETE_MODULE":
                    await orgApi.deleteModule(action.moduleId);
                    break;

                case "UPSERT_OWNERSHIP": {
                    // Construct expected new ownership (state is stale in this closure)
                    const existIdx = state.ownership.findIndex(
                        o => o.moduleId === action.moduleId && o.ownerId === action.ownerId
                    );
                    const nextOwnership = [...state.ownership];
                    if (existIdx >= 0) {
                        nextOwnership[existIdx] = { ...nextOwnership[existIdx], ownershipType: action.ownershipType };
                    } else {
                        nextOwnership.push({ moduleId: action.moduleId, ownerId: action.ownerId, ownershipType: action.ownershipType });
                    }
                    await orgApi.saveState({ ...state, ownership: nextOwnership });
                    break;
                }

                case "REMOVE_OWNERSHIP": {
                    const filteredOwnership = state.ownership.filter(
                        o => !(o.moduleId === action.moduleId && o.ownerId === action.ownerId)
                    );
                    await orgApi.saveState({ ...state, ownership: filteredOwnership });
                    break;
                }

                case "IMPORT_STATE":
                    // Full state sync
                    await orgApi.saveState(action.payload);
                    break;
                case "RESET_EMPLOYEES":
                    // Reset to empty state for employees/ownership
                    // We need to construct the full new state to save it?
                    // Actually `state` here is stale. But we know what RESET_EMPLOYEES does.
                    // Let's assume the reducer did its job and state will update? 
                    // No, `state` in this closure is OLD.

                    // We need to save the result.
                    // The simplest way is to manually construct what we expect.
                    const resetState = {
                        ...state,
                        employees: [],
                        ownership: []
                    };
                    await orgApi.saveState(resetState);
                    break;
                case "RESET_MODULES":
                    // Reset to empty state for modules/ownership
                    const resetModState = {
                        ...state,
                        modules: [],
                        ownership: []
                    };
                    await orgApi.saveState(resetModState);
                    break;
            }
        } catch (error) {
            console.error("Failed to sync action to backend:", action.type, error);
            // In a real app, show a toast or undo
        }
    };

    const employeesById = useMemo(() => new Map(state.employees.map((e) => [e.id, e])), [state.employees]);

    // Keep localStorage backup as well
    useEffect(() => {
        if (isLoaded) { // Only save after initial load
            saveState(state);
        }
    }, [state, isLoaded]);

    const value = useMemo(() => ({ state, dispatch, employeesById }), [state, employeesById]);

    if (!isLoaded) return <AppLoader />;

    return <OrgStoreContext.Provider value={value}>{children}</OrgStoreContext.Provider>;
}

export function useOrgStore() {
    const ctx = useContext(OrgStoreContext);
    if (!ctx) throw new Error("useOrgStore must be used within OrgStoreProvider");
    return ctx;
}