import { useCallback, useEffect, useState, useMemo } from 'react';
import { Card } from 'antd';
import ReactFlow, {
    type Node,
    type Edge,
    useNodesState,
    useEdgesState,
    Controls,
    Background,
    BackgroundVariant,
    MarkerType,
    ReactFlowProvider,
    useReactFlow,
} from 'reactflow';
import { OrgNode } from '../components/OrgNode';
import OrgChartControls, { type ViewMode } from '../components/OrgChartControls';
import TreeView from '../components/TreeView';
import TeamView from '../components/TeamView';
import { useOrgStore } from '../state/orgStore';
import type { Employee } from '../domain/types';
import ELK from 'elkjs/lib/elk.bundled.js';
import 'reactflow/dist/style.css';

const elk = new ELK();

const nodeTypes = {
    orgNode: OrgNode,
};

const elkOptions = {
    'elk.algorithm': 'layered',
    'elk.direction': 'DOWN',
    'elk.spacing.nodeNode': '80',
    'elk.layered.spacing.nodeNodeBetweenLayers': '120',
};

const getLayoutedElements = async (
    nodes: Node[],
    edges: Edge[],
    options = {}
): Promise<{ nodes: Node[]; edges: Edge[] }> => {
    const graph = {
        id: 'root',
        layoutOptions: options,
        children: nodes.map((node) => ({
            id: node.id,
            width: 240,
            height: 90,
        })),
        edges: edges.map((edge) => ({
            id: edge.id,
            sources: [edge.source],
            targets: [edge.target],
        })),
    };

    const layoutedGraph = await elk.layout(graph);

    const layoutedNodes = nodes.map((node) => {
        const layoutedNode = layoutedGraph.children?.find((n) => n.id === node.id);
        return {
            ...node,
            position: {
                x: layoutedNode?.x ?? 0,
                y: layoutedNode?.y ?? 0,
            },
        };
    });

    return { nodes: layoutedNodes, edges };
};

function OrgChartFlow() {
    const { state } = useOrgStore();
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [viewMode, setViewMode] = useState<ViewMode>('chart');
    const [searchTerm, setSearchTerm] = useState('');
    const { fitView, zoomIn, zoomOut } = useReactFlow();

    // Smart default: Collapse all level 3+ employees (show only VP → Directors → SEMs)
    const getInitialCollapsedState = useCallback((): Set<string> => {
        const collapsed = new Set<string>();
        const employeeMap = new Map(state.employees.map((e) => [e.id, e]));

        // Calculate level for each employee
        const getLevelMap = (): Map<string, number> => {
            const levelMap = new Map<string, number>();
            const visited = new Set<string>();

            const calculateLevel = (empId: string): number => {
                if (visited.has(empId)) return levelMap.get(empId) || 0;
                visited.add(empId);

                const emp = employeeMap.get(empId);
                if (!emp || !emp.managerId) {
                    levelMap.set(empId, 1); // VP level
                    return 1;
                }

                const level = calculateLevel(emp.managerId) + 1;
                levelMap.set(empId, level);
                return level;
            };

            state.employees.forEach((e) => calculateLevel(e.id));
            return levelMap;
        };

        const levelMap = getLevelMap();

        // Collapse all employees at level 3 and beyond (keep VP and Directors expanded)
        state.employees.forEach((e) => {
            const level = levelMap.get(e.id) || 0;
            if (level >= 3) {
                // Level 3 = SEMs, collapse them to hide their children
                const children = state.employees.filter((child) => child.managerId === e.id);
                if (children.length > 0) {
                    collapsed.add(e.id);
                }
            }
        });

        return collapsed;
    }, [state.employees]);

    const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(() => getInitialCollapsedState());

    // Reset collapse state when employees change
    useEffect(() => {
        setCollapsedNodes(getInitialCollapsedState());
    }, [getInitialCollapsedState]);

    const buildHierarchy = useCallback(
        (employees: Employee[], collapsed: Set<string>) => {
            const employeeMap = new Map(employees.map((e) => [String(e.id), e]));
            const childrenMap = new Map<string, string[]>();

            // Build children mapping
            employees.forEach((e) => {
                const managerId = e.managerId ? String(e.managerId) : null;
                if (managerId && employeeMap.has(managerId)) {
                    if (!childrenMap.has(managerId)) {
                        childrenMap.set(managerId, []);
                    }
                    childrenMap.get(managerId)!.push(String(e.id));
                }
            });

            const newNodes: Node[] = [];
            const newEdges: Edge[] = [];

            const addNodeAndDescendants = (empId: string, parentId: string | null) => {
                const employee = employeeMap.get(empId);
                if (!employee) return;

                const children = childrenMap.get(empId) || [];
                const isCollapsed = collapsed.has(empId);
                const isHighlighted = searchTerm && employee.name.toLowerCase().includes(searchTerm.toLowerCase());

                newNodes.push({
                    id: empId,
                    type: 'orgNode',
                    data: {
                        name: employee.name,
                        title: employee.title,
                        isRoot: !employee.managerId,
                        hasChildren: children.length > 0,
                        isCollapsed,
                        reportCount: children.length,
                    },
                    position: { x: 0, y: 0 },
                    style: isHighlighted
                        ? {
                            border: '2px solid #FF9B26',
                            boxShadow: '0 0 20px rgba(255, 155, 38, 0.5)',
                        }
                        : undefined,
                });

                if (parentId) {
                    newEdges.push({
                        id: `${parentId}-${empId}`,
                        source: parentId,
                        target: empId,
                        type: 'smoothstep',
                        animated: false,
                        style: {
                            stroke: 'rgba(196, 187, 211, 0.6)',
                            strokeWidth: 2.5,
                        },
                        markerEnd: {
                            type: MarkerType.ArrowClosed,
                            color: 'rgba(196, 187, 211, 0.6)',
                            width: 16,
                            height: 16,
                        },
                    });
                }

                // Only add children if not collapsed
                if (!isCollapsed) {
                    children.forEach((childId) => addNodeAndDescendants(childId, empId));
                }
            };

            // Find root employees (VP level)
            const roots = employees.filter((e) => !e.managerId || !employeeMap.has(e.managerId));
            roots.forEach((root) => addNodeAndDescendants(root.id, null));

            return { nodes: newNodes, edges: newEdges };
        },
        [searchTerm]
    );

    useEffect(() => {
        if (viewMode !== 'chart') return;

        const { nodes: hierarchyNodes, edges: hierarchyEdges } = buildHierarchy(state.employees, collapsedNodes);

        getLayoutedElements(hierarchyNodes, hierarchyEdges, elkOptions).then(
            ({ nodes: layoutedNodes, edges: layoutedEdges }) => {
                setNodes(layoutedNodes);
                setEdges(layoutedEdges);
                setTimeout(() => fitView({ duration: 300, padding: 0.2 }), 100);
            }
        );
    }, [state.employees, collapsedNodes, buildHierarchy, setNodes, setEdges, fitView, viewMode]);

    const onNodeClick = useCallback(
        (_: React.MouseEvent, node: Node) => {
            if (node.data.hasChildren) {
                setCollapsedNodes((prev) => {
                    const next = new Set(prev);
                    if (next.has(node.id)) {
                        next.delete(node.id);
                    } else {
                        next.add(node.id);
                    }
                    return next;
                });
            }
        },
        []
    );

    // Control handlers
    const handleExpandAll = useCallback(() => {
        setCollapsedNodes(new Set());
    }, []);

    const handleCollapseAll = useCallback(() => {
        setCollapsedNodes(getInitialCollapsedState());
    }, [getInitialCollapsedState]);

    const handleExpandToLevel = useCallback(
        (level: number) => {
            const employeeMap = new Map(state.employees.map((e) => [e.id, e]));
            const collapsed = new Set<string>();

            // Calculate level for each employee
            const getLevelMap = (): Map<string, number> => {
                const levelMap = new Map<string, number>();
                const visited = new Set<string>();

                const calculateLevel = (empId: string): number => {
                    if (visited.has(empId)) return levelMap.get(empId) || 0;
                    visited.add(empId);

                    const emp = employeeMap.get(empId);
                    if (!emp || !emp.managerId) {
                        levelMap.set(empId, 1);
                        return 1;
                    }

                    const lvl = calculateLevel(emp.managerId) + 1;
                    levelMap.set(empId, lvl);
                    return lvl;
                };

                state.employees.forEach((e) => calculateLevel(e.id));
                return levelMap;
            };

            const levelMap = getLevelMap();

            // Collapse nodes at levels beyond the specified level
            state.employees.forEach((e) => {
                const empLevel = levelMap.get(e.id) || 0;
                if (empLevel >= level) {
                    const children = state.employees.filter((child) => child.managerId === e.id);
                    if (children.length > 0) {
                        collapsed.add(e.id);
                    }
                }
            });

            setCollapsedNodes(collapsed);
        },
        [state.employees]
    );

    const handleSearch = useCallback(
        (value: string) => {
            if (!value) {
                setSearchTerm('');
                return;
            }

            setSearchTerm(value);

            // Auto-expand to show search results
            const employeeMap = new Map(state.employees.map((e) => [e.id, e]));
            const matchedEmployees = state.employees.filter((e) =>
                e.name.toLowerCase().includes(value.toLowerCase())
            );

            if (matchedEmployees.length > 0) {
                const newCollapsed = new Set(collapsedNodes);

                // Expand path to each match
                matchedEmployees.forEach((match) => {
                    let current = match;
                    while (current.managerId) {
                        newCollapsed.delete(current.managerId);
                        const manager = employeeMap.get(current.managerId);
                        if (!manager) break;
                        current = manager;
                    }
                });

                setCollapsedNodes(newCollapsed);
            }
        },
        [state.employees, collapsedNodes]
    );

    const handleZoomIn = useCallback(() => {
        zoomIn({ duration: 300 });
    }, [zoomIn]);

    const handleZoomOut = useCallback(() => {
        zoomOut({ duration: 300 });
    }, [zoomOut]);

    const handleFitView = useCallback(() => {
        fitView({ duration: 300, padding: 0.2 });
    }, [fitView]);

    const visibleNodeCount = useMemo(() => nodes.length, [nodes]);

    return (
        <Card className="glass" title={<span className="brand">Org Chart</span>}>
            <OrgChartControls
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onSearch={handleSearch}
                onExpandAll={handleExpandAll}
                onCollapseAll={handleCollapseAll}
                onExpandToLevel={handleExpandToLevel}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onFitView={handleFitView}
                collapsedCount={collapsedNodes.size}
                totalNodes={state.employees.length}
                visibleNodes={visibleNodeCount}
            />

            {viewMode === 'chart' && (
                <div
                    style={{
                        height: '72vh',
                        borderRadius: 16,
                        overflow: 'hidden',
                        border: '1px solid var(--border-glass)',
                    }}
                >
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onNodeClick={onNodeClick}
                        nodeTypes={nodeTypes}
                        fitView
                        minZoom={0.1}
                        maxZoom={2}
                        defaultEdgeOptions={{
                            type: 'smoothstep',
                            animated: false,
                        }}
                        proOptions={{ hideAttribution: true }}
                    >
                        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="var(--text-muted)" />
                        <Controls showInteractive={false} />
                    </ReactFlow>
                </div>
            )}

            {viewMode === 'tree' && <TreeView employees={state.employees} searchTerm={searchTerm} />}

            {viewMode === 'teams' && (
                <div style={{ height: '72vh', overflowY: 'auto', paddingRight: 4 }}>
                    <TeamView employees={state.employees} />
                </div>
            )}
        </Card>
    );
}

export default function OrgChart() {
    return (
        <ReactFlowProvider>
            <OrgChartFlow />
        </ReactFlowProvider>
    );
}