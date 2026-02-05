import { useMemo, useState } from "react";
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
                    (skill) => e.primarySkills?.includes(skill) || e.secondarySkills?.includes(skill)
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

    // Clear all filters
    const clearFilters = () => {
        setQuery("");
        setShowLeadersOnly(false);
        setSelectedSkills([]);
        setSelectedWorkstream(null);
        setSelectedStatus(null);
        setSelectedLocation(null);
    };

    const hasActiveFilters =
        query || showLeadersOnly || selectedSkills.length > 0 || selectedWorkstream || selectedStatus || selectedLocation;

    // Table columns
    const columns: ColumnsType<Employee> = [
        {
            title: "Name",
            dataIndex: "name",
            width: 240,
            sorter: (a, b) => a.name.localeCompare(b.name),
            render: (v: string, r) => {
                const isLeader = leaderIds.has(r.id);
                const leaderMetrics = isLeader ? computeLeaderMetrics(state, r.id) : null;
                return (
                    <div className="name-cell">
                        <div className="name-row">
                            <span className="employee-name">{v}</span>
                            {isLeader && (
                                <Tag color="purple" className="leader-tag">
                                    <TeamOutlined /> {leaderMetrics?.directReports}
                                </Tag>
                            )}
                        </div>
                        <div className="title-row">{r.title}</div>
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
            width: 140,
            render: (v) => <span className="manager-name">{managerName(v)}</span>,
        },
        {
            title: "Skills",
            dataIndex: "primarySkills",
            width: 200,
            render: (arr?: TechnicalSkill[]) => (
                <div className="skills-cell">
                    {(arr ?? []).slice(0, 2).map((x) => (
                        <Tag key={x} color="cyan" className="skill-tag">
                            {x.replace("Frontend - ", "FE ").replace("Backend", "BE")}
                        </Tag>
                    ))}
                    {(arr ?? []).length > 2 && <Tag className="skill-tag more">+{(arr ?? []).length - 2}</Tag>}
                </div>
            ),
        },
        {
            title: "Workstreams",
            dataIndex: "workstreams",
            width: 160,
            render: (arr: WorkstreamKey[]) => (
                <div className="workstreams-cell">
                    {arr.slice(0, 1).map((x) => (
                        <Tag key={x}>{x}</Tag>
                    ))}
                    {arr.length > 1 && <Tag className="more">+{arr.length - 1}</Tag>}
                </div>
            ),
        },
        {
            title: "Location",
            dataIndex: "location",
            width: 90,
            filters: AllLocations.map((l) => ({ text: l, value: l })),
            onFilter: (value, record) => record.location === value,
            render: (v) => <Tag>{v}</Tag>,
        },
        {
            title: "Status",
            dataIndex: "status",
            width: 100,
            render: (v?: EmployeeStatus) => {
                const status = v || "active";
                const config = {
                    active: { color: "success" as const, label: "Active" },
                    on_leave: { color: "warning" as const, label: "On Leave" },
                    open: { color: "default" as const, label: "Open" },
                };
                return <Badge status={config[status].color} text={config[status].label} />;
            },
        },
        {
            title: "",
            key: "actions",
            width: 100,
            fixed: "right",
            render: (_, r) => (
                <Space size="small">
                    <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => {
                            setSelected(r);
                            setIsNew(false);
                            setOpen(true);
                        }}
                    />
                    <Popconfirm
                        title="Delete this person?"
                        description="Their direct reports will be reassigned to their manager."
                        onConfirm={() => dispatch({ type: "DELETE_EMPLOYEE", employeeId: r.id })}
                    >
                        <Button type="text" size="small" danger icon={<DeleteOutlined />} />
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
                    dataSource={filtered}
                    columns={columns}
                    rowKey="id"
                    pagination={{
                        pageSize: 15,
                        showSizeChanger: true,
                        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
                    }}
                    scroll={{ x: 1100 }}
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