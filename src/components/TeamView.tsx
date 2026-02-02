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
    // Find all directors
    const directors = employees.filter((e) => e.title === 'Director');

    // Build team stats for each director
    const getTeamStats = (director: Employee): TeamStats => {
        const getAllReports = (managerId: string): Employee[] => {
            const direct = employees.filter((e) => e.managerId === managerId);
            const indirect = direct.flatMap((e) => getAllReports(e.id));
            return [...direct, ...indirect];
        };

        const teamMembers = getAllReports(director.id);
        const directReports = employees.filter((e) => e.managerId === director.id);

        // Count skills
        const skills = new Map<string, number>();
        teamMembers.forEach((member) => {
            member.primarySkills?.forEach((skill) => {
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
        <div>
            <div style={{ marginBottom: 16 }}>
                <Title level={4} style={{ margin: 0 }}>
                    <TeamOutlined /> Director Teams
                </Title>
                <Text type="secondary">{directors.length} teams across the organization</Text>
            </div>

            <Row gutter={[16, 16]}>
                {teamsData.map((team) => {
                    const topSkills = Array.from(team.skills.entries())
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 5);

                    return (
                        <Col xs={24} lg={12} xl={8} key={team.director.id}>
                            <Card
                                className="glass"
                                style={{ height: '100%' }}
                                title={
                                    <Space>
                                        <Avatar
                                            size="small"
                                            style={{
                                                background: 'linear-gradient(135deg, #FF9B26 0%, #FF6D5A 100%)',
                                            }}
                                            icon={<UserOutlined />}
                                        />
                                        <div>
                                            <div style={{ fontSize: 15, fontWeight: 700 }}>
                                                {team.director.name}
                                            </div>
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                {team.director.title}
                                            </Text>
                                        </div>
                                    </Space>
                                }
                            >
                                {/* Team Size Stats */}
                                <Row gutter={16} style={{ marginBottom: 16 }}>
                                    <Col span={12}>
                                        <Statistic
                                            title="Total Team"
                                            value={team.totalCount}
                                            prefix={<TeamOutlined />}
                                            valueStyle={{ fontSize: 24 }}
                                        />
                                    </Col>
                                    <Col span={12}>
                                        <Statistic
                                            title="Direct Reports"
                                            value={team.directReports.length}
                                            prefix={<UserOutlined />}
                                            valueStyle={{ fontSize: 24 }}
                                        />
                                    </Col>
                                </Row>

                                <Divider style={{ margin: '12px 0' }} />

                                {/* Top Skills */}
                                <div style={{ marginBottom: 12 }}>
                                    <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                                        <TrophyOutlined /> Top Skills
                                    </Text>
                                    <Space wrap>
                                        {topSkills.map(([skill, count]) => (
                                            <Tag color="blue" key={skill}>
                                                {skill} ({count})
                                            </Tag>
                                        ))}
                                    </Space>
                                </div>

                                {/* Role Distribution */}
                                <div>
                                    <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                                        Role Distribution
                                    </Text>
                                    <Space wrap>
                                        {Array.from(team.roles.entries())
                                            .sort((a, b) => b[1] - a[1])
                                            .slice(0, 4)
                                            .map(([role, count]) => (
                                                <Tag key={role} color="purple">
                                                    {role} ({count})
                                                </Tag>
                                            ))}
                                    </Space>
                                </div>

                                <Divider style={{ margin: '12px 0' }} />

                                {/* Direct Reports Preview */}
                                <div>
                                    <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                                        Direct Reports
                                    </Text>
                                    <div style={{ fontSize: 12 }}>
                                        {team.directReports.slice(0, 3).map((report) => (
                                            <div
                                                key={report.id}
                                                style={{
                                                    padding: '4px 0',
                                                    color: 'var(--text-secondary)',
                                                }}
                                            >
                                                • {report.name} - {report.title}
                                            </div>
                                        ))}
                                        {team.directReports.length > 3 && (
                                            <Text type="secondary" style={{ fontSize: 11 }}>
                                                +{team.directReports.length - 3} more
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
                <Card className="glass">
                    <div style={{ textAlign: 'center', padding: 32 }}>
                        <TeamOutlined style={{ fontSize: 48, color: 'var(--text-muted)', marginBottom: 16 }} />
                        <Title level={4}>No Director Teams Found</Title>
                        <Text type="secondary">
                            Director-level employees will be shown here with their team statistics.
                        </Text>
                    </div>
                </Card>
            )}
        </div>
    );
}
