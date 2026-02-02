import { useState } from 'react';
import { Tree, Input, Space, Tag, Typography } from 'antd';
import type { TreeDataNode } from 'antd';
import { UserOutlined, TeamOutlined, DownOutlined } from '@ant-design/icons';
import type { Employee } from '../domain/types';

const { Search } = Input;
const { Text } = Typography;

interface TreeViewProps {
    employees: Employee[];
    searchTerm?: string;
}

export default function TreeView({ employees, searchTerm = '' }: TreeViewProps) {
    const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
    const [autoExpandParent, setAutoExpandParent] = useState(true);

    // Build tree structure
    const buildTreeData = (): TreeDataNode[] => {
        const employeeMap = new Map(employees.map((e) => [e.id, e]));
        const childrenMap = new Map<string, Employee[]>();

        // Build children mapping
        employees.forEach((e) => {
            if (e.managerId) {
                if (!childrenMap.has(e.managerId)) {
                    childrenMap.set(e.managerId, []);
                }
                childrenMap.get(e.managerId)!.push(e);
            }
        });

        const buildNode = (employee: Employee): TreeDataNode => {
            const children = childrenMap.get(employee.id) || [];
            const isMatch = searchTerm && employee.name.toLowerCase().includes(searchTerm.toLowerCase());

            return {
                key: employee.id,
                title: (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                        <UserOutlined style={{ color: 'var(--text-muted)' }} />
                        <Text
                            strong={isMatch ? true : false}
                            style={{
                                color: isMatch ? '#FF9B26' : 'var(--text-primary)',
                                backgroundColor: isMatch ? 'rgba(255, 155, 38, 0.1)' : 'transparent',
                                padding: isMatch ? '2px 6px' : 0,
                                borderRadius: 4,
                            }}
                        >
                            {employee.name}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {employee.title}
                        </Text>
                        {children.length > 0 && (
                            <Tag color="blue" style={{ marginLeft: 8 }}>
                                <TeamOutlined /> {children.length}
                            </Tag>
                        )}
                    </div>
                ),
                children: children.length > 0 ? children.map((child) => buildNode(child)) : undefined,
                isLeaf: children.length === 0 ? true : false,
            };
        };

        // Find root employees (those without managerId or managerId not in employee list)
        const roots = employees.filter(
            (e) => !e.managerId || !employeeMap.has(e.managerId)
        );

        return roots.map((root) => buildNode(root));
    };

    const treeData = buildTreeData();

    // Auto-expand to search results
    const getParentKeys = (key: string, tree: TreeDataNode[]): string[] => {
        let parentKeys: string[] = [];
        const findParent = (nodes: TreeDataNode[], targetKey: string, ancestors: string[]): boolean => {
            for (const node of nodes) {
                const currentPath = [...ancestors, node.key as string];
                if (node.key === targetKey) {
                    parentKeys = ancestors;
                    return true;
                }
                if (node.children && findParent(node.children, targetKey, currentPath)) {
                    return true;
                }
            }
            return false;
        };
        findParent(tree, key, []);
        return parentKeys;
    };

    // Expand when searching
    const handleSearch = (value: string) => {
        if (!value) {
            setExpandedKeys([]);
            return;
        }

        const matchedKeys: string[] = [];
        const expandKeys: Set<string> = new Set();

        const findMatches = (nodes: TreeDataNode[]) => {
            nodes.forEach((node) => {
                const employee = employees.find((e) => e.id === node.key);
                if (employee && employee.name.toLowerCase().includes(value.toLowerCase())) {
                    matchedKeys.push(node.key as string);
                    // Expand all parents
                    const parents = getParentKeys(node.key as string, treeData);
                    parents.forEach((p) => expandKeys.add(p));
                }
                if (node.children) {
                    findMatches(node.children);
                }
            });
        };

        findMatches(treeData);
        setExpandedKeys(Array.from(expandKeys));
        setAutoExpandParent(true);
    };

    const onExpand = (expandedKeysValue: React.Key[]) => {
        setExpandedKeys(expandedKeysValue);
        setAutoExpandParent(false);
    };

    return (
        <div>
            <div style={{ marginBottom: 16 }}>
                <Search
                    placeholder="Search employees..."
                    onSearch={handleSearch}
                    allowClear
                    style={{ marginBottom: 16 }}
                />
                <Space>
                    <Tag color="blue">{employees.length} total employees</Tag>
                    <Tag color="green">{expandedKeys.length} expanded</Tag>
                </Space>
            </div>

            <div
                style={{
                    background: 'var(--bg-secondary)',
                    borderRadius: 12,
                    padding: 16,
                    maxHeight: 'calc(72vh - 80px)',
                    overflowY: 'auto',
                    border: '1px solid var(--border-glass)',
                }}
            >
                <Tree
                    showLine
                    showIcon={false}
                    switcherIcon={<DownOutlined />}
                    treeData={treeData}
                    expandedKeys={expandedKeys}
                    onExpand={onExpand}
                    autoExpandParent={autoExpandParent}
                    style={{
                        background: 'transparent',
                        color: 'var(--text-primary)',
                    }}
                />
            </div>
        </div>
    );
}
