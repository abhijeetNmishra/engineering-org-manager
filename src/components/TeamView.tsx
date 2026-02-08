import { Card, Row, Col, Statistic, Tag, Space, Divider, Typography, Avatar } from 'antd';
import { TeamOutlined, UserOutlined, TrophyOutlined } from '@ant-design/icons';
import type { Employee } from '../domain/types';

const { Title, Text } = Typography;

interface TeamViewProps {
    employees: Employee[];
}

interface TeamStats {
    director: Employee;
    teamMembers: Employee[];
    totalCount: number;
    directReports: Employee[];
    skills: Map<string, number>;
    roles: Map<string, number>;
}

export default function TeamView({ employees }: TeamViewProps) {
    // Find all directors (flexible matching)
    // Includes "Director", "Senior Director", "Head of X", "VP" (if they have teams)
    const directors = employees.filter((e) => {
        if (!e.title) return false; // Safety check
        const title = e.title.toLowerCase();
        return (
            (title.includes('director') ||
                title.includes('head of') ||
                title.includes('vp') ||
                title.includes('vice president')) &&
            // Optional: Exclude Associate Directors if they are ICs, but for now include them if they have reports
            // We can check if they have reports to be sure they are a "Team"
            employees.some(sub => sub.managerId === e.id)
        );
    });

    // Build team stats for each director
    const getTeamStats = (director: Employee): TeamStats => {
        const getAllReports = (managerId: string, visited = new Set<string>()): Employee[] => {
            if (visited.has(managerId)) return [];
            visited.add(managerId);

            const direct = employees.filter((e) => e.managerId === managerId);
            const indirect = direct.flatMap((e) => getAllReports(e.id, new Set(visited)));
            return [...direct, ...indirect];
        };

        const teamMembers = getAllReports(director.id);
        const directReports = employees.filter((e) => e.managerId === director.id);

        // Count skills
        const skills = new Map<string, number>();
        teamMembers.forEach((member) => {
            member.primarySkill && skills.set(member.primarySkill, (skills.get(member.primarySkill) || 0) + 1);
            member.secondarySkills?.forEach((skill) => {
                skills.set(skill, (skills.get(skill) || 0) + 1);
            });
        });

        // Count roles
        const roles = new Map<string, number>();
        teamMembers.forEach((member) => {
            roles.set(member.title, (roles.get(member.title) || 0) + 1);
        });

        return {
            director,
            teamMembers,
            totalCount: teamMembers.length,
            directReports,
            skills,
            roles,
        };
    };

    const teamsData = directors.map((d) => getTeamStats(d));

    // Sort by team size (largest first)
    teamsData.sort((a, b) => b.totalCount - a.totalCount);

    return (
        <div style={{ padding: '0 8px' }}>
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <Title level={4} style={{ margin: 0, fontWeight: 600 }}>
                        <TeamOutlined style={{ marginRight: 8, color: '#FF9B26' }} />
                        Director Teams
                    </Title>
                    <Text type="secondary">
                        {directors.length} leadership teams found across the organization
                    </Text>
                </div>
            </div>

            <Row gutter={[24, 24]}>
                {teamsData.map((team) => {
                    const topSkills = Array.from(team.skills.entries())
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 5);

                    return (
                        <Col xs={24} lg={12} xl={8} key={team.director.id}>
                            <Card
                                hoverable
                                className="glass-card"
                                style={{
                                    height: '100%',
                                    borderRadius: 12,
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    backdropFilter: 'blur(10px)'
                                }}
                                title={
                                    <Space align="center" style={{ width: '100%', padding: '8px 0' }}>
                                        <Avatar
                                            size={48}
                                            style={{
                                                background: 'linear-gradient(135deg, #FF9B26 0%, #FF6D5A 100%)',
                                                border: '2px solid rgba(255, 255, 255, 0.2)',
                                                boxShadow: '0 4px 12px rgba(255, 109, 90, 0.3)'
                                            }}
                                            icon={<UserOutlined />}
                                        >
                                            {team.director.name[0]}
                                        </Avatar>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                            <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.2 }}>
                                                {team.director.name}
                                            </div>
                                            <Text type="secondary" style={{ fontSize: 13 }}>
                                                {team.director.title}
                                            </Text>
                                        </div>
                                    </Space>
                                }
                            >
                                {/* Team Size Stats */}
                                <Row gutter={16} style={{ marginBottom: 20 }}>
                                    <Col span={12}>
                                        <div style={{
                                            background: 'rgba(255, 255, 255, 0.03)',
                                            padding: 12,
                                            borderRadius: 8,
                                            textAlign: 'center'
                                        }}>
                                            <Statistic
                                                title={<Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Team</Text>}
                                                value={team.totalCount}
                                                prefix={<TeamOutlined style={{ color: '#FF9B26' }} />}
                                                valueStyle={{ fontSize: 24, fontWeight: 600 }}
                                            />
                                        </div>
                                    </Col>
                                    <Col span={12}>
                                        <div style={{
                                            background: 'rgba(255, 255, 255, 0.03)',
                                            padding: 12,
                                            borderRadius: 8,
                                            textAlign: 'center'
                                        }}>
                                            <Statistic
                                                title={<Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>Directs</Text>}
                                                value={team.directReports.length}
                                                prefix={<UserOutlined style={{ color: '#6C5CE7' }} />}
                                                valueStyle={{ fontSize: 24, fontWeight: 600 }}
                                            />
                                        </div>
                                    </Col>
                                </Row>

                                <Divider style={{ margin: '16px 0', borderColor: 'rgba(255,255,255,0.08)' }} />

                                {/* Top Skills */}
                                <div style={{ marginBottom: 16 }}>
                                    <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>
                                        <TrophyOutlined style={{ marginRight: 6 }} /> Top Skills
                                    </Text>
                                    <Space wrap size={[6, 8]}>
                                        {topSkills.map(([skill, count]) => (
                                            <Tag
                                                color="blue"
                                                key={skill}
                                                style={{
                                                    borderRadius: 12,
                                                    border: 'none',
                                                    background: 'rgba(24, 144, 255, 0.15)',
                                                    color: '#40a9ff',
                                                    padding: '2px 10px'
                                                }}
                                            >
                                                {skill} <span style={{ opacity: 0.7, marginLeft: 4 }}>{count}</span>
                                            </Tag>
                                        ))}
                                        {topSkills.length === 0 && <Text type="secondary" style={{ fontSize: 12, fontStyle: 'italic' }}>No skills recorded</Text>}
                                    </Space>
                                </div>

                                {/* Role Distribution */}
                                <div>
                                    <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>
                                        Role Distribution
                                    </Text>
                                    <Space wrap size={[6, 8]}>
                                        {Array.from(team.roles.entries())
                                            .sort((a, b) => b[1] - a[1])
                                            .slice(0, 4)
                                            .map(([role, count]) => (
                                                <Tag
                                                    key={role}
                                                    color="purple"
                                                    style={{
                                                        borderRadius: 12,
                                                        border: 'none',
                                                        background: 'rgba(114, 46, 209, 0.15)',
                                                        color: '#9254de',
                                                        padding: '2px 10px'
                                                    }}
                                                >
                                                    {role} <span style={{ opacity: 0.7, marginLeft: 4 }}>{count}</span>
                                                </Tag>
                                            ))}
                                    </Space>
                                </div>

                                <Divider style={{ margin: '16px 0', borderColor: 'rgba(255,255,255,0.08)' }} />

                                {/* Direct Reports Preview */}
                                <div>
                                    <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>
                                        Direct Reports
                                    </Text>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        {team.directReports.slice(0, 3).map((report) => (
                                            <div
                                                key={report.id}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    padding: '6px 8px',
                                                    borderRadius: 6,
                                                    background: 'rgba(255, 255, 255, 0.02)'
                                                }}
                                            >
                                                <Avatar size={20} style={{ backgroundColor: '#87d068', marginRight: 8, fontSize: 10 }}>
                                                    {report.name[0]}
                                                </Avatar>
                                                <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{report.name}</span>
                                                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginLeft: 6 }}>{report.title}</span>
                                                </div>
                                            </div>
                                        ))}
                                        {team.directReports.length > 3 && (
                                            <Text type="secondary" style={{ fontSize: 11, paddingLeft: 8, marginTop: 4 }}>
                                                +{team.directReports.length - 3} more members
                                            </Text>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        </Col>
                    );
                })}
            </Row>

            {teamsData.length === 0 && (
                <Card className="glass" style={{ textAlign: 'center', padding: '64px 24px', borderRadius: 16 }}>
                    <div style={{
                        background: 'rgba(255, 155, 38, 0.1)',
                        width: 100,
                        height: 100,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 24px'
                    }}>
                        <TeamOutlined style={{ fontSize: 48, color: '#FF9B26' }} />
                    </div>
                    <Title level={3} style={{ marginBottom: 12 }}>No Director Teams Found</Title>
                    <Text type="secondary" style={{ fontSize: 16, maxWidth: 500, display: 'block', margin: '0 auto' }}>
                        We couldn't find any employees with "Director", "VP", or "Head of" in their title who also have direct reports.
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 14 }}>
                        Check your organization data or try importing a new dataset.
                    </Text>
                </Card>
            )}
        </div>
    );
}
