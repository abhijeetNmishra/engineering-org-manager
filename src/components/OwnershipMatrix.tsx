import React, { useMemo, useState } from 'react';
import { Table, Select, Tag, Button, Space, Typography } from 'antd';
import {
    UserOutlined,
    AlertOutlined,
    DeleteOutlined,
    PlusOutlined
} from '@ant-design/icons';
import { useOrgStore } from '../state/orgStore';
import type { ModuleNode, Ownership } from '../domain/types';

const { Text } = Typography;

export const OwnershipMatrix: React.FC = () => {
    const { state, dispatch, employeesById } = useOrgStore();
    const [filterWorkstream, setFilterWorkstream] = useState<string | null>(null);

    // Prepare table data: Module -> Owners
    const data = useMemo(() => {
        return state.modules
            .filter(m => !filterWorkstream || m.workstream === filterWorkstream)
            .map(m => {
                const owners = state.ownership.filter(o => o.moduleId === m.id);
                return { ...m, owners };
            });
    }, [state.modules, state.ownership, filterWorkstream]);

    const workstreams = useMemo(() =>
        Array.from(new Set(state.modules.map(m => m.workstream))).sort(),
        [state.modules]);

    const employeeOptions = useMemo(() =>
        state.employees.map(e => ({ label: `${e.name} (${e.title})`, value: e.id })),
        [state.employees]);

    const handleAddOwner = (moduleId: string, ownerId: string) => {
        dispatch({
            type: "UPSERT_OWNERSHIP",
            moduleId,
            ownerId,
            ownershipType: "Primary" // Default
        });
    };

    const handleRemoveOwner = (moduleId: string, ownerId: string) => {
        dispatch({ type: "REMOVE_OWNERSHIP", moduleId, ownerId });
    };

    const handleTypeChange = (moduleId: string, ownerId: string, type: Ownership["ownershipType"]) => {
        dispatch({
            type: "UPSERT_OWNERSHIP",
            moduleId,
            ownerId,
            ownershipType: type
        });
    };

    const columns = [
        {
            title: 'Module',
            dataIndex: 'name',
            key: 'name',
            width: 250,
            render: (text: string, record: ModuleNode) => (
                <Space direction="vertical" size={2}>
                    <Text strong>{text}</Text>
                    <Space>
                        <Tag>{record.workstream}</Tag>
                        {record.type === 'Horizontal' && <Tag color="orange">Hz</Tag>}
                    </Space>
                </Space>
            )
        },
        {
            title: 'Owners',
            key: 'owners',
            render: (_: any, record: ModuleNode & { owners: Ownership[] }) => (
                <Space direction="vertical" style={{ width: '100%' }}>
                    {record.owners.length === 0 && (
                        <Tag icon={<AlertOutlined />} color="error">Unowned</Tag>
                    )}

                    {record.owners.map(o => {
                        const emp = employeesById.get(o.ownerId);
                        return (
                            <div key={o.ownerId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: 4 }}>
                                <Space>
                                    <UserOutlined />
                                    <span>{emp?.name || o.ownerId}</span>
                                    <Select
                                        size="small"
                                        value={o.ownershipType}
                                        onChange={(val) => handleTypeChange(record.id, o.ownerId, val)}
                                        variant="borderless"
                                        style={{ width: 110, color: o.ownershipType === 'Primary' ? '#52c41a' : '#faad14' }}
                                        options={[
                                            { value: 'Primary', label: 'Primary' },
                                            { value: 'Secondary', label: 'Secondary' },
                                            { value: 'Contributor', label: 'Contributor' }
                                        ]}
                                    />
                                </Space>
                                <Button
                                    type="text"
                                    size="small"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => handleRemoveOwner(record.id, o.ownerId)}
                                />
                            </div>
                        );
                    })}

                    <Select
                        placeholder="Add Owner"
                        style={{ width: 200 }}
                        showSearch
                        optionFilterProp="label"
                        options={employeeOptions}
                        value={null}
                        onChange={(val) => handleAddOwner(record.id, val)}
                        suffixIcon={<PlusOutlined />}
                    />
                </Space>
            )
        }
    ];

    return (
        <div className="ownership-matrix">
            <Space style={{ marginBottom: 16 }}>
                <Select
                    placeholder="Filter by Workstream"
                    allowClear
                    style={{ width: 200 }}
                    onChange={setFilterWorkstream}
                    options={workstreams.map(w => ({ label: w, value: w }))}
                />
            </Space>

            <Table
                dataSource={data}
                columns={columns}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                size="middle"
            />
        </div>
    );
};
