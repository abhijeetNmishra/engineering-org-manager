import React, { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import type { Employee, ModuleNode, Ownership, ShiptOrgState } from "../domain/types";
import { mockOrgState } from "../domain/mockData";

const STORAGE_KEY = "shipt-org-manager-state";

type Action =
    | { type: "RESET_DEMO" }
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
        case "RESET_DEMO":
            return structuredClone(mockOrgState);

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

// Load state from localStorage
function loadState(): ShiptOrgState {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.error("Failed to load state from localStorage:", error);
    }
    return structuredClone(mockOrgState);
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
    const [state, dispatch] = useReducer(reducer, loadState());

    const employeesById = useMemo(() => new Map(state.employees.map((e) => [e.id, e])), [state.employees]);

    // Auto-save to localStorage whenever state changes
    useEffect(() => {
        saveState(state);
    }, [state]);

    const value = useMemo(() => ({ state, dispatch, employeesById }), [state, dispatch, employeesById]);

    return <OrgStoreContext.Provider value={value}>{children}</OrgStoreContext.Provider>;
}

export function useOrgStore() {
    const ctx = useContext(OrgStoreContext);
    if (!ctx) throw new Error("useOrgStore must be used within OrgStoreProvider");
    return ctx;
}