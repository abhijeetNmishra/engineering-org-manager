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
} from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import type { Employee, WorkstreamKey } from "../domain/types";
import { useOrgStore } from "../state/orgStore";
import { getLeaders, getModuleColor } from "../domain/orgMetrics";
import "./ManageOrg.css";

// Types for undo/redo
interface OrgChange {
    type: "manager" | "workstream";
    employeeId: string;
    oldValue: string | undefined;
    newValue: string | undefined;
    employeeName: string;
}

// Draggable Person Card
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
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <motion.div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={`draggable-person ${isDragging ? "dragging" : ""}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            layout
        >
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
        </motion.div>
    );
}

// Droppable Leader Zone
function DroppableLeader({
    leader,
    reportCount,
    isActive,
    children,
}: {
    leader: Employee;
    reportCount: number;
    isActive: boolean;
    children?: React.ReactNode;
}) {
    const { isOver, setNodeRef } = useDroppable({
        id: `leader-${leader.id}`,
        data: { leader },
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
                {children}
                {!children && <span className="drop-hint">Drop to assign</span>}
            </div>
        </div>
    );
}

// Droppable Workstream Zone
function DroppableWorkstream({
    workstream,
    count,
    color,
}: {
    workstream: WorkstreamKey;
    count: number;
    color: string;
}) {
    const { isOver, setNodeRef } = useDroppable({
        id: `workstream-${workstream}`,
        data: { workstream },
    });

    return (
        <div
            ref={setNodeRef}
            className={`droppable-workstream ${isOver ? "over" : ""}`}
            style={{ borderLeftColor: color }}
        >
            <div className="workstream-dot" style={{ background: color }} />
            <span className="workstream-name">{workstream}</span>
            <Badge count={count} className="workstream-count" />
        </div>
    );
}

export default function ManageOrg() {
    const { state, dispatch } = useOrgStore();

    // State
    const [searchTerm, setSearchTerm] = useState("");
    const [activeId, setActiveId] = useState<string | null>(null);
    const [selectedWorkstream] = useState<WorkstreamKey | null>(null);
    const [history, setHistory] = useState<OrgChange[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // Sensors for drag detection
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        }),
        useSensor(KeyboardSensor)
    );

    // Keyboard shortcuts for undo/redo
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "z") {
                if (e.shiftKey) {
                    // Redo: Ctrl+Shift+Z or Cmd+Shift+Z
                    e.preventDefault();
                    if (historyIndex < history.length - 1) {
                        const change = history[historyIndex + 1];
                        if (change.type === "manager") {
                            dispatch({
                                type: "UPDATE_EMPLOYEE",
                                employeeId: change.employeeId,
                                updates: { managerId: change.newValue },
                            });
                        }
                        setHistoryIndex((prev) => prev + 1);
                    }
                } else {
                    // Undo: Ctrl+Z or Cmd+Z
                    e.preventDefault();
                    if (historyIndex >= 0) {
                        const change = history[historyIndex];
                        if (change.type === "manager") {
                            dispatch({
                                type: "UPDATE_EMPLOYEE",
                                employeeId: change.employeeId,
                                updates: { managerId: change.oldValue },
                            });
                        }
                        setHistoryIndex((prev) => prev - 1);
                    }
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [history, historyIndex, dispatch]);

    // Computed data
    const leaders = useMemo(() => getLeaders(state), [state]);
    const leaderIds = useMemo(() => new Set(leaders.map((l) => l.id)), [leaders]);

    const workstreams = useMemo(() => {
        const ws = Array.from(new Set(state.employees.flatMap((e) => e.workstreams)));
        return ws.sort() as WorkstreamKey[];
    }, [state.employees]);

    const workstreamCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        workstreams.forEach((ws) => {
            counts[ws] = state.employees.filter((e) => e.workstreams.includes(ws)).length;
        });
        return counts;
    }, [state.employees, workstreams]);

    // Filter employees for the roster
    const filteredEmployees = useMemo(() => {
        let result = state.employees;

        if (searchTerm) {
            result = result.filter(
                (e) =>
                    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    e.title.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (selectedWorkstream) {
            result = result.filter((e) => e.workstreams.includes(selectedWorkstream));
        }

        return result;
    }, [state.employees, searchTerm, selectedWorkstream]);

    // Get report counts for leaders
    const getReportCount = useCallback(
        (leaderId: string) => {
            return state.employees.filter((e) => e.managerId === leaderId).length;
        },
        [state.employees]
    );

    // Active employee being dragged
    const activeEmployee = useMemo(() => {
        if (!activeId) return null;
        return state.employees.find((e) => e.id === activeId) || null;
    }, [activeId, state.employees]);

    // Add to history
    const addToHistory = useCallback((change: OrgChange) => {
        setHistory((prev) => {
            const newHistory = prev.slice(0, historyIndex + 1);
            newHistory.push(change);
            return newHistory.slice(-50); // Keep last 50 changes
        });
        setHistoryIndex((prev) => Math.min(prev + 1, 49));
    }, [historyIndex]);

    // Undo
    const handleUndo = useCallback(() => {
        if (historyIndex < 0) return;

        const change = history[historyIndex];
        if (change.type === "manager") {
            dispatch({
                type: "UPDATE_EMPLOYEE",
                employeeId: change.employeeId,
                updates: { managerId: change.oldValue },
            });
        } else if (change.type === "workstream") {
            const emp = state.employees.find((e) => e.id === change.employeeId);
            if (emp && change.oldValue) {
                dispatch({
                    type: "UPDATE_EMPLOYEE",
                    employeeId: change.employeeId,
                    updates: {
                        workstreams: [...emp.workstreams.filter((w) => w !== change.newValue), change.oldValue as WorkstreamKey],
                    },
                });
            }
        }
        setHistoryIndex((prev) => prev - 1);
        message.info("Undone!");
    }, [history, historyIndex, dispatch, state.employees]);

    // Redo
    const handleRedo = useCallback(() => {
        if (historyIndex >= history.length - 1) return;

        const change = history[historyIndex + 1];
        if (change.type === "manager") {
            dispatch({
                type: "UPDATE_EMPLOYEE",
                employeeId: change.employeeId,
                updates: { managerId: change.newValue },
            });
        }
        setHistoryIndex((prev) => prev + 1);
        message.info("Redone!");
    }, [history, historyIndex, dispatch]);

    // Drag handlers
    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const employeeId = active.id as string;
        const employee = state.employees.find((e) => e.id === employeeId);
        if (!employee) return;

        const overId = over.id as string;

        // Dropped on a leader
        if (overId.startsWith("leader-")) {
            const newManagerId = overId.replace("leader-", "");
            if (newManagerId === employee.managerId) return;
            if (newManagerId === employee.id) {
                message.error("Cannot assign someone as their own manager!");
                return;
            }

            // Record change for undo
            addToHistory({
                type: "manager",
                employeeId: employee.id,
                oldValue: employee.managerId,
                newValue: newManagerId,
                employeeName: employee.name,
            });

            dispatch({
                type: "UPDATE_EMPLOYEE",
                employeeId: employee.id,
                updates: { managerId: newManagerId },
            });

            const newManager = state.employees.find((e) => e.id === newManagerId);
            message.success(
                <span>
                    <SwapOutlined /> Moved <strong>{employee.name}</strong> to report to{" "}
                    <strong>{newManager?.name}</strong>
                </span>
            );
        }

        // Dropped on a workstream
        if (overId.startsWith("workstream-")) {
            const workstream = overId.replace("workstream-", "") as WorkstreamKey;
            if (employee.workstreams.includes(workstream)) return;

            dispatch({
                type: "UPDATE_EMPLOYEE",
                employeeId: employee.id,
                updates: { workstreams: [...employee.workstreams, workstream] },
            });

            message.success(
                <span>
                    <CheckCircleOutlined /> Added <strong>{employee.name}</strong> to{" "}
                    <strong>{workstream}</strong>
                </span>
            );
        }
    };

    const handleDragCancel = () => {
        setActiveId(null);
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
        >
            <div className="manage-org">
                {/* Header */}
                <div className="manage-org-header">
                    <div className="header-content">
                        <h1 className="page-title">
                            <SwapOutlined /> Manage Organization
                        </h1>
                        <p className="page-subtitle">
                            Drag people to reassign managers or add to workstreams
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
                    {/* Left Panel: Workstreams */}
                    <Card className="panel workstreams-panel" title="Workstreams">
                        <div className="workstreams-list">
                            {workstreams.map((ws) => (
                                <DroppableWorkstream
                                    key={ws}
                                    workstream={ws}
                                    count={workstreamCounts[ws] || 0}
                                    color={getModuleColor(ws)}
                                />
                            ))}
                            {workstreams.length === 0 && (
                                <Empty description="No workstreams" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                            )}
                        </div>
                    </Card>

                    {/* Center Panel: People Roster */}
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
                                allowClear
                                style={{ width: 180 }}
                            />
                        }
                    >
                        <div className="roster-list">
                            <AnimatePresence>
                                {filteredEmployees.map((emp) => (
                                    <DraggablePerson
                                        key={emp.id}
                                        employee={emp}
                                        isLeader={leaderIds.has(emp.id)}
                                        reportCount={getReportCount(emp.id)}
                                    />
                                ))}
                            </AnimatePresence>
                            {filteredEmployees.length === 0 && (
                                <Empty description="No people found" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                            )}
                        </div>
                    </Card>

                    {/* Right Panel: Leaders (Drop Zones) */}
                    <Card className="panel leaders-panel" title="Leaders (Drop Zones)">
                        <div className="leaders-list">
                            {leaders.map((leader) => (
                                <DroppableLeader
                                    key={leader.id}
                                    leader={leader}
                                    reportCount={getReportCount(leader.id)}
                                    isActive={activeId !== null}
                                />
                            ))}
                            {leaders.length === 0 && (
                                <Empty description="No leaders" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                            )}
                        </div>
                    </Card>
                </div>

                {/* Drag Overlay */}
                <DragOverlay>
                    {activeEmployee && (
                        <div className="drag-overlay">
                            <div className="person-avatar">
                                <UserOutlined />
                            </div>
                            <div className="person-info">
                                <div className="person-name">{activeEmployee.name}</div>
                                <div className="person-title">{activeEmployee.title}</div>
                            </div>
                        </div>
                    )}
                </DragOverlay>
            </div>
        </DndContext>
    );
}
