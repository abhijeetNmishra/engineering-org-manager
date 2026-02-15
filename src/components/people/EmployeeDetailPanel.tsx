import React from 'react';
import { Drawer, Button, Tag, Space, Divider, Typography } from 'antd';
import {
    CloseOutlined,
    UserOutlined,
    MailOutlined,
    EnvironmentOutlined,
    ClockCircleOutlined
} from '@ant-design/icons';
import type { Employee } from '../../domain/types';
import { useOrgStore } from '../../state/orgStore';

const { Title, Text } = Typography;

interface EmployeeDetailPanelProps {
    employee: Employee | null;
    onClose: () => void;
    onEdit: (employee: Employee) => void;
}

export const EmployeeDetailPanel: React.FC<EmployeeDetailPanelProps> = ({
    employee,
    onClose,
    onEdit
}) => {
    const { state } = useOrgStore();

    if (!employee) return null;

    const directReports = state.employees.filter(e => e.managerId === employee.id);
    const manager = state.employees.find(e => e.id === employee.managerId);

    // Submodules
    const submodules = employee.moduleOwnershipIds.map(id => state.modules.find(m => m.id === id)).filter(Boolean);

    return (
        <Drawer
            title={null}
            placement="right"
            closable={false}
            onClose={onClose}
            open={!!employee}
            width={600}
            bodyStyle={{ padding: 0 }}
            maskStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
        >
            <div className="detail-panel-header" style={{ padding: '24px 24px 16px', background: 'var(--surface-raised)', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <Title level={3} style={{ margin: 0 }}>{employee.name}</Title>
                        <Text type="secondary" style={{ fontSize: 16 }}>{employee.title}</Text>
                        <div style={{ marginTop: 8 }}>
                            <Tag color="purple">{employee.workstream}</Tag>
                            <Tag icon={<EnvironmentOutlined />}>{employee.location}</Tag>
                            <Tag icon={<ClockCircleOutlined />}>{employee.tenure} months</Tag>
                        </div>
                    </div>
                    <Button type="text" icon={<CloseOutlined />} onClick={onClose} />
                </div>

                <Space style={{ marginTop: 16 }}>
                    <Button type="primary" onClick={() => onEdit(employee)}>Edit Profile</Button>
                    <Button href={`mailto:${employee.email}`} icon={<MailOutlined />}>Email</Button>
                </Space>
            </div>

            <div className="detail-panel-body" style={{ padding: 24 }}>
                <section style={{ marginBottom: 32 }}>
                    <Title level={5}>Reporting</Title>
                    <Space direction="vertical" style={{ width: '100%' }}>
                        {manager ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, background: 'var(--surface-sunken)', borderRadius: 8 }}>
                                <UserOutlined />
                                <div>
                                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Reports To</div>
                                    <div style={{ fontWeight: 500 }}>{manager.name}</div>
                                </div>
                            </div>
                        ) : (
                            <Text type="secondary">Top Level</Text>
                        )}

                        {directReports.length > 0 && (
                            <div style={{ marginTop: 8 }}>
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Direct Reports ({directReports.length})</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    {directReports.map(dr => (
                                        <Tag key={dr.id} style={{ padding: '4px 8px' }}>
                                            <UserOutlined /> {dr.name}
                                        </Tag>
                                    ))}
                                </div>
                            </div>
                        )}
                    </Space>
                </section>

                <Divider />

                <section style={{ marginBottom: 32 }}>
                    <Title level={5}>Skills</Title>
                    <div style={{ marginBottom: 12 }}>
                        <Text strong>Primary: </Text>
                        <Tag color="blue">{employee.primarySkill}</Tag>
                    </div>
                    <div>
                        <Text strong>Secondary: </Text>
                        {employee.secondarySkills && employee.secondarySkills.length > 0 ? (
                            employee.secondarySkills.map(s => <Tag key={s}>{s}</Tag>)
                        ) : <Text type="secondary">None</Text>}
                    </div>
                </section>

                <Divider />

                <section>
                    <Title level={5}>Submodule Ownership</Title>
                    {submodules.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {submodules.map(m => (
                                <Tag key={m!.id} color="cyan">{m!.name}</Tag>
                            ))}
                        </div>
                    ) : (
                        <Text type="secondary">No specific submodules owned.</Text>
                    )}
                </section>
            </div>
        </Drawer>
    );
};
