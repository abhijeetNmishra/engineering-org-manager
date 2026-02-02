import { Card, Col, Row, Statistic, Button, Space } from "antd";
import {
    TeamOutlined,
    TrophyOutlined,
    AppstoreOutlined,
    DashboardOutlined,
    RocketOutlined,
    ArrowRightOutlined,
} from "@ant-design/icons";
import { useOrgStore } from "../state/orgStore";

type HomeProps = {
    onNavigate?: (route: string) => void;
};

export default function Home({ onNavigate }: HomeProps) {
    const { state } = useOrgStore();

    const stats = {
        employees: state.employees.length,
        modules: state.modules.length,
        ownership: new Set(state.ownership.map((o) => o.moduleId)).size,
        healthyModules: state.modules.filter((m) => m.health === "Healthy").length,
    };

    const features = [
        {
            icon: <TeamOutlined style={{ fontSize: 32, color: "#FF9B26" }} />,
            title: "Org Structure Visualization",
            description:
                "Interactive org chart showing reporting lines, roles, and team structure at a glance.",
            path: "orgchart",
        },
        {
            icon: <TrophyOutlined style={{ fontSize: 32, color: "#6B21EF" }} />,
            title: "Skills & Talent Management",
            description:
                "Track technical skills, skill levels, tenure, and career progression for every team member.",
            path: "people",
        },
        {
            icon: <AppstoreOutlined style={{ fontSize: 32, color: "#077AC7" }} />,
            title: "Module Ownership Tracking",
            description:
                "Monitor module health, ownership coverage, priorities, and execution risk across workstreams.",
            path: "modules",
        },
        {
            icon: <DashboardOutlined style={{ fontSize: 32, color: "#FF6D5A" }} />,
            title: "Data-Driven Insights",
            description:
                "Real-time alerts, span of control metrics, coverage heatmaps, and org health indicators.",
            path: "dashboard",
        },
    ];

    return (
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
            {/* Hero Section */}
            <div
                style={{
                    textAlign: "center",
                    padding: "60px 24px 80px",
                    position: "relative",
                }}
            >
                <div
                    style={{
                        fontSize: 56,
                        fontWeight: 900,
                        letterSpacing: "-1.5px",
                        marginBottom: 20,
                        background: "var(--gradient-product)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        lineHeight: 1.2,
                    }}
                >
                    Shipt Marketplace
                    <br />
                    Engineering Org Manager
                </div>

                <div
                    style={{
                        fontSize: 24,
                        color: "var(--text-secondary)",
                        marginBottom: 12,
                        fontWeight: 600,
                    }}
                >
                    Single Source of Truth for Engineering Leadership
                </div>

                <div
                    style={{
                        fontSize: 16,
                        color: "var(--text-muted)",
                        marginBottom: 40,
                        maxWidth: 700,
                        margin: "0 auto 40px",
                        lineHeight: 1.6,
                    }}
                >
                    A comprehensive platform to visualize your organization, track talent, manage module
                    ownership, and drive data-informed decisions across the entire Shipt Marketplace Engineering
                    team.
                </div>

                <Space size="large">
                    <Button
                        type="primary"
                        size="large"
                        icon={<RocketOutlined />}
                        onClick={() => onNavigate?.("dashboard")}
                        style={{ height: 48, fontSize: 16, fontWeight: 600 }}
                    >
                        View Dashboard
                    </Button>
                    <Button
                        size="large"
                        icon={<TeamOutlined />}
                        onClick={() => onNavigate?.("orgchart")}
                        style={{ height: 48, fontSize: 16, fontWeight: 600 }}
                    >
                        Explore Org Chart
                    </Button>
                </Space>
            </div>

            {/* Quick Stats */}
            <Row gutter={[24, 24]} style={{ marginBottom: 60 }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="glass" style={{ textAlign: "center" }}>
                        <Statistic
                            title="Team Members"
                            value={stats.employees}
                            prefix={<TeamOutlined style={{ color: "var(--text-accent)" }} />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="glass" style={{ textAlign: "center" }}>
                        <Statistic
                            title="Modules Tracked"
                            value={stats.modules}
                            prefix={<AppstoreOutlined style={{ color: "var(--text-accent)" }} />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="glass" style={{ textAlign: "center" }}>
                        <Statistic
                            title="Modules Owned"
                            value={stats.ownership}
                            suffix={`/ ${stats.modules}`}
                            prefix={<DashboardOutlined style={{ color: "var(--text-accent)" }} />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="glass" style={{ textAlign: "center" }}>
                        <Statistic
                            title="Healthy Modules"
                            value={stats.healthyModules}
                            prefix={<TrophyOutlined style={{ color: "var(--text-accent)" }} />}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Feature Highlights */}
            <div style={{ marginBottom: 60 }}>
                <div
                    style={{
                        fontSize: 32,
                        fontWeight: 800,
                        textAlign: "center",
                        marginBottom: 16,
                        color: "var(--text-primary)",
                    }}
                >
                    Key Features
                </div>
                <div
                    style={{
                        fontSize: 16,
                        color: "var(--text-muted)",
                        textAlign: "center",
                        marginBottom: 40,
                    }}
                >
                    Everything you need to manage and understand your engineering organization
                </div>

                <Row gutter={[24, 24]}>
                    {features.map((feature, idx) => (
                        <Col xs={24} md={12} key={idx}>
                            <Card
                                className="glass"
                                hoverable
                                onClick={() => onNavigate?.(feature.path)}
                                style={{
                                    height: "100%",
                                    cursor: "pointer",
                                    transition: "all 0.3s ease",
                                }}
                            >
                                <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
                                    <div
                                        style={{
                                            width: 64,
                                            height: 64,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            background: "var(--bg-tertiary)",
                                            borderRadius: 12,
                                            flexShrink: 0,
                                        }}
                                    >
                                        {feature.icon}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div
                                            style={{
                                                fontSize: 18,
                                                fontWeight: 700,
                                                marginBottom: 8,
                                                color: "var(--text-primary)",
                                            }}
                                        >
                                            {feature.title}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 14,
                                                color: "var(--text-secondary)",
                                                lineHeight: 1.6,
                                                marginBottom: 12,
                                            }}
                                        >
                                            {feature.description}
                                        </div>
                                        <div style={{ color: "var(--text-accent)", fontWeight: 600, fontSize: 14 }}>
                                            Explore <ArrowRightOutlined style={{ fontSize: 12 }} />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </div>

            {/* Getting Started */}
            <Card className="glass" style={{ marginBottom: 40 }}>
                <Row gutter={[40, 40]} align="middle">
                    <Col xs={24} lg={14}>
                        <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 16, color: "var(--text-primary)" }}>
                            Getting Started
                        </div>
                        <div style={{ fontSize: 16, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 20 }}>
                            Navigate through the sidebar to explore different views:
                        </div>
                        <ul style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 2, paddingLeft: 24 }}>
                            <li>
                                <strong>Dashboard:</strong> Get a high-level overview with org health alerts, span of
                                control metrics, and coverage heatmaps
                            </li>
                            <li>
                                <strong>People & Reporting:</strong> View the team directory, manage employee details,
                                and track skills across the organization
                            </li>
                            <li>
                                <strong>Modules & Ownership:</strong> Explore module hierarchy, assign owners, and
                                monitor health and priorities
                            </li>
                            <li>
                                <strong>Org Chart:</strong> Visualize the reporting structure with an interactive,
                                collapsible hierarchy
                            </li>
                        </ul>
                    </Col>
                    <Col xs={24} lg={10}>
                        <div
                            style={{
                                padding: 32,
                                background: "var(--bg-tertiary)",
                                borderRadius: 12,
                                textAlign: "center",
                            }}
                        >
                            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: "var(--text-primary)" }}>
                                Data-Driven Leadership
                            </div>
                            <div style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 24, lineHeight: 1.6 }}>
                                Make informed decisions about team structure, talent development, and execution risk with
                                real-time insights and comprehensive visibility.
                            </div>
                            <Button
                                type="primary"
                                size="large"
                                icon={<DashboardOutlined />}
                                onClick={() => onNavigate?.("dashboard")}
                                block
                            >
                                Open Dashboard
                            </Button>
                        </div>
                    </Col>
                </Row>
            </Card>
        </div>
    );
}
