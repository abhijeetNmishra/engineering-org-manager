import { useState, useMemo } from "react";
import { Row, Col, Card, Drawer, Statistic, Select, Tag, Divider, Empty, Modal, Button } from "antd";
import { TeamOutlined, UserOutlined, BarChartOutlined, CloseOutlined, ExpandOutlined, CompressOutlined } from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from "recharts";
import { useOrgStore } from "../state/orgStore";
import {
    computeOrgStats,
    computeTitleDistribution,
    computeSkillDistribution,
    computeSpanDistribution,
    computeLeaderMetrics,
    getLeaders,
    getModuleColor,
} from "../domain/orgMetrics";
import type { LeaderMetrics } from "../domain/types";
import "./Intelligence.css";

// Chart colors
const CHART_COLORS = [
    "#6B21EF", // Purple
    "#3B82F6", // Blue
    "#10B981", // Green
    "#F59E0B", // Amber
    "#EC4899", // Pink
    "#EF4444", // Red
    "#8B5CF6", // Violet
    "#06B6D4", // Cyan
];

// Card animation
const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: {
            delay: i * 0.1,
            duration: 0.4,
        },
    }),
};

// Custom tooltip component
function CustomTooltip({ active, payload, label }: any) {
    if (active && payload && payload.length) {
        return (
            <div className="chart-tooltip">
                <p className="tooltip-label">{label}</p>
                <p className="tooltip-value">{payload[0].value} people</p>
            </div>
        );
    }
    return null;
}

// Chart type definition
type ChartType = "title" | "skill" | "span" | null;

// Expandable Chart Card Component
function ExpandableChartCard({
    title,
    icon,
    chartType,
    expandedChart,
    onExpand,
    children,
    index,
}: {
    title: string;
    icon: React.ReactNode;
    chartType: ChartType;
    expandedChart: ChartType;
    onExpand: (type: ChartType) => void;
    children: React.ReactNode;
    index: number;
}) {
    return (
        <motion.div
            custom={index}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="chart-card-wrapper"
        >
            <Card
                className="chart-card"
                title={
                    <span className="card-title">
                        {icon} {title}
                    </span>
                }
                extra={
                    <Button
                        type="text"
                        icon={expandedChart === chartType ? <CompressOutlined /> : <ExpandOutlined />}
                        onClick={() => onExpand(expandedChart === chartType ? null : chartType)}
                        className="expand-btn"
                        title={expandedChart === chartType ? "Collapse" : "Expand to fullscreen"}
                    />
                }
            >
                {children}
            </Card>
        </motion.div>
    );
}

// Leader Insights Side Panel
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

    const titleMixData = Object.entries(metrics.titleMix).map(([name, value]) => ({
        name,
        value,
    }));

    const skillMixData = Object.entries(metrics.skillMix).map(([name, value]) => ({
        name,
        value,
    }));

    return (
        <Drawer
            title={null}
            placement="right"
            width={460}
            onClose={onClose}
            open={open}
            styles={{
                body: { padding: 0 },
                header: { display: 'none' },
            }}
        >
            <div className="insights-panel">
                {/* Header */}
                <div className="insights-header">
                    <button className="close-btn" onClick={onClose}>
                        <CloseOutlined />
                    </button>
                    <div className="leader-avatar">
                        <UserOutlined />
                    </div>
                    <h2 className="leader-name">{metrics.name}</h2>
                    <p className="leader-title">{metrics.title}</p>
                </div>

                {/* Quick Stats */}
                <div className="insights-stats">
                    <div className="stat-box">
                        <Statistic
                            title="Direct Reports"
                            value={metrics.directReports}
                            valueStyle={{ fontSize: 32, fontWeight: 700 }}
                        />
                    </div>
                    <div className="stat-box">
                        <Statistic
                            title="Total Reports"
                            value={metrics.totalReports}
                            valueStyle={{ fontSize: 32, fontWeight: 700 }}
                        />
                    </div>
                </div>

                <Divider />

                {/* Title Mix */}
                {titleMixData.length > 0 && (
                    <div className="insight-section">
                        <h3 className="section-title">Title Mix</h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={titleMixData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" />
                                <XAxis type="number" />
                                <YAxis
                                    type="category"
                                    dataKey="name"
                                    width={120}
                                    tick={{ fontSize: 12 }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="value" fill="#6B21EF" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                <Divider />

                {/* Skill Mix */}
                {skillMixData.length > 0 && (
                    <div className="insight-section">
                        <h3 className="section-title">Skill Mix</h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={skillMixData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={70}
                                    paddingAngle={2}
                                    dataKey="value"
                                >
                                    {skillMixData.map((_, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                                        />
                                    ))}
                                </Pie>
                                <Legend />
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                )}

                <Divider />

                {/* Workstreams */}
                <div className="insight-section">
                    <h3 className="section-title">Workstreams Touched</h3>
                    <div className="workstream-tags">
                        {metrics.workstreamsTouched.length > 0 ? (
                            metrics.workstreamsTouched.map((ws) => (
                                <Tag key={ws} color={getModuleColor(ws)}>
                                    {ws}
                                </Tag>
                            ))
                        ) : (
                            <span className="no-data">No workstreams assigned</span>
                        )}
                    </div>
                </div>
            </div>
        </Drawer>
    );
}

// Full-screen Chart Modal
function FullScreenChartModal({
    open,
    onClose,
    title,
    children,
}: {
    open: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            width="95vw"
            className="fullscreen-chart-modal"
            centered
            closeIcon={<CompressOutlined />}
            title={
                <span className="modal-title">
                    {title}
                    <span className="modal-hint">Press ESC or click X to collapse</span>
                </span>
            }
            styles={{
                body: { height: 'calc(90vh - 60px)', padding: '24px' },
            }}
        >
            <AnimatePresence mode="wait">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    style={{ height: '100%' }}
                >
                    {children}
                </motion.div>
            </AnimatePresence>
        </Modal>
    );
}

export function Intelligence() {
    const { state } = useOrgStore();
    const [selectedLeaderId, setSelectedLeaderId] = useState<string | null>(null);
    const [expandedChart, setExpandedChart] = useState<ChartType>(null);

    // Computed data
    const orgStats = useMemo(() => computeOrgStats(state), [state]);
    const titleDistribution = useMemo(() => computeTitleDistribution(state), [state]);
    const skillDistribution = useMemo(() => computeSkillDistribution(state), [state]);
    const spanDistribution = useMemo(() => computeSpanDistribution(state), [state]);
    const leaders = useMemo(() => getLeaders(state), [state]);

    // Selected leader metrics
    const selectedLeaderMetrics = useMemo(() => {
        if (!selectedLeaderId) return null;
        return computeLeaderMetrics(state, selectedLeaderId);
    }, [state, selectedLeaderId]);

    // Render chart content (reusable for both inline and fullscreen)
    const renderTitleChart = (height: number) => (
        titleDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={height}>
                <BarChart data={titleDistribution} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="#6B21EF" radius={[0, 4, 4, 0]} />
                </BarChart>
            </ResponsiveContainer>
        ) : <Empty description="No data available" />
    );

    const renderSkillChart = (height: number) => (
        skillDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={height}>
                <PieChart>
                    <Pie
                        data={skillDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={height > 400 ? 100 : 60}
                        outerRadius={height > 400 ? 160 : 100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) =>
                            `${name} (${((percent || 0) * 100).toFixed(0)}%)`
                        }
                        labelLine={false}
                    >
                        {skillDistribution.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        ) : <Empty description="No skill data available" />
    );

    const renderSpanChart = (height: number) => (
        spanDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={height}>
                <BarChart data={spanDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        ) : <Empty description="No span data available" />
    );

    return (
        <div className="intelligence-dashboard fullscreen">
            {/* Header */}
            <motion.div
                className="intel-header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h1 className="page-title">
                    <BarChartOutlined /> Intelligence Dashboard
                </h1>
                <p className="page-subtitle">
                    Understand balance, gaps, and risk across your organization
                </p>
            </motion.div>

            {/* Quick Stats Row */}
            <Row gutter={[16, 16]} className="quick-stats-row">
                <Col xs={6}>
                    <div className="quick-stat-card">
                        <Statistic
                            title="Total"
                            value={orgStats.totalHeadcount}
                            prefix={<TeamOutlined />}
                        />
                    </div>
                </Col>
                <Col xs={6}>
                    <div className="quick-stat-card">
                        <Statistic title="Leaders" value={orgStats.leaderCount} />
                    </div>
                </Col>
                <Col xs={6}>
                    <div className="quick-stat-card">
                        <Statistic title="ICs" value={orgStats.icCount} />
                    </div>
                </Col>
                <Col xs={6}>
                    <div className="quick-stat-card">
                        <Statistic title="Avg Span" value={orgStats.avgSpanOfControl} precision={1} />
                    </div>
                </Col>
            </Row>

            {/* Charts Grid - Full Height */}
            <div className="charts-container">
                <Row gutter={[24, 24]} className="charts-grid">
                    {/* Title Distribution */}
                    <Col xs={24} lg={12}>
                        <ExpandableChartCard
                            title="Headcount by Title"
                            icon={<TeamOutlined />}
                            chartType="title"
                            expandedChart={expandedChart}
                            onExpand={setExpandedChart}
                            index={0}
                        >
                            {renderTitleChart(320)}
                        </ExpandableChartCard>
                    </Col>

                    {/* Skill Distribution */}
                    <Col xs={24} lg={12}>
                        <ExpandableChartCard
                            title="Skill Distribution"
                            icon={<BarChartOutlined />}
                            chartType="skill"
                            expandedChart={expandedChart}
                            onExpand={setExpandedChart}
                            index={1}
                        >
                            {renderSkillChart(320)}
                        </ExpandableChartCard>
                    </Col>

                    {/* Span of Control Distribution */}
                    <Col xs={24} lg={12}>
                        <ExpandableChartCard
                            title="Leader Span of Control"
                            icon={<UserOutlined />}
                            chartType="span"
                            expandedChart={expandedChart}
                            onExpand={setExpandedChart}
                            index={2}
                        >
                            {renderSpanChart(280)}
                        </ExpandableChartCard>
                    </Col>

                    {/* Leader Selector */}
                    <Col xs={24} lg={12}>
                        <motion.div
                            custom={3}
                            initial="hidden"
                            animate="visible"
                            variants={cardVariants}
                        >
                            <Card
                                className="chart-card leader-card"
                                title={
                                    <span className="card-title">
                                        <UserOutlined /> Leader Insights
                                    </span>
                                }
                                extra={
                                    <Select
                                        placeholder="Select a leader"
                                        style={{ width: 260 }}
                                        value={selectedLeaderId}
                                        onChange={setSelectedLeaderId}
                                        options={leaders.map((l) => ({
                                            value: l.id,
                                            label: `${l.name} - ${l.title}`,
                                        }))}
                                        allowClear
                                        showSearch
                                        filterOption={(input, option) =>
                                            (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                                        }
                                    />
                                }
                            >
                                {selectedLeaderId ? (
                                    <div className="selected-leader-prompt">
                                        <p>
                                            Viewing insights for <strong>{selectedLeaderMetrics?.name}</strong>
                                        </p>
                                        <div className="leader-quick-stats">
                                            <Statistic title="Direct" value={selectedLeaderMetrics?.directReports || 0} />
                                            <Statistic title="Total" value={selectedLeaderMetrics?.totalReports || 0} />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="leader-prompt">
                                        <UserOutlined className="prompt-icon" />
                                        <p>Select a leader to view their team metrics</p>
                                    </div>
                                )}
                            </Card>
                        </motion.div>
                    </Col>
                </Row>
            </div>

            {/* Full-screen Chart Modals */}
            <FullScreenChartModal
                open={expandedChart === "title"}
                onClose={() => setExpandedChart(null)}
                title="Headcount by Title"
            >
                {renderTitleChart(window.innerHeight * 0.75)}
            </FullScreenChartModal>

            <FullScreenChartModal
                open={expandedChart === "skill"}
                onClose={() => setExpandedChart(null)}
                title="Skill Distribution"
            >
                {renderSkillChart(window.innerHeight * 0.75)}
            </FullScreenChartModal>

            <FullScreenChartModal
                open={expandedChart === "span"}
                onClose={() => setExpandedChart(null)}
                title="Leader Span of Control"
            >
                {renderSpanChart(window.innerHeight * 0.75)}
            </FullScreenChartModal>

            {/* Leader Insights Panel */}
            <LeaderInsightsPanel
                open={selectedLeaderId !== null}
                onClose={() => setSelectedLeaderId(null)}
                metrics={selectedLeaderMetrics}
            />
        </div>
    );
}

export default Intelligence;
