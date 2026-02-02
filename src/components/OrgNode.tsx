import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { UserOutlined, TeamOutlined } from '@ant-design/icons';

interface OrgNodeData {
    name: string;
    title: string;
    isRoot?: boolean;
    hasChildren?: boolean;
    isCollapsed?: boolean;
    reportCount?: number;
}

export const OrgNode = memo(({ data }: { data: OrgNodeData }) => {
    const { name, title, isRoot, hasChildren, isCollapsed, reportCount } = data;

    return (
        <div
            style={{
                minWidth: 240,
                background: isRoot
                    ? 'linear-gradient(135deg, #077AC7 0%, #6B21EF 100%)'
                    : 'rgba(255, 255, 255, 0.05)',
                border: `2px solid ${isRoot ? 'rgba(107, 33, 239, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
                borderRadius: 12,
                padding: 16,
                backdropFilter: 'blur(20px) saturate(180%)',
                boxShadow: isRoot
                    ? '0 8px 32px rgba(107, 33, 239, 0.4)'
                    : '0 4px 20px rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                cursor: hasChildren ? 'pointer' : 'default',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
            }}
            className="org-node-n8n"
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

            {/* Icon Container - n8n style */}
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
                }}
            >
                {isRoot ? (
                    <TeamOutlined style={{ fontSize: 22, color: '#FFFFFF' }} />
                ) : (
                    <UserOutlined style={{ fontSize: 20, color: '#FFFFFF' }} />
                )}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div
                    style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: '#FFFFFF',
                        marginBottom: 4,
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

                {reportCount !== undefined && reportCount > 0 && (
                    <div
                        style={{
                            fontSize: 11,
                            color: isRoot ? 'rgba(255, 255, 255, 0.7)' : '#8C8799',
                            fontWeight: 600,
                            marginTop: 6,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                        }}
                    >
                        <TeamOutlined style={{ fontSize: 10 }} />
                        {reportCount} {reportCount === 1 ? 'report' : 'reports'}
                    </div>
                )}
            </div>

            {/* Expand/Collapse Button - n8n style */}
            {hasChildren && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: -14,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 28,
                        height: 28,
                        background: 'linear-gradient(135deg, #FF9B26 0%, #FF6D5A 100%)',
                        color: 'white',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18,
                        fontWeight: 'bold',
                        boxShadow: '0 4px 16px rgba(255, 109, 90, 0.5)',
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
                .org-node-n8n:hover {
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
