import { useMemo, useState } from "react";
import { Drawer, message } from "antd";
import { useOrgStore } from "../state/orgStore";
import { getLeaders } from "../domain/orgMetrics";
import { EmployeeForm } from "../components/forms/EmployeeForm";
import { PeopleTable } from "../components/people/PeopleTable";
import { PeopleDirectoryHeader } from "../components/people/PeopleDirectoryHeader";
import { EmployeeDetailPanel } from "../components/people/EmployeeDetailPanel";
import type { Employee, WorkstreamKey, TechnicalSkill, LocationTag, EmployeeStatus } from "../domain/types";
import "./PeopleDirectory.css";

// Constants
const AllSkills: TechnicalSkill[] = [
    "Frontend - Web",
    "Frontend - App",
    "Frontend - All",
    "Fullstack",
    "Backend",
    "AI/ML",
    "Backend - Search",
    "DevOps/SRE",
    "Architecture",
    "GraphQL",
    "API Design",
];

const AllLocations: LocationTag[] = ["US", "Nearshore", "Offshore"];

export default function PeopleDirectory() {
    const { state, dispatch } = useOrgStore();

    // Search and filter state
    const [query, setQuery] = useState("");
    const [showLeadersOnly, setShowLeadersOnly] = useState(false);
    const [selectedSkills, setSelectedSkills] = useState<TechnicalSkill[]>([]);
    const [selectedWorkstream, setSelectedWorkstream] = useState<WorkstreamKey | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<EmployeeStatus | null>(null);
    const [selectedLocation, setSelectedLocation] = useState<LocationTag | null>(null);

    // Column Visibility State
    const [visibleColumns, setVisibleColumns] = useState<string[]>([
        'managerId', 'workstream', 'submodules', 'location', 'status'
    ]);

    // Drawer state
    const [selected, setSelected] = useState<Employee | null>(null); // For Edit Form
    const [detailEmployee, setDetailEmployee] = useState<Employee | null>(null); // For Detail Panel
    const [openForm, setOpenForm] = useState(false);
    const [isNew, setIsNew] = useState(false);

    // Get leaders list
    const leaders = useMemo(() => getLeaders(state), [state]);
    const leaderIds = useMemo(() => new Set(leaders.map((l) => l.id)), [leaders]);

    // Workstreams list
    const workstreams = useMemo(() => {
        const ws = Array.from(new Set(state.employees.map((e) => e.workstream || "Unassigned")));
        return ws.sort() as WorkstreamKey[];
    }, [state.employees]);

    // Compute stats
    const stats = useMemo(() => {
        const activeCount = state.employees.filter((e) => (e.status || "active") === "active").length;
        const onLeaveCount = state.employees.filter((e) => e.status === "on_leave").length;
        const openCount = state.employees.filter((e) => e.status === "open").length;
        return {
            total: state.employees.length,
            leaders: leaders.length,
            ics: state.employees.length - leaders.length,
            active: activeCount,
            onLeave: onLeaveCount,
            open: openCount,
        };
    }, [state.employees, leaders]);

    // Filtered employees
    const filtered = useMemo(() => {
        return state.employees.filter((e) => {
            // Text search
            const matchesQuery =
                !query ||
                e.name.toLowerCase().includes(query.toLowerCase()) ||
                e.title.toLowerCase().includes(query.toLowerCase());

            // Leaders only filter
            const matchesLeader = !showLeadersOnly || leaderIds.has(e.id);

            // Skills filter (OR within skills)
            const matchesSkills =
                selectedSkills.length === 0 ||
                selectedSkills.some(
                    (skill) => e.primarySkill === skill || e.secondarySkills?.includes(skill)
                );

            // Workstream filter
            const matchesWorkstream = !selectedWorkstream || e.workstream === selectedWorkstream;

            // Status filter
            const matchesStatus = !selectedStatus || (e.status || "active") === selectedStatus;

            // Location filter
            const matchesLocation = !selectedLocation || e.location === selectedLocation;

            return matchesQuery && matchesLeader && matchesSkills && matchesWorkstream && matchesStatus && matchesLocation;
        });
    }, [state.employees, query, showLeadersOnly, selectedSkills, selectedWorkstream, selectedStatus, selectedLocation, leaderIds]);

    const handleFilterChange = (key: string, value: any) => {
        switch (key) {
            case 'query': setQuery(value); break;
            case 'showLeadersOnly': setShowLeadersOnly(value); break;
            case 'workstream': setSelectedWorkstream(value); break;
            case 'status': setSelectedStatus(value); break;
            case 'skills': setSelectedSkills(value); break;
            case 'location': setSelectedLocation(value); break;
        }
    };

    const clearFilters = () => {
        setQuery("");
        setShowLeadersOnly(false);
        setSelectedSkills([]);
        setSelectedWorkstream(null);
        setSelectedStatus(null);
        setSelectedLocation(null);
    };

    // Toggle Columns
    const handleToggleColumn = (column: string) => {
        setVisibleColumns(prev =>
            prev.includes(column) ? prev.filter(c => c !== column) : [...prev, column]
        );
    };

    // Form submit handler
    const handleSubmit = (employee: Employee) => {
        if (isNew) {
            dispatch({
                type: "ADD_EMPLOYEE",
                employee: employee,
            });
            message.success("Employee added successfully");
        } else {
            dispatch({
                type: "UPDATE_EMPLOYEE",
                employeeId: employee.id,
                updates: employee,
            });
            message.success("Employee updated successfully");
        }
        setOpenForm(false);
        setSelected(null);
        // Also update detail view if open
        if (detailEmployee && detailEmployee.id === employee.id) {
            setDetailEmployee(employee);
        }
    };

    return (
        <div className="people-directory">
            <PeopleDirectoryHeader
                stats={stats}
                filters={{
                    query,
                    showLeadersOnly,
                    workstream: selectedWorkstream,
                    status: selectedStatus,
                    skills: selectedSkills,
                    location: selectedLocation
                }}
                onFilterChange={handleFilterChange}
                onClearFilters={clearFilters}
                onAddPerson={() => {
                    setSelected(null);
                    setIsNew(true);
                    setOpenForm(true);
                }}
                visibleColumns={visibleColumns}
                onToggleColumn={handleToggleColumn}
                options={{
                    workstreams,
                    skills: AllSkills,
                    locations: AllLocations
                }}
            />

            <PeopleTable
                data={filtered}
                onEdit={(emp) => {
                    setSelected(emp);
                    setIsNew(false);
                    setOpenForm(true);
                }}
                onRowClick={(emp) => setDetailEmployee(emp)}
                visibleColumns={visibleColumns}
                options={{
                    workstreams,
                    locations: AllLocations
                }}
            />

            {/* Edit/Add Drawer */}
            <Drawer
                title={isNew ? "Add New Person" : `Edit ${selected?.name}`}
                open={openForm}
                onClose={() => {
                    setOpenForm(false);
                    setSelected(null);
                }}
                width={520}
                footer={null}
            >
                <EmployeeForm
                    initialValues={selected || undefined}
                    onCancel={() => {
                        setOpenForm(false);
                        setSelected(null);
                    }}
                    onSubmit={handleSubmit}
                />
            </Drawer>

            {/* Detail Panel */}
            <EmployeeDetailPanel
                employee={detailEmployee}
                onClose={() => setDetailEmployee(null)}
                onEdit={(emp) => {
                    setDetailEmployee(null); // Close detail
                    setSelected(emp);
                    setIsNew(false);
                    setOpenForm(true); // Open edit form
                }}
            />
        </div>
    );
}