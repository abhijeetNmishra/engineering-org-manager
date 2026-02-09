import { useMemo } from "react";
import { Card, Col, Row, Statistic, Tag, List, Table, Tooltip, Alert } from "antd";
import { WarningOutlined, CheckCircleOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useOrgStore } from "../state/orgStore";
import {
    computeOrphanEmployees,
    computeSpanOfControl,
    computeWorkstreamCoverage,
    severityTagColor,
    type SpanRow,
    type WorkstreamCoverageRow,
} from "../domain/orgMetrics";

function uniq<T>(arr: T[]) {
    return Array.from(new Set(arr));
}

export default function Dashboard() {
    const { state } = useOrgStore();

    const stats = useMemo(() => {
        const employeeCount = state.employees.length;
        const moduleCount = state.modules.length;

        const workstreams = uniq(state.employees.flatMap((e) => e.workstreams));
        const ownershipCoverage = uniq(state.ownership.map((o) => o.moduleId)).length;
        const uncovered = state.modules.filter((m) => !state.ownership.some((o) => o.moduleId === m.id));

        // Module health stats
        const criticalModules = state.modules.filter((m) => m.health === "Critical");
        const atRiskModules = state.modules.filter((m) => m.health === "At Risk");
        const healthyModules = state.modules.filter((m) => m.health === "Healthy");

        const byWorkstream = workstreams
            .map((ws) => ({
                ws,
                people: state.employees.filter((e) => e.workstreams.includes(ws as any)).length,
                modules: state.modules.filter((m) => m.workstream === (ws as any)).length,
            }))
            .sort((a, b) => b.modules - a.modules);

        return {
            employeeCount,
            moduleCount,
            workstreams,
            ownershipCoverage,
            uncovered,
            byWorkstream,
            criticalModules,
            atRiskModules,
            healthyModules,
        };
    }, [state]);

    const spanRows = useMemo(() => computeSpanOfControl(state), [state]);
    const orphans = useMemo(() => computeOrphanEmployees(state), [state]);
    const coverageRows = useMemo(() => computeWorkstreamCoverage(state), [state]);

    // Compute alerts
    const alerts = useMemo(() => {
        const items = [];

        if (orphans.length > 0) {
            items.push({
                type: "error" as const,
                message: `${orphans.length} orphan employee${orphans.length > 1 ? 's' : ''}`,
                description: "Employees with invalid or missing manager references",
            });
        }

        if (stats.uncovered.length > 0) {
            items.push({
                type: "warning" as const,
                message: `${stats.uncovered.length} unowned module${stats.uncovered.length > 1 ? 's' : ''}`,
                description: "Modules without a primary owner increase execution risk",
            });
        }

        if (stats.criticalModules.length > 0) {
            items.push({
                type: "error" as const,
                message: `${stats.criticalModules.length} critical module${stats.criticalModules.length > 1 ? 's' : ''}`,
                description: stats.criticalModules.map((m) => m.name).join(", "),
            });
        }

        const overSpan = spanRows.filter((r) => r.directReports > 10);
        if (overSpan.length > 0) {
            items.push({
                type: "warning" as const,
                message: `${overSpan.length} leader${overSpan.length > 1 ? 's' : ''} with >10 direct reports`,
                description: overSpan.map((r) => r.leaderName).join(", "),
            });
        }

        return items;
    }, [orphans, stats, spanRows]);

    const spanColumns: ColumnsType<SpanRow> = [
        {
            title: "Leader",
            key: "leader",
            render: (_, r) => (
                <div>
                    <div style={{ fontWeight: 650 }}>{r.leaderName}</div>
                    <div style={{ fontSize: 12, opacity: 0.75 }}>{r.leaderTitle}</div>
                </div>
            ),
        },
        { title: "Direct", dataIndex: "directReports", width: 90, sorter: (a, b) => a.directReports - b.directReports },
        { title: "Total", dataIndex: "totalReports", width: 90, sorter: (a, b) => a.totalReports - b.totalReports },
        {
            title: "Health",
            key: "health",
            width: 120,
            render: (_, r) => <Tag color={severityTagColor(r.severity)}>{r.severity.toUpperCase()}</Tag>,
        },
        {
            title: "Flags",
            key: "flags",
            render: (_, r) =>
                r.flags.length ? (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {r.flags.map((f) => (
                            <Tag key={f}>{f}</Tag>
                        ))}
                    </div>
                ) : (
                    <span style={{ opacity: 0.65 }}>—</span>
                ),
        },
    ];

    const coverageColumns: ColumnsType<WorkstreamCoverageRow> = [
        {
            title: "Workstream",
            dataIndex: "workstream",
            key: "workstream",
            render: (v) => <span style={{ fontWeight: 650 }}>{v}</span>,
        },
        { title: "Modules", dataIndex: "modules", width: 90, sorter: (a, b) => a.modules - b.modules },
        { title: "People", dataIndex: "people", width: 90, sorter: (a, b) => a.people - b.people },
        {
            title: "People / Module",
            dataIndex: "peoplePerModule",
            width: 140,
            sorter: (a, b) => a.peoplePerModule - b.peoplePerModule,
            render: (v: number) => <span style={{ fontVariantNumeric: "tabular-nums" }}>{v.toFixed(2)}</span>,
        },
        {
            title: "Unowned",
            dataIndex: "unownedModules",
            width: 100,
            sorter: (a, b) => a.unownedModules - b.unownedModules,
            render: (v: number) => (v > 0 ? <Tag color="red">{v}</Tag> : <Tag color="green">0</Tag>),
        },
        {
            title: "Heat",
            key: "heat",
            width: 110,
            render: (_, r) => (
                <Tooltip title={r.flags.length ? r.flags.join(" • ") : "Coverage looks healthy"}>
                    <Tag color={severityTagColor(r.severity)}>{r.severity.toUpperCase()}</Tag>
                </Tooltip>
            ),
        },
    ];

    return (
        <div style={{ maxWidth: 1600, margin: '0 auto' }}>
            <Row gutter={[16, 16]}>
                {/* Alerts Section */}
                {alerts.length > 0 && (
                    <Col xs={24}>
                        <Card className="glass" title={<span className="brand">⚠️ Org Health Alerts</span>}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                {alerts.map((alert, idx) => (
                                    <Alert
                                        key={idx}
                                        type={alert.type}
                                        message={alert.message}
                                        description={alert.description}
                                        showIcon
                                    />
                                ))}
                            </div>
                        </Card>
                    </Col>
                )}

                <Col xs={24} md={6}>
                    <Card className="glass card-tight" title="👥 Headcount">
                        <Statistic value={stats.employeeCount} suffix="people" />
                        <div style={{ marginTop: 8, opacity: 0.8, fontSize: 12 }}>
                            {orphans.length === 0 ? "✓ Clean reporting structure" : "⚠️ Check orphan employees"}
                        </div>
                    </Card>
                </Col>

                <Col xs={24} md={6}>
                    <Card className="glass card-tight" title="🧩 Modules">
                        <Statistic value={stats.moduleCount} suffix="nodes" />
                        <div style={{ marginTop: 8 }}>
                            {stats.workstreams.slice(0, 4).map((ws) => (
                                <Tag key={ws}>{ws}</Tag>
                            ))}
                        </div>
                    </Card>
                </Col>

                <Col xs={24} md={6}>
                    <Card className="glass card-tight" title="✅ Ownership">
                        <Statistic value={stats.ownershipCoverage} suffix={`/ ${stats.moduleCount}`} />
                        <div style={{ marginTop: 8, fontSize: 12 }}>
                            {stats.uncovered.length === 0 ? (
                                <Tag color="green" icon={<CheckCircleOutlined />}>All modules owned</Tag>
                            ) : (
                                <Tag color="red" icon={<WarningOutlined />}>{stats.uncovered.length} unowned</Tag>
                            )}
                        </div>
                    </Card>
                </Col>

                <Col xs={24} md={6}>
                    <Card className="glass card-tight" title="🩺 Module Health">
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: 13 }}>🟢 Healthy</span>
                                <Tag color="green">{stats.healthyModules.length}</Tag>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: 13 }}>🟡 At Risk</span>
                                <Tag color="orange">{stats.atRiskModules.length}</Tag>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: 13 }}>🔴 Critical</span>
                                <Tag color="red">{stats.criticalModules.length}</Tag>
                            </div>
                        </div>
                    </Card>
                </Col>

                <Col xs={24} md={12}>
                    <Card className="glass" title="Span of Control (Leaders + Red Flags)">
                        <Table
                            rowKey={(r) => r.leaderId}
                            columns={spanColumns}
                            dataSource={spanRows}
                            pagination={{ pageSize: 6 }}
                            size="small"
                        />
                        <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75 }}>
                            Heuristics are opinionated defaults; tune thresholds in <code>orgMetrics.ts</code>.
                        </div>
                    </Card>
                </Col>

                <Col xs={24} md={12}>
                    <Card className="glass" title="Coverage Heatmap (Workstreams × Modules × People)">
                        <Table
                            rowKey={(r) => r.workstream}
                            columns={coverageColumns}
                            dataSource={coverageRows}
                            pagination={{ pageSize: 8 }}
                            size="small"
                        />
                        <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75 }}>
                            "Heat" reflects unowned modules + thin/dense coverage signals.
                        </div>
                    </Card>
                </Col>

                {stats.criticalModules.length > 0 && (
                    <Col xs={24} md={12}>
                        <Card className="glass" title="🔴 Critical Modules (Immediate Attention Required)">
                            <List
                                dataSource={stats.criticalModules}
                                renderItem={(m) => (
                                    <List.Item>
                                        <div style={{ display: "flex", gap: 8, width: "100%", justifyContent: "space-between" }}>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{m.name}</div>
                                                <div style={{ fontSize: 12, opacity: 0.75 }}>
                                                    {m.type} • {m.workstream}
                                                </div>
                                            </div>
                                            <div>
                                                {m.priority && <Tag color={m.priority === "P0" ? "red" : "orange"}>{m.priority}</Tag>}
                                                {m.effort && <Tag color="purple">{m.effort}</Tag>}
                                            </div>
                                        </div>
                                    </List.Item>
                                )}
                            />
                        </Card>
                    </Col>
                )}

                {stats.uncovered.length > 0 && (
                    <Col xs={24} md={12}>
                        <Card className="glass" title="⚠️ Unowned Modules (Risk / Gap)">
                            <List
                                dataSource={stats.uncovered}
                                renderItem={(m) => (
                                    <List.Item>
                                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                            <Tag color="red">Unowned</Tag>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{m.name}</div>
                                                <div style={{ fontSize: 12, opacity: 0.75 }}>
                                                    {m.type} • {m.workstream}
                                                </div>
                                            </div>
                                        </div>
                                    </List.Item>
                                )}
                            />
                        </Card>
                    </Col>
                )}
            </Row>
        </div>
    );
}