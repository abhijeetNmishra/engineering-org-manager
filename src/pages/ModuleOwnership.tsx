import { useMemo, useState } from "react";
import { Card, Col, Descriptions, Divider, Row, Select, Tag, Tree, Button, Space, Drawer, Form, Input, Popconfirm } from "antd";
import { EditOutlined, PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ModuleNode, ModuleHealth, ModulePriority, WorkstreamKey } from "../domain/types";
import { useOrgStore } from "../state/orgStore";

function buildModuleTree(modules: ModuleNode[]) {
    const children = new Map<string, ModuleNode[]>();
    modules.forEach((m) => {
        if (!m.parentId) return;
        const arr = children.get(m.parentId) ?? [];
        arr.push(m);
        children.set(m.parentId, arr);
    });

    const roots = modules.filter((m) => !m.parentId);

    const toNode = (m: ModuleNode): any => {
        const healthIcon = m.health === "Healthy" ? "🟢" : m.health === "At Risk" ? "🟡" : m.health === "Critical" ? "🔴" : "";
        return {
            key: m.id,
            title: `${healthIcon} ${m.name} • ${m.type}`,
            children: (children.get(m.id) ?? []).map(toNode),
        };
    };

    return roots.map(toNode);
}

const healthColors: Record<ModuleHealth, string> = {
    "Healthy": "green",
    "At Risk": "orange",
    "Critical": "red",
};

const priorityColors: Record<ModulePriority, string> = {
    "P0": "red",
    "P1": "orange",
    "P2": "blue",
    "P3": "default",
};

export default function ModuleOwnership() {
    const { state, dispatch } = useOrgStore();

    const [workstream, setWorkstream] = useState<WorkstreamKey | "All">("All");
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [editModuleOpen, setEditModuleOpen] = useState(false);
    const [addOwnerOpen, setAddOwnerOpen] = useState(false);

    const workstreams = useMemo(() => {
        const ws = Array.from(new Set(state.modules.map((m) => m.workstream)));
        return ws.sort() as WorkstreamKey[];
    }, [state.modules]);

    const modulesFiltered = useMemo(() => {
        if (workstream === "All") return state.modules;
        return state.modules.filter((m) => m.workstream === workstream);
    }, [state.modules, workstream]);

    const treeData = useMemo(() => buildModuleTree(modulesFiltered), [modulesFiltered]);

    const selected = useMemo(
        () => state.modules.find((m) => m.id === selectedId) ?? null,
        [state.modules, selectedId]
    );

    const ownership = useMemo(() => {
        if (!selected) return [];
        return state.ownership
            .filter((o) => o.moduleId === selected.id)
            .map((o) => ({
                ...o,
                employee: state.employees.find((e) => e.id === o.ownerId),
            }));
    }, [selected, state.ownership, state.employees]);

    const handleUpdateModule = (values: any) => {
        if (!selected) return;
        dispatch({
            type: "UPDATE_MODULE",
            moduleId: selected.id,
            updates: {
                name: values.name,
                description: values.description,
                health: values.health,
                priority: values.priority,
                effort: values.effort,
                tags: values.tags ? values.tags.split(",").map((t: string) => t.trim()) : [],
            },
        });
        setEditModuleOpen(false);
    };

    const handleAddOwner = (values: any) => {
        if (!selected) return;
        dispatch({
            type: "UPSERT_OWNERSHIP",
            moduleId: selected.id,
            ownerId: values.ownerId,
            ownershipType: values.ownershipType,
        });
        setAddOwnerOpen(false);
    };

    return (
        <Row gutter={[16, 16]}>
            <Col xs={24} md={10}>
                <Card
                    className="glass"
                    title={<span className="brand">Modules (Verticals + Horizontals)</span>}
                    extra={
                        <Select
                            value={workstream}
                            style={{ width: 220 }}
                            onChange={(v) => setWorkstream(v)}
                            options={[{ value: "All", label: "All workstreams" }].concat(
                                workstreams.map((w) => ({ value: w, label: w }))
                            )}
                        />
                    }
                >
                    <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
                        Select a module to see ownership + health metrics.
                    </div>

                    <Tree
                        treeData={treeData}
                        defaultExpandAll
                        onSelect={(keys) => setSelectedId((keys?.[0] as string) ?? null)}
                    />
                </Card>
            </Col>

            <Col xs={24} md={14}>
                <Card
                    className="glass"
                    title={<span className="brand">Module Details & Ownership</span>}
                    extra={
                        selected && (
                            <Button
                                size="small"
                                icon={<EditOutlined />}
                                onClick={() => setEditModuleOpen(true)}
                            >
                                Edit Module
                            </Button>
                        )
                    }
                >
                    {!selected ? (
                        <div className="muted">Pick a module from the tree.</div>
                    ) : (
                        <>
                            <Descriptions size="small" column={2} bordered>
                                <Descriptions.Item label="Module">{selected.name}</Descriptions.Item>
                                <Descriptions.Item label="Type">{selected.type}</Descriptions.Item>
                                <Descriptions.Item label="Workstream">{selected.workstream}</Descriptions.Item>

                                <Descriptions.Item label="Health">
                                    {selected.health ? (
                                        <Tag color={healthColors[selected.health]}>{selected.health}</Tag>
                                    ) : (
                                        <span className="muted">—</span>
                                    )}
                                </Descriptions.Item>

                                <Descriptions.Item label="Priority">
                                    {selected.priority ? (
                                        <Tag color={priorityColors[selected.priority]}>{selected.priority}</Tag>
                                    ) : (
                                        <span className="muted">—</span>
                                    )}
                                </Descriptions.Item>

                                <Descriptions.Item label="Effort">
                                    {selected.effort ? (
                                        <Tag color="purple">{selected.effort}</Tag>
                                    ) : (
                                        <span className="muted">—</span>
                                    )}
                                </Descriptions.Item>

                                <Descriptions.Item label="Tags" span={2}>
                                    {(selected.tags ?? []).length ? (
                                        (selected.tags ?? []).map((t) => <Tag key={t}>{t}</Tag>)
                                    ) : (
                                        <span className="muted">—</span>
                                    )}
                                </Descriptions.Item>
                            </Descriptions>

                            {selected.description && (
                                <div style={{ marginTop: 12, padding: 12, background: "var(--bg-tertiary)", borderRadius: 8 }}>
                                    <div style={{ fontWeight: 600, marginBottom: 4, color: "var(--text-primary)" }}>
                                        Description
                                    </div>
                                    <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                                        {selected.description}
                                    </div>
                                </div>
                            )}

                            <Divider style={{ borderColor: "var(--border-glass)" }} />

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                                <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>Owners</div>
                                <Button
                                    size="small"
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={() => setAddOwnerOpen(true)}
                                >
                                    Add Owner
                                </Button>
                            </div>

                            {ownership.length === 0 ? (
                                <div>
                                    <Tag color="red">Unowned</Tag>
                                    <span className="muted" style={{ marginLeft: 8 }}>
                                        Add a primary owner to reduce execution risk.
                                    </span>
                                </div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    {ownership.map((o) => (
                                        <div
                                            key={`${o.moduleId}-${o.ownerId}-${o.ownershipType}`}
                                            style={{
                                                display: "flex",
                                                gap: 12,
                                                padding: 12,
                                                background: "var(--bg-tertiary)",
                                                borderRadius: 8,
                                                alignItems: "center",
                                            }}
                                        >
                                            <Tag
                                                color={
                                                    o.ownershipType === "Primary"
                                                        ? "green"
                                                        : o.ownershipType === "Secondary"
                                                            ? "blue"
                                                            : "default"
                                                }
                                            >
                                                {o.ownershipType}
                                            </Tag>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 650, color: "var(--text-primary)" }}>
                                                    {o.employee?.name ?? "Unknown"}{" "}
                                                    <span className="muted">• {o.employee?.title ?? "—"}</span>
                                                </div>
                                                <div className="muted" style={{ fontSize: 12 }}>
                                                    Skills: {(o.employee?.primarySkills ?? []).join(", ") || "—"}
                                                </div>
                                            </div>
                                            <Popconfirm
                                                title="Remove this owner?"
                                                onConfirm={() =>
                                                    dispatch({
                                                        type: "REMOVE_OWNERSHIP",
                                                        moduleId: selected.id,
                                                        ownerId: o.ownerId,
                                                    })
                                                }
                                            >
                                                <Button size="small" danger icon={<DeleteOutlined />} />
                                            </Popconfirm>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </Card>
            </Col>

            {/* Edit Module Drawer */}
            <Drawer
                title="Edit Module"
                open={editModuleOpen}
                onClose={() => setEditModuleOpen(false)}
                width={480}
                destroyOnClose
            >
                {selected && (
                    <Form
                        layout="vertical"
                        initialValues={{
                            name: selected.name,
                            description: selected.description,
                            health: selected.health,
                            priority: selected.priority,
                            effort: selected.effort,
                            tags: (selected.tags ?? []).join(", "),
                        }}
                        onFinish={handleUpdateModule}
                    >
                        <Form.Item label="Name" name="name" rules={[{ required: true }]}>
                            <Input />
                        </Form.Item>

                        <Form.Item label="Description" name="description">
                            <Input.TextArea rows={3} placeholder="What this module does..." />
                        </Form.Item>

                        <Row gutter={12}>
                            <Col span={8}>
                                <Form.Item label="Health" name="health">
                                    <Select
                                        allowClear
                                        options={[
                                            { value: "Healthy", label: "🟢 Healthy" },
                                            { value: "At Risk", label: "🟡 At Risk" },
                                            { value: "Critical", label: "🔴 Critical" },
                                        ]}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item label="Priority" name="priority">
                                    <Select
                                        allowClear
                                        options={[
                                            { value: "P0", label: "P0" },
                                            { value: "P1", label: "P1" },
                                            { value: "P2", label: "P2" },
                                            { value: "P3", label: "P3" },
                                        ]}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item label="Effort" name="effort">
                                    <Select
                                        allowClear
                                        options={[
                                            { value: "XS", label: "XS" },
                                            { value: "S", label: "S" },
                                            { value: "M", label: "M" },
                                            { value: "L", label: "L" },
                                            { value: "XL", label: "XL" },
                                        ]}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item label="Tags (comma-separated)" name="tags">
                            <Input placeholder="e.g., Revenue, Trust, Tier-0" />
                        </Form.Item>

                        <Space>
                            <Button type="primary" htmlType="submit">
                                Save Changes
                            </Button>
                            <Button onClick={() => setEditModuleOpen(false)}>Cancel</Button>
                        </Space>
                    </Form>
                )}
            </Drawer>

            {/* Add Owner Drawer */}
            <Drawer
                title="Add Owner"
                open={addOwnerOpen}
                onClose={() => setAddOwnerOpen(false)}
                width={400}
                destroyOnClose
            >
                {selected && (
                    <Form
                        layout="vertical"
                        initialValues={{ ownershipType: "Primary" }}
                        onFinish={handleAddOwner}
                    >
                        <div className="muted" style={{ marginBottom: 16 }}>
                            Adding owner for: <strong>{selected.name}</strong>
                        </div>

                        <Form.Item label="Person" name="ownerId" rules={[{ required: true }]}>
                            <Select
                                placeholder="Select person"
                                options={state.employees.map((e) => ({
                                    value: e.id,
                                    label: `${e.name} • ${e.title}`,
                                }))}
                                showSearch
                                filterOption={(input, option) =>
                                    (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                                }
                            />
                        </Form.Item>

                        <Form.Item label="Ownership Type" name="ownershipType" rules={[{ required: true }]}>
                            <Select
                                options={[
                                    { value: "Primary", label: "Primary" },
                                    { value: "Secondary", label: "Secondary" },
                                    { value: "Contributor", label: "Contributor" },
                                ]}
                            />
                        </Form.Item>

                        <Space>
                            <Button type="primary" htmlType="submit">
                                Add Owner
                            </Button>
                            <Button onClick={() => setAddOwnerOpen(false)}>Cancel</Button>
                        </Space>
                    </Form>
                )}
            </Drawer>
        </Row>
    );
}