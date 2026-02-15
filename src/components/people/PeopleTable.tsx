import React, { useMemo } from 'react';
import { Table, Tag, Button, Space, Popconfirm, Badge, Select, Input } from 'antd';
import { EditOutlined, DeleteOutlined, TeamOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import type { ColumnsType } from 'antd/es/table';
import type { Employee, EmployeeStatus, WorkstreamKey, LocationTag } from '../../domain/types';
import { useOrgStore } from '../../state/orgStore';
import { computeLeaderMetrics, getLeaders } from '../../domain/orgMetrics';

interface PeopleTableProps {
    data: Employee[];
    loading?: boolean;
    onEdit: (employee: Employee) => void;
    onRowClick: (employee: Employee) => void;
    visibleColumns: string[];
    options: {
        workstreams: WorkstreamKey[];
        locations: LocationTag[];
    };
}

export const PeopleTable: React.FC<PeopleTableProps> = ({
    data,
    loading,
    onEdit,
    onRowClick,
    visibleColumns,
    options
}) => {
    const { state, dispatch } = useOrgStore();
    const leaders = useMemo(() => getLeaders(state), [state]);
    const leaderIds = useMemo(() => new Set(leaders.map((l) => l.id)), [leaders]);

    const handleUpdate = (id: string, updates: Partial<Employee>) => {
        dispatch({
            type: "UPDATE_EMPLOYEE",
            employeeId: id,
            updates: updates,
        });
    };

    const managerOptions = useMemo(() =>
        state.employees.map(e => ({ label: e.name, value: e.id })).sort((a, b) => a.label.localeCompare(b.label)),
        [state.employees]);

    const columns: ColumnsType<Employee> = [
        {
            title: "Name & Title",
            dataIndex: "name",
            width: 280,
            fixed: "left" as const,
            sorter: (a: Employee, b: Employee) => a.name.localeCompare(b.name),
            render: (_: string, r: Employee) => {
                const isLeader = leaderIds.has(r.id);
                const leaderMetrics = isLeader ? computeLeaderMetrics(state, r.id) : null;
                return (
                    <div className="name-cell">
                        <div className="name-row" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span
                                className="employee-name"
                                onClick={(e) => { e.stopPropagation(); onRowClick(r); }}
                                style={{
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                    color: 'var(--primary-color, #1890ff)',
                                    textDecoration: 'underline',
                                    textUnderlineOffset: 2
                                }}
                            >
                                {r.name}
                            </span>
                            {isLeader && (
                                <Tag color="purple" className="leader-tag" style={{ margin: 0 }}>
                                    <TeamOutlined /> {leaderMetrics?.directReports}
                                </Tag>
                            )}
                        </div>
                        <div className="title-row">
                            <Input
                                defaultValue={r.title}
                                bordered={false}
                                placeholder="Title"
                                onBlur={(e) => {
                                    if (e.target.value !== r.title) {
                                        handleUpdate(r.id, { title: e.target.value })
                                    }
                                }}
                                onPressEnter={(e) => {
                                    (e.target as HTMLInputElement).blur();
                                }}
                                style={{ padding: '0', fontSize: '13px', color: 'var(--text-secondary)' }}
                            />
                        </div>
                    </div>
                );
            },
        },
        {
            title: "Manager",
            dataIndex: "managerId",
            width: 200,
            hidden: !visibleColumns.includes('managerId'),
            render: (v: string | undefined, r: Employee) => (
                <Select
                    value={v}
                    onChange={(val) => handleUpdate(r.id, { managerId: val })}
                    options={managerOptions}
                    showSearch
                    filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                    bordered={false}
                    style={{ width: '100%' }}
                    placeholder="Select Manager"
                    allowClear
                />
            )
        },
        {
            title: "Workstream",
            dataIndex: "workstream",
            width: 180,
            hidden: !visibleColumns.includes('workstream'),
            render: (v: WorkstreamKey, r: Employee) => (
                <Select
                    value={v}
                    onChange={(val) => handleUpdate(r.id, { workstream: val })}
                    options={options.workstreams.map(w => ({ label: w, value: w }))}
                    bordered={false}
                    style={{ width: '100%' }}
                />
            )
        },
        {
            title: "Submodules",
            dataIndex: "moduleOwnershipIds",
            width: 300,
            hidden: !visibleColumns.includes('submodules'),
            render: (ids: string[], r: Employee) => {
                const availableModules = state.modules
                    .filter(m => m.parentId && (!r.workstream || m.workstream === r.workstream))
                    .map(m => ({ label: m.name, value: m.id }));

                return (
                    <Select
                        mode="multiple"
                        value={ids}
                        onChange={(val) => handleUpdate(r.id, { moduleOwnershipIds: val })}
                        options={availableModules}
                        bordered={false}
                        style={{ width: '100%', minWidth: 150 }}
                        placeholder="Select Submodules"
                        maxTagCount="responsive"
                        filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                    />
                );
            }
        },
        {
            title: "Location",
            dataIndex: "location",
            width: 120,
            hidden: !visibleColumns.includes('location'),
            render: (v: LocationTag, r: Employee) => (
                <Select
                    value={v}
                    onChange={(val) => handleUpdate(r.id, { location: val })}
                    options={options.locations.map(l => ({ label: l, value: l }))}
                    bordered={false}
                    style={{ width: '100%' }}
                />
            )
        },
        {
            title: "Status",
            dataIndex: "status",
            width: 140,
            hidden: !visibleColumns.includes('status'),
            render: (v: EmployeeStatus | undefined, r: Employee) => {
                const status = v || "active";
                return (
                    <Select
                        value={status}
                        onChange={(val: EmployeeStatus) => handleUpdate(r.id, { status: val })}
                        bordered={false}
                        style={{ width: '100%' }}
                        options={[
                            { value: 'active', label: <Badge status="success" text="Active" /> },
                            { value: 'on_leave', label: <Badge status="warning" text="On Leave" /> },
                            { value: 'open', label: <Badge status="default" text="Open" /> },
                        ]}
                    />
                );
            }
        },
        {
            title: "",
            key: "actions",
            width: 80,
            fixed: "right" as const,
            render: (_: any, r: Employee) => (
                <Space size="small">
                    <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(r);
                        }}
                    />
                    <Popconfirm
                        title="Delete this person?"
                        onConfirm={(e) => {
                            e?.stopPropagation();
                            dispatch({ type: "DELETE_EMPLOYEE", employeeId: r.id })
                        }}
                        onCancel={(e) => e?.stopPropagation()}
                    >
                        <div onClick={e => e.stopPropagation()}>
                            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                        </div>
                    </Popconfirm>
                </Space>
            ),
        },
    ].filter(c => !c.hidden);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <Table
                dataSource={data}
                loading={loading}
                columns={columns}
                rowKey="id"
                pagination={false}
                scroll={{ x: 1300, y: 'calc(100vh - 280px)' }}
                size="middle"
                className="people-table people-table-interactive"
            />
        </motion.div>
    );
};
