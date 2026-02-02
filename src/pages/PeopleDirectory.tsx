import { useMemo, useState } from "react";
import { Card, Col, Input, Row, Select, Table, Tag, Tree, Drawer, Form, Button, Space, Popconfirm, Divider } from "antd";
import { PlusOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { Employee, WorkstreamKey, TechnicalSkill, SkillLevel, LocationTag, RoleLevel } from "../domain/types";
import { useOrgStore } from "../state/orgStore";

function buildReportingTree(employees: Employee[]) {
    const children = new Map<string, Employee[]>();
    employees.forEach((e) => {
        if (!e.managerId) return;
        const arr = children.get(e.managerId) ?? [];
        arr.push(e);
        children.set(e.managerId, arr);
    });

    const roots = employees.filter((e) => !e.managerId);

    const toNode = (e: Employee): any => ({
        key: e.id,
        title: `${e.name} • ${e.title}`,
        children: (children.get(e.id) ?? []).map(toNode),
    });

    return roots.map(toNode);
}

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

const AllTitles: RoleLevel[] = [
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

const AllSkillLevels: SkillLevel[] = ["Junior", "Mid", "Senior", "Staff", "Principal"];

export default function PeopleDirectory() {
    const { state, dispatch } = useOrgStore();

    const [query, setQuery] = useState("");
    const [workstream, setWorkstream] = useState<WorkstreamKey | "All">("All");
    const [selected, setSelected] = useState<Employee | null>(null);
    const [open, setOpen] = useState(false);
    const [isNew, setIsNew] = useState(false);

    const workstreams = useMemo(() => {
        const ws = Array.from(new Set(state.employees.flatMap((e) => e.workstreams)));
        return ws.sort() as WorkstreamKey[];
    }, [state.employees]);

    const filtered = useMemo(() => {
        return state.employees.filter((e) => {
            const matchesQuery =
                e.name.toLowerCase().includes(query.toLowerCase()) ||
                e.title.toLowerCase().includes(query.toLowerCase());
            const matchesWorkstream = workstream === "All" ? true : e.workstreams.includes(workstream);
            return matchesQuery && matchesWorkstream;
        });
    }, [state.employees, query, workstream]);

    const managerName = (managerId?: string) => {
        if (!managerId) return "—";
        const m = state.employees.find((x) => x.id === managerId);
        return m ? m.name : "Unknown";
    };

    const columns: ColumnsType<Employee> = [
        {
            title: "Name",
            dataIndex: "name",
            width: 200,
            render: (v: string, r) => (
                <div>
                    <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{v}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{r.title}</div>
                    {r.skillLevel && (
                        <Tag color="blue" style={{ fontSize: 10, marginTop: 4 }}>
                            {r.skillLevel}
                        </Tag>
                    )}
                </div>
            ),
        },
        {
            title: "Manager",
            dataIndex: "managerId",
            width: 140,
            render: (v) => <span style={{ color: "var(--text-secondary)" }}>{managerName(v)}</span>
        },
        {
            title: "Primary Skills",
            dataIndex: "primarySkills",
            width: 220,
            render: (arr?: TechnicalSkill[]) => (
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {(arr ?? []).slice(0, 2).map((x) => (
                        <Tag key={x} color="cyan">{x}</Tag>
                    ))}
                    {(arr ?? []).length > 2 ? <Tag>+{(arr ?? []).length - 2}</Tag> : null}
                </div>
            ),
        },
        {
            title: "Workstreams",
            dataIndex: "workstreams",
            width: 180,
            render: (arr: WorkstreamKey[]) => (
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {arr.slice(0, 2).map((x) => (
                        <Tag key={x}>{x}</Tag>
                    ))}
                    {arr.length > 2 ? <Tag>+{arr.length - 2}</Tag> : null}
                </div>
            ),
        },
        {
            title: "Location",
            dataIndex: "location",
            width: 100,
            render: (v) => <Tag>{v}</Tag>
        },
        {
            title: "",
            key: "actions",
            width: 120,
            render: (_, r) => (
                <Space size="small">
                    <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => {
                            setSelected(r);
                            setIsNew(false);
                            setOpen(true);
                        }}
                    >
                        Edit
                    </Button>
                    <Popconfirm
                        title="Delete this person?"
                        description="Their direct reports will be reassigned to their manager."
                        onConfirm={() => dispatch({ type: "DELETE_EMPLOYEE", employeeId: r.id })}
                    >
                        <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const reportingTree = useMemo(() => buildReportingTree(state.employees), [state.employees]);

    const managerOptions = useMemo(() => {
        if (!selected) return [];
        return state.employees
            .filter((e) => e.id !== selected.id)
            .map((e) => ({ value: e.id, label: `${e.name} • ${e.title}` }));
    }, [state.employees, selected]);

    const handleSubmit = (values: any) => {
        if (isNew) {
            const newId = `e-${Date.now()}`;
            dispatch({
                type: "ADD_EMPLOYEE",
                employee: {
                    id: newId,
                    name: values.name,
                    title: values.title,
                    location: values.location,
                    managerId: values.managerId || undefined,
                    workstreams: values.workstreams || [],
                    moduleOwnershipIds: [],
                    notes: values.notes || "",
                    primarySkills: values.primarySkills || [],
                    secondarySkills: values.secondarySkills || [],
                    skillLevel: values.skillLevel || undefined,
                    tenure: values.tenure || undefined,
                    email: values.email || undefined,
                },
            });
        } else if (selected) {
            dispatch({
                type: "UPDATE_EMPLOYEE",
                employeeId: selected.id,
                updates: {
                    name: values.name,
                    title: values.title,
                    location: values.location,
                    managerId: values.managerId || undefined,
                    workstreams: values.workstreams || [],
                    notes: values.notes || "",
                    primarySkills: values.primarySkills || [],
                    secondarySkills: values.secondarySkills || [],
                    skillLevel: values.skillLevel || undefined,
                    tenure: values.tenure || undefined,
                    email: values.email || undefined,
                },
            });
        }
        setOpen(false);
    };

    return (
        <Row gutter={[16, 16]}>
            <Col xs={24}>
                <Card
                    className="glass"
                    title={<span className="brand">People Directory</span>}
                    extra={
                        <Space>
                            <Input
                                placeholder="Search name or title…"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                style={{ width: 220 }}
                                allowClear
                            />
                            <Select
                                value={workstream}
                                style={{ width: 220 }}
                                onChange={(v) => setWorkstream(v)}
                                options={[{ value: "All", label: "All workstreams" }].concat(
                                    workstreams.map((w) => ({ value: w, label: w }))
                                )}
                            />
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
                        </Space>
                    }
                >
                    <Table
                        rowKey="id"
                        columns={columns}
                        dataSource={filtered}
                        pagination={{ pageSize: 10 }}
                        size="small"
                    />
                </Card>
            </Col>

            <Col xs={24} md={12}>
                <Card className="glass" title={<span className="brand">Reporting Tree</span>}>
                    <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
                        VP → Directors/SEMs → EMs → ICs
                    </div>
                    <Tree treeData={reportingTree} defaultExpandAll />
                </Card>
            </Col>

            <Col xs={24} md={12}>
                <Card className="glass" title={<span className="brand">Skill Overview</span>}>
                    <div className="muted" style={{ fontSize: 12, marginBottom: 12 }}>
                        Top skills in the organization
                    </div>
                    {(() => {
                        const skillCount = new Map<string, number>();
                        state.employees.forEach((e) => {
                            (e.primarySkills ?? []).forEach((s) => {
                                skillCount.set(s, (skillCount.get(s) ?? 0) + 1);
                            });
                        });
                        const sorted = Array.from(skillCount.entries())
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 8);

                        return (
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {sorted.map(([skill, count]) => (
                                    <div key={skill} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <div style={{ fontWeight: 600, minWidth: 180, color: "var(--text-primary)" }}>
                                            {skill}
                                        </div>
                                        <div
                                            style={{
                                                flex: 1,
                                                height: 24,
                                                background: "var(--gradient-product)",
                                                borderRadius: 4,
                                                width: `${(count / state.employees.length) * 100}%`,
                                            }}
                                        />
                                        <div style={{ fontWeight: 700, minWidth: 30, color: "var(--text-accent)" }}>
                                            {count}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        );
                    })()}
                </Card>
            </Col>

            <Drawer
                title={isNew ? "Add New Person" : "Edit Person"}
                open={open}
                width={560}
                onClose={() => setOpen(false)}
                destroyOnClose
            >
                <Form
                    layout="vertical"
                    initialValues={
                        isNew
                            ? {
                                location: "US",
                                title: "Engineer",
                                skillLevel: "Mid",
                            }
                            : {
                                name: selected?.name,
                                title: selected?.title,
                                location: selected?.location,
                                managerId: selected?.managerId ?? "",
                                workstreams: selected?.workstreams ?? [],
                                primarySkills: selected?.primarySkills ?? [],
                                secondarySkills: selected?.secondarySkills ?? [],
                                skillLevel: selected?.skillLevel,
                                tenure: selected?.tenure,
                                email: selected?.email,
                                notes: selected?.notes,
                            }
                    }
                    onFinish={handleSubmit}
                >
                    <Form.Item label="Name" name="name" rules={[{ required: true }]}>
                        <Input placeholder="Full name" />
                    </Form.Item>

                    <Row gutter={12}>
                        <Col span={12}>
                            <Form.Item label="Title" name="title" rules={[{ required: true }]}>
                                <Select options={AllTitles.map((t) => ({ value: t, label: t }))} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Location" name="location" rules={[{ required: true }]}>
                                <Select options={AllLocations.map((l) => ({ value: l, label: l }))} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item label="Manager" name="managerId">
                        <Select allowClear placeholder="Select manager (or leave empty for root)" options={managerOptions} />
                    </Form.Item>

                    <Divider />

                    <Row gutter={12}>
                        <Col span={12}>
                            <Form.Item label="Skill Level" name="skillLevel">
                                <Select
                                    allowClear
                                    options={AllSkillLevels.map((s) => ({ value: s, label: s }))}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Tenure (months)" name="tenure">
                                <Input type="number" placeholder="e.g., 24" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item label="Primary Skills" name="primarySkills">
                        <Select
                            mode="multiple"
                            placeholder="Select 2-3 primary skills"
                            options={AllSkills.map((s) => ({ value: s, label: s }))}
                        />
                    </Form.Item>

                    <Form.Item label="Secondary Skills" name="secondarySkills">
                        <Select
                            mode="multiple"
                            placeholder="Adjacent competencies"
                            options={AllSkills.map((s) => ({ value: s, label: s }))}
                        />
                    </Form.Item>

                    <Form.Item label="Workstreams" name="workstreams">
                        <Select
                            mode="multiple"
                            placeholder="Select workstreams"
                            options={workstreams.map((w) => ({ value: w, label: w }))}
                        />
                    </Form.Item>

                    <Form.Item label="Email" name="email">
                        <Input type="email" placeholder="email@shipt.com" />
                    </Form.Item>

                    <Form.Item label="Notes" name="notes">
                        <Input.TextArea rows={3} placeholder="Additional notes..." />
                    </Form.Item>

                    <Space>
                        <Button type="primary" htmlType="submit">
                            {isNew ? "Add Person" : "Save Changes"}
                        </Button>
                        <Button onClick={() => setOpen(false)}>Cancel</Button>
                    </Space>
                </Form>
            </Drawer>
        </Row>
    );
}