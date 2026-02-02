import { Button, Input, Select, Space, Tag, Tooltip } from 'antd';
import {
    SearchOutlined,
    ExpandOutlined,
    CompressOutlined,
    ZoomInOutlined,
    ZoomOutOutlined,
    AimOutlined,
    AppstoreOutlined,
    UnorderedListOutlined,
    TeamOutlined,
} from '@ant-design/icons';

const { Search } = Input;

export type ViewMode = 'chart' | 'tree' | 'teams';

interface OrgChartControlsProps {
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
    searchTerm: string;
    onSearchChange: (value: string) => void;
    onSearch: (value: string) => void;
    onExpandAll: () => void;
    onCollapseAll: () => void;
    onExpandToLevel: (level: number) => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onFitView: () => void;
    collapsedCount: number;
    totalNodes: number;
    visibleNodes: number;
}

export default function OrgChartControls({
    viewMode,
    onViewModeChange,
    searchTerm,
    onSearchChange,
    onSearch,
    onExpandAll,
    onCollapseAll,
    onExpandToLevel,
    onZoomIn,
    onZoomOut,
    onFitView,
    collapsedCount,
    totalNodes,
    visibleNodes,
}: OrgChartControlsProps) {
    return (
        <div style={{ marginBottom: 16 }}>
            {/* View Mode Toggle */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <Space.Compact>
                    <Tooltip title="Chart View">
                        <Button
                            type={viewMode === 'chart' ? 'primary' : 'default'}
                            icon={<AppstoreOutlined />}
                            onClick={() => onViewModeChange('chart')}
                        >
                            Chart
                        </Button>
                    </Tooltip>
                    <Tooltip title="Tree List View">
                        <Button
                            type={viewMode === 'tree' ? 'primary' : 'default'}
                            icon={<UnorderedListOutlined />}
                            onClick={() => onViewModeChange('tree')}
                        >
                            Tree
                        </Button>
                    </Tooltip>
                    <Tooltip title="Team Cards View">
                        <Button
                            type={viewMode === 'teams' ? 'primary' : 'default'}
                            icon={<TeamOutlined />}
                            onClick={() => onViewModeChange('teams')}
                        >
                            Teams
                        </Button>
                    </Tooltip>
                </Space.Compact>

                <div style={{ flex: 1, minWidth: 200, maxWidth: 400 }}>
                    <Search
                        placeholder="Search by name..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        onSearch={onSearch}
                        prefix={<SearchOutlined />}
                        allowClear
                    />
                </div>

                <Space>
                    <Tag color="blue">
                        {visibleNodes} / {totalNodes} visible
                    </Tag>
                    <Tag color="orange">{collapsedCount} collapsed</Tag>
                </Space>
            </div>

            {/* Chart Controls - only show in chart mode */}
            {viewMode === 'chart' && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Space.Compact>
                        <Tooltip title="Collapse all branches">
                            <Button icon={<CompressOutlined />} onClick={onCollapseAll} size="small">
                                Collapse All
                            </Button>
                        </Tooltip>
                        <Tooltip title="Expand all branches">
                            <Button icon={<ExpandOutlined />} onClick={onExpandAll} size="small">
                                Expand All
                            </Button>
                        </Tooltip>
                    </Space.Compact>

                    <Select
                        size="small"
                        placeholder="Expand to level..."
                        style={{ width: 160 }}
                        onChange={(value) => onExpandToLevel(value as number)}
                        options={[
                            { label: 'Level 1 (VP)', value: 1 },
                            { label: 'Level 2 (Directors)', value: 2 },
                            { label: 'Level 3 (SEMs)', value: 3 },
                            { label: 'Level 4 (EMs)', value: 4 },
                            { label: 'Level 5 (All)', value: 5 },
                        ]}
                    />

                    <div style={{ borderLeft: '1px solid var(--border-glass)', marginLeft: 4, paddingLeft: 8 }}>
                        <Space.Compact>
                            <Tooltip title="Zoom in">
                                <Button icon={<ZoomInOutlined />} onClick={onZoomIn} size="small" />
                            </Tooltip>
                            <Tooltip title="Zoom out">
                                <Button icon={<ZoomOutOutlined />} onClick={onZoomOut} size="small" />
                            </Tooltip>
                            <Tooltip title="Fit to screen">
                                <Button icon={<AimOutlined />} onClick={onFitView} size="small">
                                    Fit View
                                </Button>
                            </Tooltip>
                        </Space.Compact>
                    </div>
                </div>
            )}
        </div>
    );
}
