import React from 'react';
import { Input, Select, Button, Space, Badge, Dropdown, Checkbox } from 'antd';
import { SearchOutlined, PlusOutlined, SettingOutlined, TeamOutlined, CloseCircleOutlined } from '@ant-design/icons';
import type { WorkstreamKey, TechnicalSkill, LocationTag, EmployeeStatus } from '../../domain/types';

interface PeopleDirectoryHeaderProps {
    stats: {
        total: number;
        leaders: number;
        ics: number;
        active: number;
        onLeave: number;
        open: number;
    };
    filters: {
        query: string;
        showLeadersOnly: boolean;
        workstream: WorkstreamKey | null;
        status: EmployeeStatus | null;
        skills: TechnicalSkill[];
        location: LocationTag | null;
    };
    onFilterChange: (key: string, value: any) => void;
    onClearFilters: () => void;
    onAddPerson: () => void;
    visibleColumns: string[];
    onToggleColumn: (column: string) => void;
    options: {
        workstreams: WorkstreamKey[];
        skills: TechnicalSkill[];
        locations: LocationTag[];
    };
}

const ALL_COLUMNS = [
    { key: 'managerId', label: 'Manager' },
    { key: 'workstream', label: 'Workstream' },
    { key: 'submodules', label: 'Submodules' },
    { key: 'location', label: 'Location' },
    { key: 'status', label: 'Status' },
];

export const PeopleDirectoryHeader: React.FC<PeopleDirectoryHeaderProps> = ({
    stats,
    filters,
    onFilterChange,
    onClearFilters,
    onAddPerson,
    visibleColumns,
    onToggleColumn,
    options
}) => {
    const hasActiveFilters =
        filters.query ||
        filters.showLeadersOnly ||
        filters.workstream ||
        filters.status ||
        filters.skills.length > 0 ||
        filters.location;

    // Column Toggle Menu
    const columnMenu = (
        <div style={{ padding: 8, background: 'var(--surface-raised)', boxShadow: 'var(--shadow-lg)', borderRadius: 8 }}>
            <div style={{ fontWeight: 600, marginBottom: 8, padding: '0 8px' }}>Visible Columns</div>
            {ALL_COLUMNS.map(col => (
                <div key={col.key} style={{ padding: '4px 8px' }}>
                    <Checkbox
                        checked={visibleColumns.includes(col.key)}
                        onChange={() => onToggleColumn(col.key)}
                    >
                        {col.label}
                    </Checkbox>
                </div>
            ))}
        </div>
    );

    return (
        <div className="people-directory-header">
            {/* Title Row */}
            <div className="header-top-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 className="page-title">
                        <TeamOutlined /> People Directory
                    </h1>
                    <p className="page-subtitle">{stats.total} people • {stats.active} active</p>
                </div>
                <Space>
                    <Dropdown menu={{
                        items: ALL_COLUMNS.map(col => ({
                            key: col.key,
                            label: (
                                <Checkbox
                                    checked={visibleColumns.includes(col.key)}
                                    onChange={(e) => {
                                        e.stopPropagation(); // Stop menu from closing? AntD menu might handle this differently.
                                        // Actually Checkbox in Menu item is tricky.
                                        // Better to use `dropdownRender` for custom content.
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleColumn(col.key)
                                    }}
                                >
                                    {col.label}
                                </Checkbox>
                            )
                        }))
                    }}
                        dropdownRender={() => columnMenu}
                        trigger={['click']} placement="bottomRight">
                        <Button icon={<SettingOutlined />}>Columns</Button>
                    </Dropdown>
                    <Button type="primary" icon={<PlusOutlined />} onClick={onAddPerson}>
                        Add Person
                    </Button>
                </Space>
            </div>

            {/* Quick Stats Bar */}
            <div className="quick-stats-bar" style={{ marginBottom: 24 }}>
                <div className="stat-item"><TeamOutlined /> <span className="stat-value">{stats.total}</span> Total</div>
                <div className="stat-divider" />
                <div className="stat-item"><span className="stat-value">{stats.leaders}</span> Leaders</div>
                <div className="stat-item"><span className="stat-value">{stats.ics}</span> ICs</div>
                <div className="stat-divider" />
                <div className="stat-item status-active"><Badge status="success" /> <span className="stat-value">{stats.active}</span> Active</div>
                <div className="stat-item status-leave"><Badge status="warning" /> <span className="stat-value">{stats.onLeave}</span> Leave</div>
                <div className="stat-item status-open"><Badge status="default" /> <span className="stat-value">{stats.open}</span> Open</div>
            </div>

            {/* Filter Bar */}
            <div className="filter-bar" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', padding: 16, background: 'var(--surface-raised)', borderRadius: 8, marginBottom: 16 }}>
                <Input
                    placeholder="Search..."
                    prefix={<SearchOutlined />}
                    value={filters.query}
                    onChange={(e) => onFilterChange('query', e.target.value)}
                    style={{ width: 240 }}
                    allowClear
                />

                <Select
                    placeholder="Workstream"
                    allowClear
                    style={{ width: 160 }}
                    value={filters.workstream}
                    onChange={(v) => onFilterChange('workstream', v)}
                    options={options.workstreams.map(w => ({ value: w, label: w }))}
                />

                <Select
                    placeholder="Status"
                    allowClear
                    style={{ width: 120 }}
                    value={filters.status}
                    onChange={(v) => onFilterChange('status', v)}
                    options={[
                        { value: "active", label: "Active" },
                        { value: "on_leave", label: "On Leave" },
                        { value: "open", label: "Open Role" },
                    ]}
                />

                <Select
                    placeholder="Skills"
                    mode="multiple"
                    allowClear
                    style={{ minWidth: 160, maxWidth: 300 }}
                    value={filters.skills}
                    onChange={(v) => onFilterChange('skills', v)}
                    options={options.skills.map(s => ({ value: s, label: s }))}
                    maxTagCount={1}
                />

                <Button
                    type={filters.showLeadersOnly ? "primary" : "default"}
                    onClick={() => onFilterChange('showLeadersOnly', !filters.showLeadersOnly)}
                >
                    Leaders Only
                </Button>

                {hasActiveFilters && (
                    <Button type="text" icon={<CloseCircleOutlined />} onClick={onClearFilters}>
                        Clear
                    </Button>
                )}
            </div>
        </div>
    );
};
