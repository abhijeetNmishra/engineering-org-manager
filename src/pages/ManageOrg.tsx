import { useState, useMemo, useCallback, useEffect } from "react";
import {
    DndContext,
    DragOverlay,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragStartEvent,
    type DragEndEvent,
    useDroppable,
} from "@dnd-kit/core";
import { createPortal } from "react-dom";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Card, Input, Button, Space, Tag, Tooltip, message, Badge, Empty } from "antd";
import {
    SearchOutlined,
    UndoOutlined,
    RedoOutlined,
    UserOutlined,
    TeamOutlined,
    SwapOutlined,
    CheckCircleOutlined,
    DeleteOutlined,
    RocketOutlined,
    ShoppingOutlined,
    ShopOutlined,
    RobotOutlined,
    AppstoreOutlined,
    FolderOpenOutlined,
} from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import type { Employee, WorkstreamKey } from "../domain/types";
import { useOrgStore } from "../state/orgStore";
import { getLeaders, getModuleColor } from "../domain/orgMetrics";
import "./ManageOrg.css";

// --- Types & Helpers ---

interface OrgChange {
    type: "manager" | "workstream" | "unassign";
    employeeId: string;
    oldValue: any;
    newValue: any;
    employeeName: string;
}

// Audio Context for Sounds
const playSound = (type: "pop" | "snap" | "error") => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;

        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;

        if (type === "pop") {
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(800, now + 0.05);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
            osc.start(now);
            osc.stop(now + 0.05);
        } else if (type === "snap") {
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            osc.start(now);
            osc.stop(now + 0.15);
        } else if (type === "error") {
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(150, now);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        }
    } catch (e) {
        // Silent
    }
};

// --- Components ---

function DraggablePerson({
    employee,
    isLeader,
    reportCount,
}: {
    employee: Employee;
    isLeader: boolean;
    reportCount: number;
}) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: employee.id,
        data: { employee },
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
            <div className={`draggable-person ${isDragging ? "dragging" : ""}`}>
                <div className="person-avatar">
                    <UserOutlined />
                    {(employee.status || "active") !== "active" && (
                        <Badge
                            status={employee.status === "on_leave" ? "warning" : "default"}
                            className="status-dot"
                        />
                    )}
                </div>
                <div className="person-info">
                    <div className="person-name">{employee.name}</div>
                    <div className="person-title">{employee.title}</div>
                </div>
                {isLeader && (
                    <Tag color="purple" className="leader-badge">
                        <TeamOutlined /> {reportCount}
                    </Tag>
                )}
            </div>
        </div>
    );
}

function DroppableLeader({
    leader,
    reportCount,
    isActive,
}: {
    leader: Employee;
    reportCount: number;
    isActive: boolean;
}) {
    const { isOver, setNodeRef } = useDroppable({
        id: `leader-${leader.id}`,
        data: { leader, type: "leader" },
    });

    return (
        <div
            ref={setNodeRef}
            className={`droppable-leader ${isOver ? "over" : ""} ${isActive ? "active" : ""}`}
        >
            <div className="leader-header">
                <div className="leader-avatar">
                    <TeamOutlined />
                </div>
                <div className="leader-info">
                    <div className="leader-name">{leader.name}</div>
                    <div className="leader-title">{leader.title}</div>
                </div>
                <div className="leader-stats">
                    <span className="report-count">{reportCount} reports</span>
                </div>
            </div>
            <div className="leader-drop-zone">
                <span className="drop-hint">
                    {isOver ? "Release to assign" : "Drop to assign"}
                </span>
            </div>
        </div>
    );
}

// Helper to get icon for specific workstreams
function getWorkstreamIcon(name: string) {
    if (name.includes("Traffic") || name.includes("Growth")) return <RocketOutlined />;
    if (name.includes("Consideration") || name.includes("Search")) return <SearchOutlined />;
    if (name.includes("Purchase")) return <ShoppingOutlined />;
    if (name.includes("MP") || name.includes("Marketplace")) return <ShopOutlined />;
    if (name.includes("Agentic")) return <RobotOutlined />;
    if (name.includes("Foundation") || name.includes("Platform")) return <AppstoreOutlined />;
    return <FolderOpenOutlined />;
}

function DroppableWorkstream({
    workstream,
    count,
    color,
    isDimmed,
    submodules
}: {
    workstream: WorkstreamKey;
    count: number;
    color: string;
    isDimmed: boolean;
    submodules: string[];
}) {
    const { isOver, setNodeRef } = useDroppable({
        id: `workstream-${workstream}`,
        data: { workstream, type: "workstream" },
    });

    const icon = getWorkstreamIcon(workstream);

    return (
        <div
            ref={setNodeRef}
            className={`droppable-workstream ${isOver ? "over" : ""}`}
            style={{
                '--workstream-color': color,
                opacity: isDimmed ? 0.4 : 1,
                filter: isDimmed ? 'grayscale(0.6)' : 'none',
            } as React.CSSProperties}
        >
            <div className="workstream-header">
                <div className="workstream-icon-container" style={{ color: color }}>
                    {icon}
                </div>
                <span className="workstream-name">{workstream}</span>
                <Badge count={count} className="workstream-count" showZero />
            </div>

            {/* Submodules List */}
            {submodules.length > 0 && (
                <div className="workstream-submodules">
                    {submodules.map(mod => (
                        <span key={mod} className="submodule-tag">
                            {mod}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

function UnassignDropZone({ isActive }: { isActive: boolean }) {
    const { isOver, setNodeRef } = useDroppable({
        id: "unassign-zone",
        data: { type: "unassign" },
    });

    return (
        <div
            ref={setNodeRef}
            className={`unassign-zone ${isOver ? "over" : ""} ${isActive ? "active" : ""}`}
        >
            <DeleteOutlined className="unassign-icon" />
            <span>{isOver ? "Release to Unassign" : "Unassign (Drop here to remove)"}</span>
        </div>
    );
}

export default function ManageOrg() {
    const { state, dispatch } = useOrgStore();

    // State
    const [searchTerm, setSearchTerm] = useState("");
    const [activeId, setActiveId] = useState<string | null>(null);
    const [history, setHistory] = useState<OrgChange[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        }),
        useSensor(KeyboardSensor)
    );

    // Undo/Redo Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "z") {
                if (e.shiftKey) {
                    handleRedo();
                } else {
                    handleUndo();
                }
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [history, historyIndex]);

    // Computed Data
    const leaders = useMemo(() => getLeaders(state), [state]);
    const leaderIds = useMemo(() => new Set(leaders.map((l) => l.id)), [leaders]);

    // CHANGED: Source workstreams from defined modules, not just assigned ones
    const workstreams = useMemo(() => {
        const ws = Array.from(new Set(state.modules.map((m) => m.workstream)));
        return ws.sort() as WorkstreamKey[];
    }, [state.modules]);

    // Helper to get module names for a workstream
    const getSubmodules = useCallback((ws: WorkstreamKey) => {
        return state.modules
            .filter(m => m.workstream === ws && !m.parentId) // Top-level modules only? Or all? User said "submodules". 
            // Let's show top-level modules as the primary "submodules" of the workstream for now to avoid noise.
            // Actually, `modules` are the nodes. `workstream` is the category.
            // So all nodes in this workstream.
            .map(m => m.name)
            .sort();
    }, [state.modules]);

    const workstreamCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        workstreams.forEach((ws) => {
            counts[ws] = state.employees.filter((e) => e.workstreams.includes(ws)).length;
        });
        return counts;
    }, [state.employees, workstreams]);

    const filteredEmployees = useMemo(() => {
        let result = state.employees;
        if (searchTerm) {
            result = result.filter(
                (e) =>
                    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    e.title.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        return result;
    }, [state.employees, searchTerm]);

    const getReportCount = useCallback(
        (leaderId: string) => state.employees.filter((e) => e.managerId === leaderId).length,
        [state.employees]
    );

    const activeEmployee = useMemo(() => {
        if (!activeId) return null;
        return state.employees.find((e) => e.id === activeId) || null;
    }, [activeId, state.employees]);

    // History Helpers
    const addToHistory = useCallback((change: OrgChange) => {
        setHistory((prev) => {
            const newHistory = prev.slice(0, historyIndex + 1);
            newHistory.push(change);
            return newHistory.slice(-50);
        });
        setHistoryIndex((prev) => Math.min(prev + 1, 49));
    }, [historyIndex]);

    const handleUndo = () => {
        if (historyIndex < 0) return;
        const change = history[historyIndex];

        if (change.type === "manager") {
            dispatch({
                type: "UPDATE_EMPLOYEE",
                employeeId: change.employeeId,
                updates: { managerId: change.oldValue },
            });
        } else if (change.type === "workstream") {
            const emp = state.employees.find(e => e.id === change.employeeId);
            if (emp) {
                const newWs = emp.workstreams.filter(w => w !== change.newValue);
                dispatch({
                    type: "UPDATE_EMPLOYEE",
                    employeeId: change.employeeId,
                    updates: { workstreams: newWs },
                });
            }
        } else if (change.type === "unassign") {
            dispatch({
                type: "UPDATE_EMPLOYEE",
                employeeId: change.employeeId,
                updates: {
                    managerId: change.oldValue.managerId,
                    workstreams: change.oldValue.workstreams
                },
            });
        }

        setHistoryIndex(prev => prev - 1);
        message.info("Undone");
        playSound("pop");
    };

    const handleRedo = () => {
        if (historyIndex >= history.length - 1) return;
        const change = history[historyIndex + 1];

        if (change.type === "manager") {
            dispatch({
                type: "UPDATE_EMPLOYEE",
                employeeId: change.employeeId,
                updates: { managerId: change.newValue },
            });
        } else if (change.type === "workstream") {
            const emp = state.employees.find(e => e.id === change.employeeId);
            if (emp) {
                dispatch({
                    type: "UPDATE_EMPLOYEE",
                    employeeId: change.employeeId,
                    updates: { workstreams: [...emp.workstreams, change.newValue] },
                });
            }
        } else if (change.type === "unassign") {
            dispatch({
                type: "UPDATE_EMPLOYEE",
                employeeId: change.employeeId,
                updates: { managerId: undefined, workstreams: [] },
            });
        }

        setHistoryIndex(prev => prev + 1);
        message.info("Redone");
        playSound("snap");
    };

    // Drag Handlers
    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
        playSound("pop");
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        if (!over) return;

        const employeeId = active.id as string;
        const employee = state.employees.find((e) => e.id === employeeId);
        if (!employee) return;

        const overId = over.id as string;

        // Unassign Drop
        if (overId === "unassign-zone") {
            if (!employee.managerId && employee.workstreams.length === 0) return;

            addToHistory({
                type: "unassign",
                employeeId: employee.id,
                employeeName: employee.name,
                oldValue: { managerId: employee.managerId, workstreams: [...employee.workstreams] },
                newValue: null
            });

            dispatch({
                type: "UPDATE_EMPLOYEE",
                employeeId: employee.id,
                updates: { managerId: undefined, workstreams: [] }
            });

            message.success(`Unassigned ${employee.name}`);
            playSound("snap");
            return;
        }

        // Leader Drop
        if (overId.startsWith("leader-")) {
            const newManagerId = overId.replace("leader-", "");
            if (newManagerId === employee.managerId) return;
            if (newManagerId === employee.id) {
                message.error("Cannot assign yourself as manager");
                playSound("error");
                return;
            }

            addToHistory({
                type: "manager",
                employeeId: employee.id,
                employeeName: employee.name,
                oldValue: employee.managerId,
                newValue: newManagerId
            });

            dispatch({
                type: "UPDATE_EMPLOYEE",
                employeeId: employee.id,
                updates: { managerId: newManagerId }
            });

            const manager = state.employees.find(e => e.id === newManagerId);
            message.success(`Assigned to ${manager?.name}`);
            playSound("snap");
            return;
        }

        // Workstream Drop
        if (overId.startsWith("workstream-")) {
            const workstream = overId.replace("workstream-", "") as WorkstreamKey;
            if (employee.workstreams.includes(workstream)) return;

            addToHistory({
                type: "workstream",
                employeeId: employee.id,
                employeeName: employee.name,
                oldValue: null,
                newValue: workstream
            });

            dispatch({
                type: "UPDATE_EMPLOYEE",
                employeeId: employee.id,
                updates: { workstreams: [...employee.workstreams, workstream] }
            });

            message.success(`Added to ${workstream}`);
            playSound("snap");
            return;
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="manage-org">
                {/* Header */}
                <div className="manage-org-header">
                    <div className="header-content">
                        <h1 className="page-title">
                            <SwapOutlined /> Manage Organization
                        </h1>
                        <p className="page-subtitle">
                            Drag people logic re-imagined.
                        </p>
                    </div>
                    <Space>
                        <Tooltip title="Undo (Ctrl+Z)">
                            <Button
                                icon={<UndoOutlined />}
                                disabled={historyIndex < 0}
                                onClick={handleUndo}
                            />
                        </Tooltip>
                        <Tooltip title="Redo (Ctrl+Shift+Z)">
                            <Button
                                icon={<RedoOutlined />}
                                disabled={historyIndex >= history.length - 1}
                                onClick={handleRedo}
                            />
                        </Tooltip>
                    </Space>
                </div>

                {/* 3-Panel Layout */}
                <div className="manage-org-layout">
                    {/* Left: Workstreams */}
                    <Card className="panel workstreams-panel" title="Workstreams">
                        <div className="workstreams-list">
                            {workstreams.map((ws) => (
                                <DroppableWorkstream
                                    key={ws}
                                    workstream={ws}
                                    count={workstreamCounts[ws] || 0}
                                    color={getModuleColor(ws)}
                                    // Dim if active employee already has this workstream
                                    isDimmed={!!activeId && (activeEmployee?.workstreams.includes(ws) || false)}
                                    submodules={getSubmodules(ws)}
                                />
                            ))}

                            {workstreams.length === 0 && (
                                <Empty description="No workstreams" />
                            )}
                        </div>
                    </Card>

                    {/* Center: Roster */}
                    <Card
                        className="panel roster-panel"
                        title={
                            <span>
                                People Roster
                                <Badge count={filteredEmployees.length} className="roster-count" />
                            </span>
                        }
                        extra={
                            <Input
                                placeholder="Search..."
                                prefix={<SearchOutlined />}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ width: 180 }}
                                allowClear
                            />
                        }
                    >
                        <div className="roster-list">
                            {filteredEmployees.map((emp) => (
                                <DraggablePerson
                                    key={emp.id}
                                    employee={emp}
                                    isLeader={leaderIds.has(emp.id)}
                                    reportCount={getReportCount(emp.id)}
                                />
                            ))}
                            {filteredEmployees.length === 0 && <Empty />}
                        </div>
                    </Card>

                    {/* Right: Leaders */}
                    <Card className="panel leaders-panel" title="Leaders (Drop Zones)">
                        <div className="leaders-list">
                            {leaders.map((leader) => (
                                <DroppableLeader
                                    key={leader.id}
                                    leader={leader}
                                    reportCount={getReportCount(leader.id)}
                                    isActive={!!activeId}
                                />
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Floating Unassign Zone */}
                <UnassignDropZone isActive={!!activeId} />

                {/* Drag Overlay - Portaled */}
                {typeof document !== "undefined" && createPortal(
                    <DragOverlay>
                        {activeEmployee ? (
                            <div className="drag-overlay-card">
                                <div className="person-avatar">
                                    <UserOutlined />
                                </div>
                                <div className="person-info">
                                    <div className="person-name">{activeEmployee.name}</div>
                                    <div className="person-title">{activeEmployee.title}</div>
                                </div>
                            </div>
                        ) : null}
                    </DragOverlay>,
                    document.body
                )}
            </div>
        </DndContext>
    );
}
