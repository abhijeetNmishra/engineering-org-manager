import React from "react";
import { Row, Col, Statistic, Tag, Tooltip } from "antd";
import { TeamOutlined, AppstoreOutlined, ApartmentOutlined, UserOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";
import { useOrgStore } from "../state/orgStore";
import { computeOrgStats, computeModuleSummaries, getModuleColor } from "../domain/orgMetrics";
import type { ModuleSummary } from "../domain/types";
import "./OrgOverview.css";

// Animation variants for cards
const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: {
            delay: i * 0.1,
            duration: 0.4,
            ease: "easeOut",
        },
    }),
    hover: {
        y: -8,
        boxShadow: "0 20px 40px rgba(107, 33, 239, 0.25)",
        transition: { duration: 0.2 },
    },
};

// Statistic animation
const statVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.5, ease: "easeOut" },
    },
};

// Module Card Component
function ModuleCard({
    module,
    index,
    onClick
}: {
    module: ModuleSummary;
    index: number;
    onClick?: () => void;
}) {
    const moduleColor = getModuleColor(module.workstream);
    const icPercent = module.headcount > 0
        ? Math.round((module.icCount / module.headcount) * 100)
        : 0;
    const leaderPercent = 100 - icPercent;

    return (
        <motion.div
            className="module-card"
            custom={index}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            variants={cardVariants}
            onClick={onClick}
            style={{
                // @ts-ignore
                "--module-color": moduleColor,
                // @ts-ignore
                "--module-color-bg": `${moduleColor}0D`, // ~5% opacity
                // @ts-ignore
                "--module-color-shadow": `${moduleColor}66`, // ~40% opacity
                cursor: onClick ? 'pointer' : 'default',
            } as React.CSSProperties}
        >
            {/* Module color indicator */}
            <div
                className="module-color-dot"
                style={{ background: moduleColor }}
            />

            {/* Module name */}
            <h3 className="module-card-title">{module.moduleName}</h3>

            {/* Workstream tag */}
            <Tag color={moduleColor} className="workstream-tag">
                {module.workstream}
            </Tag>

            {/* Submodules */}
            {module.submodules.length > 0 && (
                <div className="submodules-container">
                    {module.submodules.slice(0, 4).map(sub => (
                        <Tag key={sub} className="submodule-chip">{sub}</Tag>
                    ))}
                    {module.submodules.length > 4 && (
                        <Tooltip title={module.submodules.slice(4).join(", ")}>
                            <Tag className="submodule-more">+{module.submodules.length - 4}</Tag>
                        </Tooltip>
                    )}
                </div>
            )}

            {/* Headcount */}
            <div className="module-headcount">
                <span className="headcount-number">{module.headcount}</span>
                <span className="headcount-label">people</span>
            </div>

            {/* IC vs Leader mix bar */}
            <Tooltip title={`${module.icCount} ICs, ${module.leaderCount} Leaders`}>
                <div className="mix-bar-container">
                    <div className="mix-bar">
                        <div
                            className="mix-bar-ic"
                            style={{ width: `${icPercent}%` }}
                        />
                        <div
                            className="mix-bar-leader"
                            style={{ width: `${leaderPercent}%` }}
                        />
                    </div>
                    <div className="mix-bar-labels">
                        <span>ICs: {module.icCount}</span>
                        <span>Leaders: {module.leaderCount}</span>
                    </div>
                </div>
            </Tooltip>
        </motion.div>
    );
}

export function OrgOverview() {
    const { state } = useOrgStore();

    // Compute stats and module summaries
    const orgStats = React.useMemo(() => computeOrgStats(state), [state]);
    const moduleSummaries = React.useMemo(() => computeModuleSummaries(state), [state]);

    return (
        <div className="org-overview">
            {/* Hero Section */}
            <motion.div
                className="org-overview-hero"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <h1 className="hero-title">Marketplace Engineering</h1>
                <p className="hero-subtitle">Organization Overview</p>

                {/* Hero Stats */}
                <Row gutter={[32, 24]} justify="center" className="hero-stats-row">
                    <Col xs={12} sm={6}>
                        <motion.div
                            className="hero-stat-card"
                            variants={statVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            <Statistic
                                title={<span className="stat-label"><TeamOutlined /> Total Headcount</span>}
                                value={orgStats.totalHeadcount}
                                valueStyle={{
                                    fontSize: '48px',
                                    fontWeight: 700,
                                    background: 'linear-gradient(135deg, #6B21EF 0%, #FF6D5A 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                }}
                            />
                        </motion.div>
                    </Col>

                    <Col xs={12} sm={6}>
                        <motion.div
                            className="hero-stat-card"
                            variants={statVariants}
                            initial="hidden"
                            animate="visible"
                            transition={{ delay: 0.1 }}
                        >
                            <Statistic
                                title={<span className="stat-label"><AppstoreOutlined /> Modules</span>}
                                value={orgStats.moduleCount}
                                valueStyle={{ fontSize: '48px', fontWeight: 700 }}
                            />
                        </motion.div>
                    </Col>

                    <Col xs={12} sm={6}>
                        <motion.div
                            className="hero-stat-card"
                            variants={statVariants}
                            initial="hidden"
                            animate="visible"
                            transition={{ delay: 0.2 }}
                        >
                            <Statistic
                                title={<span className="stat-label"><ApartmentOutlined /> Submodules</span>}
                                value={orgStats.submoduleCount}
                                valueStyle={{ fontSize: '48px', fontWeight: 700 }}
                            />
                        </motion.div>
                    </Col>

                    <Col xs={12} sm={6}>
                        <motion.div
                            className="hero-stat-card"
                            variants={statVariants}
                            initial="hidden"
                            animate="visible"
                            transition={{ delay: 0.3 }}
                        >
                            <Statistic
                                title={<span className="stat-label"><UserOutlined /> Leaders</span>}
                                value={orgStats.leaderCount}
                                valueStyle={{ fontSize: '48px', fontWeight: 700 }}
                            />
                        </motion.div>
                    </Col>
                </Row>

                {/* Additional quick stats */}
                <div className="quick-stats">
                    <Tag color="green">Active: {orgStats.activeCount}</Tag>
                    {orgStats.onLeaveCount > 0 && (
                        <Tag color="orange">On Leave: {orgStats.onLeaveCount}</Tag>
                    )}
                    {orgStats.openCount > 0 && (
                        <Tag color="default">Open Roles: {orgStats.openCount}</Tag>
                    )}
                    <Tag color="purple">Avg Span: {orgStats.avgSpanOfControl}</Tag>
                </div>
            </motion.div>

            {/* Module Cards Grid */}
            <div className="modules-section">
                <h2 className="section-title">Modules Overview</h2>

                <Row gutter={[24, 24]} className="module-cards-grid">
                    {moduleSummaries.map((module, index) => (
                        <Col xs={24} sm={12} lg={8} xl={6} key={module.moduleId}>
                            <ModuleCard
                                module={module}
                                index={index}
                                onClick={() => {
                                    // Navigate to module details or filter
                                    console.log('Navigate to module:', module.moduleName);
                                }}
                            />
                        </Col>
                    ))}
                </Row>

                {moduleSummaries.length === 0 && (
                    <div className="empty-state">
                        <AppstoreOutlined style={{ fontSize: 48, opacity: 0.3 }} />
                        <p>No modules found. Import org data to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default OrgOverview;
