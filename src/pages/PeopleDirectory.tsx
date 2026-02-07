import { useMemo, useState, useEffect } from "react";

import {
    Card,
    Input,
    Select,
    Table,
    Tag,
    Drawer,
    Button,
    Space,
    Popconfirm,
    Badge,
    message,
} from "antd";
import {
    PlusOutlined,
    DeleteOutlined,
    EditOutlined,
    SearchOutlined,
    TeamOutlined,
    UserOutlined,
    CloseCircleOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import type { ColumnsType } from "antd/es/table";
import type {
    Employee,
    WorkstreamKey,
    TechnicalSkill,
    LocationTag,
    EmployeeStatus,
} from "../domain/types";
import { useOrgStore } from "../state/orgStore";
import { computeLeaderMetrics, getLeaders } from "../domain/orgMetrics";
import { EmployeeForm } from "../components/forms/EmployeeForm";
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



// Filter chip component
function FilterChip({
    label,
    active,
    count,
    onClick,
    color,
}: {
    label: string;
    active: boolean;
    count?: number;
    onClick: () => void;
    color?: string;
}) {
    return (
        <motion.button
            className={`filter-chip ${active ? "active" : ""}`}
            onClick={onClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
                background: active ? (color || "#6B21EF") : "var(--card-bg)",
                borderColor: active ? (color || "#6B21EF") : "var(--border-glass)",
                color: active ? "#FFFFFF" : "var(--text-secondary)",
            }}
        >
            {label}
            {count !== undefined && <span className="chip-count">{count}</span>}
        </motion.button>
    );
}

// Quick Stats Row
function QuickStats({
    total,
    leaders,
    ics,
    active,
    onLeave,
    open,
}: {
    total: number;
    leaders: number;
    ics: number;
    active: number;
    onLeave: number;
    open: number;
}) {
    return (
        <div className="quick-stats-bar">
            <div className="stat-item">
                <TeamOutlined />
                <span className="stat-value">{total}</span>
                <span className="stat-label">Total</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
                <UserOutlined />
                <span className="stat-value">{leaders}</span>
                <span className="stat-label">Leaders</span>
            </div>
            <div className="stat-item">
                <UserOutlined />
                <span className="stat-value">{ics}</span>
                <span className="stat-label">ICs</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item status-active">
                <Badge status="success" />
                <span className="stat-value">{active}</span>
                <span className="stat-label">Active</span>
            </div>
            <div className="stat-item status-leave">
                <Badge status="warning" />
                <span className="stat-value">{onLeave}</span>
                <span className="stat-label">On Leave</span>
            </div>
            <div className="stat-item status-open">
                <Badge status="default" />
                <span className="stat-value">{open}</span>
                <span className="stat-label">Open</span>
            </div>
        </div>
    );
}

// Editable Cell Component


// Better EditableRender that manages the switch between View/Edit
function EditableValue({
    value,
    record,
    field,
    type,
    options,
    renderView,
    onSave,
}: {
    value: any;
    record: Employee;
    field: string;
    type: "text" | "select" | "multi-select";
    options?: { label: string; value: string }[];
    renderView: (val: any) => React.ReactNode;
    onSave: (id: string, updates: any) => void;
}) {
    const [editing, setEditing] = useState(false);
    const [tempValue, setTempValue] = useState(value);

    // Sync temp value when prop changes (e.g. from other edits)
    useMemo(() => setTempValue(value), [value]);

    const handleSave = () => {
        setEditing(false);
        if (tempValue !== value) {
            onSave(record.id, { [field]: tempValue });
        }
    };

    if (editing) {
        if (type === "text") {
            return (
                <Input
                    autoFocus
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    onBlur={handleSave}
                    onPressEnter={handleSave}
                />
            );
        }
        return (
            <Select
                autoFocus
                defaultOpen
                value={tempValue}
                mode={type === "multi-select" ? "multiple" : undefined}
                style={{ width: "100%", minWidth: type === 'multi-select' ? 200 : 120 }}
                options={options}
                onChange={setTempValue}
                onBlur={handleSave}
                // Stop click propagation to prevent opening row drawer if we add that later
                onClick={(e) => e.stopPropagation()}
            />
        );
    }

    return (
        <div
            className="editable-cell-view"
            onClick={() => setEditing(true)}
            style={{ cursor: "pointer", minHeight: 24, padding: "2px 4px", borderRadius: 4 }}
            title="Click to edit"
        >
            {renderView(value)}
        </div>
    );
}

export default function PeopleDirectory() {
    const { state, dispatch } = useOrgStore();

    // Search and filter state
    const [query, setQuery] = useState("");
    const [showLeadersOnly, setShowLeadersOnly] = useState(false);
    const [selectedSkills, setSelectedSkills] = useState<TechnicalSkill[]>([]);
    const [selectedWorkstream, setSelectedWorkstream] = useState<WorkstreamKey | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<EmployeeStatus | null>(null);
    const [selectedLocation, setSelectedLocation] = useState<LocationTag | null>(null);

    // Drawer state
    const [selected, setSelected] = useState<Employee | null>(null);
    const [open, setOpen] = useState(false);
    const [isNew, setIsNew] = useState(false);

    // Get leaders list
    const leaders = useMemo(() => getLeaders(state), [state]);
    const leaderIds = useMemo(() => new Set(leaders.map((l) => l.id)), [leaders]);

    // Workstreams list
    const workstreams = useMemo(() => {
        const ws = Array.from(new Set(state.employees.flatMap((e) => e.workstreams)));
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
            const matchesWorkstream = !selectedWorkstream || e.workstreams.includes(selectedWorkstream);

            // Status filter
            const matchesStatus = !selectedStatus || (e.status || "active") === selectedStatus;

            // Location filter
            const matchesLocation = !selectedLocation || e.location === selectedLocation;

            return matchesQuery && matchesLeader && matchesSkills && matchesWorkstream && matchesStatus && matchesLocation;
        });
    }, [state.employees, query, showLeadersOnly, selectedSkills, selectedWorkstream, selectedStatus, selectedLocation, leaderIds]);

    // Manager name helper
    const managerName = (managerId?: string) => {
        if (!managerId) return "—";
        const m = state.employees.find((x) => x.id === managerId);
        return m ? m.name : "Unknown";
    };

    // Infinite Scroll state
    const [visibleCount, setVisibleCount] = useState(30);

    // Clear all filters
    const clearFilters = () => {
        setQuery("");
        setShowLeadersOnly(false);
        setSelectedSkills([]);
        setSelectedWorkstream(null);
        setSelectedStatus(null);
        setSelectedLocation(null);
        setVisibleCount(30); // Reset scroll
    };

    // Reset pagination when filters change
    useMemo(() => {
        setVisibleCount(30);
    }, [query, showLeadersOnly, selectedSkills, selectedWorkstream, selectedStatus, selectedLocation]);

    // Handle Infinite Scroll
    useEffect(() => {
        const tableBody = document.querySelector(".people-table .ant-table-body");
        if (!tableBody) return;

        const handleScroll = (e: Event) => {
            const target = e.target as HTMLElement;
            if (target.scrollHeight - target.scrollTop - target.clientHeight < 100) {
                setVisibleCount((prev) => {
                    if (prev >= filtered.length) return prev;
                    return prev + 30;
                });
            }
        };

        tableBody.addEventListener("scroll", handleScroll);
        return () => tableBody.removeEventListener("scroll", handleScroll);
    }, [filtered.length]); // Re-bind if filtered list changes size significantly (though body usually stays)

    const hasActiveFilters =
        query || showLeadersOnly || selectedSkills.length > 0 || selectedWorkstream || selectedStatus || selectedLocation;

    // Options for inline editing
    const managerOptions = useMemo(() =>
        state.employees.map(e => ({ label: e.name, value: e.id })).sort((a, b) => a.label.localeCompare(b.label)),
        [state.employees]);

    const skillOptions = AllSkills.map(s => ({ label: s, value: s }));
    const workstreamOptions = workstreams.map(w => ({ label: w, value: w }));
    const locationOptions = AllLocations.map(l => ({ label: l, value: l }));
    const statusOptions = [
        { label: "Active", value: "active" },
        { label: "On Leave", value: "on_leave" },
        { label: "Open Role", value: "open" },
    ];

    // Table columns
    const columns: ColumnsType<Employee> = [
        {
            title: "Name & Title",
            dataIndex: "name",
            width: 280,
            sorter: (a, b) => a.name.localeCompare(b.name),
            render: (_: string, r) => {
                const isLeader = leaderIds.has(r.id);
                const leaderMetrics = isLeader ? computeLeaderMetrics(state, r.id) : null;
                return (
                    <div className="name-cell">
                        <div className="name-row">
                            <span className="employee-name">{r.name}</span>
                            {isLeader && (
                                <Tag color="purple" className="leader-tag">
                                    <TeamOutlined /> {leaderMetrics?.directReports}
                                </Tag>
                            )}
                        </div>
                        {/* Title is editable */}
                        <EditableValue
                            value={r.title}
                            record={r}
                            field="title"
                            type="text"
                            onSave={handleInlineSave}
                            renderView={(val) => <div className="title-row">{val || "No Title"}</div>}
                        />
                        {r.skillLevel && (
                            <Tag color="blue" className="skill-level-tag">
                                {r.skillLevel}
                            </Tag>
                        )}
                    </div>
                );
            },
        },
        {
            title: "Manager",
            dataIndex: "managerId",
            width: 180,
            render: (v, r) => (
                <EditableValue
                    value={v}
                    record={r}
                    field="managerId"
                    type="select"
                    options={managerOptions}
                    onSave={handleInlineSave}
                    renderView={(val) => <span className="manager-name">{managerName(val) || "—"}</span>}
                />
            ),
        },
        {
            title: "Skills",
            width: 250,
            render: (_: any, r: Employee) => (
                <EditableValue
                    value={r.primarySkill ? [r.primarySkill, ...(r.secondarySkills || [])] : []}
                    // Logic mismatch: Primary vs Secondary. 
                    // PRD says "Primary Skill" and "Secondary Skills" are editable.
                    // Trying to combine them into one multi-select might be confusing if backend treats them differently.
                    // For now, let's just make the whole cell a "Skills" editor that maps to primary/secondary?
                    // Or maybe just secondary for now? 
                    // PRD: "Primary Skill... Secondary Skills".
                    // Let's implement editing for Primary Skill separately? 
                    // The UI combines them. 
                    // Let's try to edit them as "Skills" (Primary is first?).
                    // Actually, simpler to just edit "Primary Skill" via a small dropdown interaction?
                    // For now, let's just use Multi-Select for Secondary, and maybe separate Primary?
                    // Given the constraints, let's try to make the whole cell editable as a multi-select, 
                    // and assume the first one is Primary?
                    // That's a logic change.
                    // Let's stick to: Edit Primary (Select) + Edit Secondary (Multi).
                    // But visual layout is one cell.
                    // Let's wrap the whole thing. On save, first item = primary, rest = secondary.
                    record={r}
                    field="skills_virtual" // Custom field handling needed in onSave?
                    type="multi-select"
                    options={skillOptions}
                    onSave={(id, updates) => {
                        // Custom handler for virtual field
                        const skills = updates['skills_virtual'] as unknown as string[];
                        if (skills && skills.length > 0) {
                            handleInlineSave(id, {
                                primarySkill: skills[0] as TechnicalSkill,
                                secondarySkills: skills.slice(1) as TechnicalSkill[]
                            });
                        } else {
                            handleInlineSave(id, { primarySkill: 'Frontend - Web', secondarySkills: [] }); // Fallback?
                        }
                    }}
                    renderView={() => (
                        <div className="skills-cell" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            <Tag color="geekblue" style={{ fontWeight: 600 }}>
                                {r.primarySkill?.replace("Frontend - ", "FE ").replace("Backend", "BE")}
                            </Tag>
                            {(r.secondarySkills || []).slice(0, 1).map((x) => (
                                <Tag key={x}>
                                    {x.replace("Frontend - ", "FE ").replace("Backend", "BE")}
                                </Tag>
                            ))}
                            {(r.secondarySkills?.length || 0) > 1 && (
                                <Tag className="more" title={r.secondarySkills!.slice(1).join(", ")}>
                                    +{r.secondarySkills!.length - 1}
                                </Tag>
                            )}
                        </div>
                    )}
                />
            ),
        },
        {
            title: "Workstreams",
            dataIndex: "workstreams",
            width: 200,
            render: (arr: WorkstreamKey[], r) => (
                <EditableValue
                    value={arr}
                    record={r}
                    field="workstreams"
                    type="multi-select"
                    options={workstreamOptions}
                    onSave={handleInlineSave}
                    renderView={(val: string[]) => (
                        <div className="workstreams-cell">
                            {val.slice(0, 1).map((x) => (
                                <Tag key={x}>{x}</Tag>
                            ))}
                            {val.length > 1 && <Tag className="more">+{val.length - 1}</Tag>}
                            {val.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Unassigned</span>}
                        </div>
                    )}
                />
            ),
        },
        {
            title: "Location",
            dataIndex: "location",
            width: 110,
            filters: AllLocations.map((l) => ({ text: l, value: l })),
            onFilter: (value, record) => record.location === value,
            render: (v, r) => (
                <EditableValue
                    value={v}
                    record={r}
                    field="location"
                    type="select"
                    options={locationOptions}
                    onSave={handleInlineSave}
                    renderView={(val) => <Tag>{val}</Tag>}
                />
            ),
        },
        {
            title: "Status",
            dataIndex: "status",
            width: 120,
            render: (v: EmployeeStatus | undefined, r) => (
                <EditableValue
                    value={v || "active"}
                    record={r}
                    field="status"
                    type="select"
                    options={statusOptions}
                    onSave={handleInlineSave}
                    renderView={(val) => {
                        const status = val || "active";
                        const config = {
                            active: { color: "success" as const, label: "Active" },
                            on_leave: { color: "warning" as const, label: "On Leave" },
                            open: { color: "default" as const, label: "Open" },
                        };
                        return <Badge status={config[status as EmployeeStatus]?.color || 'default'} text={config[status as EmployeeStatus]?.label || status} />;
                    }}
                />
            ),
        },
        {
            title: "",
            key: "actions",
            width: 80,
            fixed: "right",
            render: (_, r) => (
                <Space size="small">
                    <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelected(r);
                            setIsNew(false);
                            setOpen(true);
                        }}
                    />
                    <Popconfirm
                        title="Delete this person?"
                        description="Their direct reports will be reassigned to their manager."
                        onConfirm={(e) => {
                            e?.stopPropagation();
                            dispatch({ type: "DELETE_EMPLOYEE", employeeId: r.id })
                        }}
                        onCancel={(e) => e?.stopPropagation()}
                    >
                        {/* Stop propagation on delete button too to be safe */}
                        <div onClick={e => e.stopPropagation()}>
                            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                        </div>
                    </Popconfirm>
                </Space>
            ),
        },
    ];



    // Form submit handler
    const handleSubmit = (employee: Employee) => {
        if (isNew) {
            dispatch({
                type: "ADD_EMPLOYEE",
                employee: employee,
            });
        } else {
            dispatch({
                type: "UPDATE_EMPLOYEE",
                employeeId: employee.id,
                updates: employee,
            });
        }
        setOpen(false);
        setSelected(null);
    };

    // Inline Save Handler
    const handleInlineSave = (id: string, updates: Partial<Employee>) => {
        dispatch({
            type: "UPDATE_EMPLOYEE",
            employeeId: id,
            updates: updates,
        });
        message.success("Saved");
    };

    return (
        <div className="people-directory">
            {/* Header */}
            <motion.div
                className="directory-header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="header-content">
                    <h1 className="page-title">
                        <TeamOutlined /> People Directory
                    </h1>
                    <p className="page-subtitle">{filtered.length} of {state.employees.length} people</p>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                        setSelected(null);
                        setIsNew(true);
                        setOpen(true);
                    }}
                >
                    Add Person
                </Button>
            </motion.div>

            {/* Quick Stats */}
            <QuickStats {...stats} />

            {/* Filter Bar */}
            <div className="filter-bar">
                <div className="filter-row">
                    <Input
                        placeholder="Search by name or title..."
                        prefix={<SearchOutlined />}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="search-input"
                        allowClear
                    />

                    {/* Filter Chips */}
                    <div className="filter-chips">
                        <FilterChip
                            label="Leaders"
                            active={showLeadersOnly}
                            count={stats.leaders}
                            onClick={() => setShowLeadersOnly(!showLeadersOnly)}
                            color="#8B5CF6"
                        />

                        <Select
                            placeholder="Workstream"
                            allowClear
                            style={{ width: 140 }}
                            value={selectedWorkstream}
                            onChange={setSelectedWorkstream}
                            options={workstreams.map((w) => ({ value: w, label: w }))}
                        />

                        <Select
                            placeholder="Status"
                            allowClear
                            style={{ width: 120 }}
                            value={selectedStatus}
                            onChange={setSelectedStatus}
                            options={[
                                { value: "active", label: "Active" },
                                { value: "on_leave", label: "On Leave" },
                                { value: "open", label: "Open Role" },
                            ]}
                        />

                        <Select
                            placeholder="Skills"
                            mode="multiple"
                            allowClear
                            style={{ minWidth: 160, maxWidth: 300 }}
                            value={selectedSkills}
                            onChange={setSelectedSkills}
                            options={AllSkills.map((s) => ({ value: s, label: s }))}
                            maxTagCount={1}
                        />

                        <Select
                            placeholder="Location"
                            allowClear
                            style={{ width: 110 }}
                            value={selectedLocation}
                            onChange={setSelectedLocation}
                            options={AllLocations.map((l) => ({ value: l, label: l }))}
                        />
                    </div>

                    {hasActiveFilters && (
                        <Button
                            type="text"
                            icon={<CloseCircleOutlined />}
                            onClick={clearFilters}
                            className="clear-filters-btn"
                        >
                            Clear
                        </Button>
                    )}
                </div>
            </div>

            {/* Table */}
            <Card className="table-card">
                <Table
                    dataSource={filtered.slice(0, visibleCount)}
                    columns={columns}
                    rowKey="id"
                    pagination={false}
                    scroll={{ x: 1100, y: 'calc(100vh - 280px)' }} // Sticky header + scrollable body
                    size="middle"
                    className="people-table"
                    rowClassName={(record) =>
                        (record.status === "open" ? "open-role-row" : "") +
                        (record.status === "on_leave" ? " on-leave-row" : "")
                    }
                />
            </Card>

            {/* Edit/Add Drawer */}
            <Drawer
                title={isNew ? "Add New Person" : `Edit ${selected?.name}`}
                open={open}
                onClose={() => {
                    setOpen(false);
                    setSelected(null);
                }}
                width={520}
                footer={null} // Footer is handled by EmployeeForm
            >
                <EmployeeForm
                    initialValues={selected || undefined}
                    onCancel={() => {
                        setOpen(false);
                        setSelected(null);
                    }}
                    onSubmit={handleSubmit}
                />
            </Drawer>
        </div>
    );
}