import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { UserOutlined, TeamOutlined } from '@ant-design/icons';
import type { EmployeeStatus, TechnicalSkill, WorkstreamKey } from '../domain/types';
import { getModuleColor } from '../domain/orgMetrics';

interface OrgNodeData {
    name: string;
    title: string;
    isRoot?: boolean;
    hasChildren?: boolean;
    isCollapsed?: boolean;
    reportCount?: number;
    // New PRD fields
    status?: EmployeeStatus;
    primarySkill?: TechnicalSkill;
    workstreams?: WorkstreamKey[];
    moduleColor?: string;
}

// Skill color mapping
const SKILL_COLORS: Record<string, string> = {
    'Backend': '#3B82F6',
    'Frontend - Web': '#10B981',
    'Frontend - App': '#06B6D4',
    'Fullstack': '#8B5CF6',
    'AI/ML': '#EC4899',
    'Architecture': '#F59E0B',
    'Backend - Search': '#6366F1',
};

// Status badge colors
const STATUS_CONFIG = {
    active: { color: '#10B981', label: '●' },
    on_leave: { color: '#F59E0B', label: '◐' },
    open: { color: '#64748B', label: '○' },
};

export const OrgNode = memo(({ data }: { data: OrgNodeData }) => {
    const {
        name,
        title,
        isRoot,
        hasChildren,
        isCollapsed,
        reportCount,
        status = 'active',
        primarySkill,
        workstreams,
        moduleColor,
    } = data;

    const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.active;
    const skillColor = primarySkill ? SKILL_COLORS[primarySkill] || '#6B21EF' : null;
    const displayModuleColor = moduleColor || (workstreams?.[0] ? getModuleColor(workstreams[0]) : null);

    return (
        <div
            style={{
                minWidth: 260,
                background: isRoot
                    ? 'linear-gradient(135deg, #077AC7 0%, #6B21EF 100%)'
                    : 'rgba(255, 255, 255, 0.05)',
                border: `2px solid ${isRoot ? 'rgba(107, 33, 239, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
                borderRadius: 12,
                padding: 14,
                backdropFilter: 'blur(20px) saturate(180%)',
                boxShadow: isRoot
                    ? '0 8px 32px rgba(107, 33, 239, 0.4)'
                    : '0 4px 20px rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                cursor: hasChildren ? 'pointer' : 'default',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
            }}
            className="org-node-enhanced"
        >
            <Handle
                type="target"
                position={Position.Top}
                style={{
                    background: isRoot ? '#6B21EF' : '#C4BBD3',
                    width: 10,
                    height: 10,
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    top: -5,
                }}
            />

            {/* Module Color Bar (left edge) */}
            {displayModuleColor && (
                <div
                    style={{
                        position: 'absolute',
                        left: 0,
                        top: 12,
                        bottom: 12,
                        width: 4,
                        background: displayModuleColor,
                        borderRadius: '0 2px 2px 0',
                    }}
                />
            )}

            {/* Icon Container */}
            <div
                style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: isRoot
                        ? 'rgba(255, 255, 255, 0.15)'
                        : 'linear-gradient(135deg, #FF9B26 0%, #FF6D5A 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                    position: 'relative',
                }}
            >
                {isRoot ? (
                    <TeamOutlined style={{ fontSize: 22, color: '#FFFFFF' }} />
                ) : (
                    <UserOutlined style={{ fontSize: 20, color: '#FFFFFF' }} />
                )}

                {/* Status indicator dot */}
                <div
                    style={{
                        position: 'absolute',
                        top: -2,
                        right: -2,
                        width: 12,
                        height: 12,
                        background: statusConfig.color,
                        borderRadius: '50%',
                        border: '2px solid rgba(14, 9, 24, 0.95)',
                        boxShadow: `0 0 8px ${statusConfig.color}`,
                    }}
                    title={status === 'active' ? 'Active' : status === 'on_leave' ? 'On Leave' : 'Open Role'}
                />
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div
                    style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: '#FFFFFF',
                        marginBottom: 3,
                        lineHeight: 1.3,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {name}
                </div>

                {title && (
                    <div
                        style={{
                            fontSize: 12,
                            color: isRoot ? 'rgba(255, 255, 255, 0.85)' : '#C4BBD3',
                            fontWeight: 500,
                            lineHeight: 1.2,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {title}
                    </div>
                )}

                {/* Bottom row: Skill badge + Report count */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginTop: 8,
                        flexWrap: 'wrap',
                    }}
                >
                    {/* Primary Skill Badge */}
                    {primarySkill && (
                        <div
                            style={{
                                fontSize: 10,
                                fontWeight: 600,
                                color: '#FFFFFF',
                                background: skillColor || '#6B21EF',
                                padding: '2px 8px',
                                borderRadius: 4,
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {primarySkill.replace(' - ', '/').replace('Backend', 'BE').replace('Frontend', 'FE')}
                        </div>
                    )}

                    {/* Span badge for leaders */}
                    {reportCount !== undefined && reportCount > 0 && (
                        <div
                            style={{
                                fontSize: 10,
                                color: isRoot ? 'rgba(255, 255, 255, 0.8)' : '#8C8799',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 3,
                                background: 'rgba(255, 255, 255, 0.1)',
                                padding: '2px 6px',
                                borderRadius: 4,
                            }}
                        >
                            <TeamOutlined style={{ fontSize: 10 }} />
                            {reportCount}
                        </div>
                    )}
                </div>
            </div>

            {/* Expand/Collapse Button */}
            {hasChildren && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: -14,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 28,
                        height: 28,
                        background: isCollapsed
                            ? 'linear-gradient(135deg, #FF9B26 0%, #FF6D5A 100%)'
                            : 'linear-gradient(135deg, #6B21EF 0%, #3B82F6 100%)',
                        color: 'white',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18,
                        fontWeight: 'bold',
                        boxShadow: isCollapsed
                            ? '0 4px 16px rgba(255, 109, 90, 0.5)'
                            : '0 4px 16px rgba(107, 33, 239, 0.5)',
                        border: '2px solid rgba(14, 9, 24, 0.95)',
                        zIndex: 10,
                        transition: 'all 0.2s ease',
                    }}
                >
                    {isCollapsed ? '+' : '−'}
                </div>
            )}

            <Handle
                type="source"
                position={Position.Bottom}
                style={{
                    background: isRoot ? '#6B21EF' : '#C4BBD3',
                    width: 10,
                    height: 10,
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    bottom: -5,
                }}
            />

            {/* Hover glow effect */}
            <style>{`
                .org-node-enhanced:hover {
                    transform: translateY(-2px);
                    border-color: ${isRoot ? 'rgba(107, 33, 239, 0.8)' : 'rgba(255, 155, 38, 0.5)'};
                    box-shadow: ${isRoot
                    ? '0 12px 40px rgba(107, 33, 239, 0.5)'
                    : '0 8px 32px rgba(255, 109, 90, 0.3)'
                };
                }
            `}</style>
        </div>
    );
});

OrgNode.displayName = 'OrgNode';
