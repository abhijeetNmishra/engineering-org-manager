import { useState, useMemo } from "react";
import { Row, Col, Card, Statistic, Segmented, Progress } from "antd";
import { BarChartOutlined, UserOutlined, AppstoreOutlined, TeamOutlined, PieChartOutlined, ThunderboltOutlined, ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import { useOrgStore } from "../state/orgStore";
import {
    computeOrgStats,
    computeSpanOfControl,
    computeSpanByRole,
    computeAttributeComposition,
    computeLeaderMetrics,
    getLeaders,
    getModuleColor,
    getDescendants,
    SKILL_COLORS,
    ROLE_COLORS,
    getSkillColor,
    getTitleColor
} from "../domain/orgMetrics";
import type { LeaderMetrics } from "../domain/types";
import { GlobalFilterBar, type DashboardFilters } from "../components/intelligence/GlobalFilterBar";
import { CompositionTileGrid } from "../components/intelligence/CompositionTileGrid";
import { SpanByRoleChart } from "../components/intelligence/SpanByRoleChart";
import { LeaderSpanList } from "../components/intelligence/LeaderSpanList";
import "./Intelligence.css";

// Drawer component for Leader Insights
import { Drawer, Tag, Divider } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const CHART_COLORS = [
    "#6B21EF", "#3B82F6", "#10B981", "#F59E0B", "#EC4899", "#EF4444", "#8B5CF6", "#06B6D4"
];

function LeaderInsightsPanel({
    open,
    onClose,
    metrics,
}: {
    open: boolean;
    onClose: () => void;
    metrics: LeaderMetrics | null;
}) {
    if (!metrics) return null;

    const titleMixData = Object.entries(metrics.titleMix).map(([name, value]) => ({ name, value }));
    const skillMixData = Object.entries(metrics.skillMix).map(([name, value]) => ({ name, value }));

    return (
        <Drawer
            title={null}
            placement="right"
            width={460}
            onClose={onClose}
            open={open}
            styles={{ body: { padding: 0 }, header: { display: 'none' } }}
        >
            <div className="insights-panel">
                <div className="insights-header">
                    <button className="close-btn" onClick={onClose}><CloseOutlined /></button>
                    <div className="leader-avatar"><UserOutlined /></div>
                    <h2 className="leader-name">{metrics.name}</h2>
                    <p className="leader-title">{metrics.title}</p>
                </div>
                <div className="insights-stats">
                    <div className="stat-box"><Statistic title="Direct Reports" value={metrics.directReports} /></div>
                    <div className="stat-box"><Statistic title="Total Reports" value={metrics.totalReports} /></div>
                </div>
                <Divider />
                {titleMixData.length > 0 && (
                    <div className="insight-section">
                        <h3 className="section-title">Title Mix</h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={titleMixData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Bar dataKey="value" fill="#6B21EF" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
                <Divider />
                {skillMixData.length > 0 && (
                    <div className="insight-section">
                        <h3 className="section-title">Skill Mix</h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie data={skillMixData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value">
                                    {skillMixData.map((_, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                )}
                <Divider />
                <div className="insight-section">
                    <h3 className="section-title">Workstreams Touched</h3>
                    <div className="workstream-tags">
                        {metrics.workstreamsTouched.length > 0 ? metrics.workstreamsTouched.map(ws => (
                            <Tag key={ws} color={getModuleColor(ws)}>{ws}</Tag>
                        )) : <span className="no-data">No workstreams assigned</span>}
                    </div>
                </div>
            </div>
        </Drawer>
    );
}

// New Component: Highlights for Overview Tab
function OverviewHighlights({
    topSkill,
    topRole,
    highestSpanLeader
}: {
    topSkill: { label: string, percentage: number } | undefined,
    topRole: { label: string, percentage: number } | undefined,
    highestSpanLeader: { leaderName: string, directReports: number, leaderTitle: string } | undefined
}) {
    return (
        <Row gutter={[24, 24]} style={{ marginTop: 20 }}>
            <Col xs={24} md={8}>
                <Card className="highlight-card" bordered={false}>
                    <div className="highlight-icon" style={{ background: "rgba(59, 130, 246, 0.1)", color: "#3B82F6" }}>
                        <ThunderboltOutlined />
                    </div>
                    <div className="highlight-content">
                        <div className="highlight-label">Dominant Skill</div>
                        <div className="highlight-value" style={{ color: getSkillColor(topSkill?.label || "") }}>
                            {topSkill?.label || "N/A"}
                        </div>
                        <div className="highlight-sub">{topSkill?.percentage}% of Org</div>
                    </div>
                </Card>
            </Col>
            <Col xs={24} md={8}>
                <Card className="highlight-card" bordered={false}>
                    <div className="highlight-icon" style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10B981" }}>
                        <TeamOutlined />
                    </div>
                    <div className="highlight-content">
                        <div className="highlight-label">Most Common Role</div>
                        <div className="highlight-value" style={{ color: getTitleColor(topRole?.label || "") }}>
                            {topRole?.label || "N/A"}
                        </div>
                        <div className="highlight-sub">{topRole?.percentage}% of Org</div>
                    </div>
                </Card>
            </Col>
            <Col xs={24} md={8}>
                <Card className="highlight-card" bordered={false}>
                    <div className="highlight-icon" style={{ background: "rgba(245, 158, 11, 0.1)", color: "#F59E0B" }}>
                        <UserOutlined />
                    </div>
                    <div className="highlight-content">
                        <div className="highlight-label">Widest Span</div>
                        <div className="highlight-value">
                            {highestSpanLeader?.leaderName || "N/A"}
                        </div>
                        <div className="highlight-sub">{highestSpanLeader?.directReports} Direct Reports</div>
                    </div>
                </Card>
            </Col>
        </Row>
    );
}

type ViewType = 'overview' | 'composition' | 'leadership' | 'skills';

export function Intelligence() {
    const { state } = useOrgStore();
    const [view, setView] = useState<ViewType>('overview');

    // Global Filter State
    const [filters, setFilters] = useState<DashboardFilters>({
        leaderId: null,
        workstream: null,
        location: null,
        status: null
    });

    const [selectedLeaderMetricsId, setSelectedLeaderMetricsId] = useState<string | null>(null);

    // Filter Logic
    const filteredState = useMemo(() => {
        let employees = state.employees;

        if (filters.leaderId) {
            const descendants = getDescendants(state, filters.leaderId);
            const descendantIds = new Set(descendants.map(d => d.id));
            // Include the leader themselves optionally, usually "Org of Leader X" implies their tree
            employees = employees.filter(e => descendantIds.has(e.id) || e.id === filters.leaderId);
        }

        if (filters.workstream) {
            employees = employees.filter(e => e.workstreams.includes(filters.workstream!));
        }
        if (filters.location) {
            employees = employees.filter(e => e.location === filters.location);
        }
        if (filters.status) {
            employees = employees.filter(e => (e.status || 'active') === filters.status);
        }

        return {
            ...state,
            employees
        };
    }, [state, filters]);

    // Computed Data based on Filtered State
    const orgStats = useMemo(() => computeOrgStats(filteredState), [filteredState]);

    // Dynamic Metrics
    const spanByRole = useMemo(() => computeSpanByRole(filteredState), [filteredState]);

    // Pass Color Maps here!
    const titleMetric = useMemo(() => computeAttributeComposition(filteredState, "title", ROLE_COLORS), [filteredState]);
    const skillMetric = useMemo(() => computeAttributeComposition(filteredState, "primarySkill", SKILL_COLORS), [filteredState]);

    // Span Row Data (Individual Leaders)
    const leaderSpanData = useMemo(() => computeSpanOfControl(filteredState), [filteredState]);

    // Highlights logic
    const topSkill = skillMetric[0];
    const topRole = titleMetric[0];
    const highestSpanLeader = leaderSpanData[0]; // Sorted by severity then count

    // Options for Filters
    const filterOptions = useMemo(() => {
        const leaders = getLeaders(state).map(l => ({ label: l.name, value: l.id }));
        const workstreams = Array.from(new Set(state.modules.map(m => m.workstream))).map(w => ({ label: w, value: w }));
        const locations = ["US", "Nearshore", "Offshore"].map(l => ({ label: l, value: l }));
        return { leaders, workstreams, locations };
    }, [state]);

    const handleLeaderClick = (leaderId: string) => {
        setSelectedLeaderMetricsId(leaderId);
    };

    const selectedLeaderMetrics = useMemo(() => {
        if (!selectedLeaderMetricsId) return null;
        return computeLeaderMetrics(state, selectedLeaderMetricsId);
    }, [state, selectedLeaderMetricsId]);

    const renderContent = () => {
        switch (view) {
            case 'overview':
                return (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        key="overview"
                    >
                        {/* High Level Highlights */}
                        <div className="section-header" style={{ marginTop: 0, marginBottom: 16 }}>
                            <h3 style={{ fontSize: 18, fontWeight: 600 }}>Key Highlights</h3>
                        </div>
                        <OverviewHighlights
                            topSkill={topSkill}
                            topRole={topRole}
                            highestSpanLeader={highestSpanLeader}
                        />

                        <div className="section-header" style={{ marginTop: 40, marginBottom: 20 }}>
                            <h3 style={{ fontSize: 18, fontWeight: 600 }}>Snapshot</h3>
                        </div>
                        <Row gutter={[24, 24]}>
                            <Col xs={24} lg={12}>
                                <CompositionTileGrid title="Org Composition" metrics={titleMetric.slice(0, 6)} onTileClick={() => setView('composition')} />
                            </Col>
                            <Col xs={24} lg={12}>
                                <Card className="chart-card" title="Top Leaders by Load" bodyStyle={{ padding: 0 }}>
                                    <LeaderSpanList data={leaderSpanData.slice(0, 5)} onLeaderClick={handleLeaderClick} />
                                </Card>
                            </Col>
                        </Row>
                        <div style={{ textAlign: "center", marginTop: 24, opacity: 0.6 }}>
                            <span>Select a detailed view above for deep dives.</span>
                        </div>
                    </motion.div>
                );
            case 'composition':
                return (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        key="composition"
                    >
                        <CompositionTileGrid title="Org Composition by Title" metrics={titleMetric} onTileClick={(m) => console.log('filter', m.label)} />
                        <div style={{ height: 32 }} />
                        <CompositionTileGrid title="Org Composition by Primary Skill" metrics={skillMetric} onTileClick={(m) => console.log('filter', m.label)} />
                    </motion.div>
                );
            case 'leadership':
                return (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        key="leadership"
                    >
                        <div className="section-header" style={{ marginBottom: 20 }}>
                            <h3 style={{ fontSize: 18, fontWeight: 600 }}>Detailed Leadership Analysis</h3>
                            <p style={{ color: "var(--text-secondary)" }}>Reporting lines, span of control, and identifying bottlenecks.</p>
                        </div>
                        <Row gutter={[24, 24]}>
                            <Col xs={24} lg={14}>
                                <Card className="chart-card" title="Span of Control Distribution">
                                    <SpanByRoleChart data={spanByRole} />
                                </Card>
                            </Col>
                            <Col xs={24} lg={10}>
                                <Card className="chart-card" title="Full Leader Load Ranking" bodyStyle={{ padding: 0 }}>
                                    <LeaderSpanList data={leaderSpanData} onLeaderClick={handleLeaderClick} />
                                </Card>
                            </Col>
                        </Row>
                    </motion.div>
                );
            case 'skills':
                return (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        key="skills"
                    >
                        <div className="section-header" style={{ marginBottom: 20 }}>
                            <h3 style={{ fontSize: 18, fontWeight: 600 }}>Capabilities & Skills</h3>
                            <p style={{ color: "var(--text-secondary)" }}>Distribution of primary skills across the organization.</p>
                        </div>
                        <CompositionTileGrid title="Primary Skill Distribution" metrics={skillMetric} onTileClick={(m) => console.log('filter', m.label)} />
                    </motion.div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="intelligence-dashboard fullscreen" style={{ padding: "32px 40px" }}>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <h1 className="page-title" style={{ marginBottom: 8 }}><BarChartOutlined style={{ marginRight: 12 }} />Intelligence Dashboard</h1>
                        <p className="page-subtitle" style={{ marginBottom: 0 }}>Org Health & Leadership Insights</p>
                    </div>

                    <Segmented
                        options={[
                            { label: 'Overview', value: 'overview', icon: <AppstoreOutlined /> },
                            { label: 'Composition', value: 'composition', icon: <PieChartOutlined /> },
                            { label: 'Leadership', value: 'leadership', icon: <TeamOutlined /> },
                            { label: 'Skills', value: 'skills', icon: <ThunderboltOutlined /> },
                        ]}
                        value={view}
                        onChange={(val) => setView(val as ViewType)}
                        size="large"
                        className="view-selector"
                    />
                </div>

                {/* Global Filter Bar */}
                <div style={{ marginBottom: 32 }}>
                    <GlobalFilterBar
                        filters={filters}
                        onChange={setFilters}
                        options={filterOptions}
                    />
                </div>

                {/* Quick Stats Row (Always Visible) */}
                <Row gutter={[24, 24]} style={{ marginBottom: 40 }}>
                    <Col xs={24} sm={12} lg={6}><Card bordered={false} className="quick-stat-card"><Statistic title="Total Heads" value={orgStats.totalHeadcount} /></Card></Col>
                    <Col xs={24} sm={12} lg={6}><Card bordered={false} className="quick-stat-card"><Statistic title="Leaders" value={orgStats.leaderCount} /></Card></Col>
                    <Col xs={24} sm={12} lg={6}><Card bordered={false} className="quick-stat-card"><Statistic title="Avg Span" value={orgStats.avgSpanOfControl} precision={1} /></Card></Col>
                    <Col xs={24} sm={12} lg={6}><Card bordered={false} className="quick-stat-card"><Statistic title="Open Roles" value={orgStats.openCount} valueStyle={{ color: "#F59E0B" }} /></Card></Col>
                </Row>

                <AnimatePresence mode="wait">
                    {renderContent()}
                </AnimatePresence>

            </motion.div>

            {/* Slide-over for Leader Details */}
            <LeaderInsightsPanel
                open={!!selectedLeaderMetricsId}
                onClose={() => setSelectedLeaderMetricsId(null)}
                metrics={selectedLeaderMetrics}
            />
        </div>
    );
}

export default Intelligence;
