import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { Tag } from "antd";
import { CloseOutlined, TeamOutlined, UserOutlined, CrownOutlined, AppstoreOutlined } from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import { useOrgStore } from "../state/orgStore";
import { getModuleDeepDive, getSubmoduleEmployees } from "../domain/moduleDeepDive";
import { getModuleColor } from "../domain/orgMetrics";
import { getIconForModule } from "../utils/moduleIcons";
import { ScopedOrgTree } from "./ScopedOrgTree";
import type { OrgTreeNode } from "../domain/moduleDeepDive";
import "./ModuleDeepDiveOverlay.css";

interface ModuleDeepDiveOverlayProps {
    moduleId: string | null;
    onClose: () => void;
}

export function ModuleDeepDiveOverlay({ moduleId, onClose }: ModuleDeepDiveOverlayProps) {
    const { state } = useOrgStore();
    const scrollYRef = useRef<number>(0);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const [selectedSubmoduleId, setSelectedSubmoduleId] = useState<string | null>(null);

    // Reset selection when module changes
    useEffect(() => {
        setSelectedSubmoduleId(null);
    }, [moduleId]);

    // Compute deep dive data
    const data = useMemo(() => {
        if (!moduleId) return null;
        return getModuleDeepDive(state, moduleId);
    }, [state, moduleId]);

    // Lock body scroll when modal opens, restore on close
    useEffect(() => {
        if (moduleId) {
            // Store current scroll position
            scrollYRef.current = window.scrollY;

            // Lock body scroll (iOS-safe approach)
            document.body.style.position = "fixed";
            document.body.style.top = `-${scrollYRef.current}px`;
            document.body.style.left = "0";
            document.body.style.right = "0";
            document.body.style.overflow = "hidden";

            // Focus close button for accessibility
            setTimeout(() => closeButtonRef.current?.focus(), 100);

            return () => {
                // Restore body scroll
                document.body.style.position = "";
                document.body.style.top = "";
                document.body.style.left = "";
                document.body.style.right = "";
                document.body.style.overflow = "";

                // Restore scroll position
                window.scrollTo(0, scrollYRef.current);
            };
        }
    }, [moduleId]);

    // ESC key to close
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (moduleId) {
            window.addEventListener("keydown", handleEsc);
            return () => window.removeEventListener("keydown", handleEsc);
        }
    }, [moduleId, onClose]);

    const moduleColor = data ? getModuleColor(data.module.workstream) : "#6B21EF";

    // Helper to prune tree based on target IDs (keep nodes that lead to targets)
    const pruneTree = (nodes: OrgTreeNode[], keptIds: Set<string>): OrgTreeNode[] => {
        return nodes
            .map(node => {
                // Check if this node itself is a target
                const isTarget = keptIds.has(node.employee.id);

                // Recursively prune children
                const keptChildren = pruneTree(node.children, keptIds);

                // Keep this node if it is a target OR if it has kept children
                if (isTarget || keptChildren.length > 0) {
                    return {
                        ...node,
                        children: keptChildren
                    };
                }
                return null;
            })
            .filter((n): n is OrgTreeNode => n !== null);
    };

    const { filteredOrgTree } = useMemo(() => {
        if (!data) return { filteredOrgTree: [] };
        if (!selectedSubmoduleId) return { filteredOrgTree: data.orgTree };

        const result = getSubmoduleEmployees(state, selectedSubmoduleId, data.people);

        if (result.matchedIds.size === 0) {
            return { filteredOrgTree: [] };
        }

        const pruned = pruneTree(data.orgTree, result.matchedIds);
        return { filteredOrgTree: pruned };
    }, [data, selectedSubmoduleId, state]);

    return (
        <AnimatePresence>
            {moduleId && data && (
                <OverlayPortal>
                    <motion.div
                        className="deep-dive-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="deep-dive-title"
                    >
                        <motion.div
                            className="deep-dive-overlay"
                            initial={{ opacity: 0, scale: 0.9, y: 40 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 40 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            onClick={(e) => e.stopPropagation()}
                            style={{ "--module-color": moduleColor } as React.CSSProperties}
                        >
                            {/* Header - Sticky */}
                            <div className="deep-dive-header">
                                <div className="deep-dive-title-section">
                                    {(() => {
                                        const smartIcon = getIconForModule(data.module.name);
                                        const dataIcon = data.module.icon;
                                        // Use smart icon if data icon is invalid ("folder") or missing, otherwise prefer data icon if valid
                                        const finalIcon = (dataIcon && dataIcon !== "folder" && dataIcon.trim() !== "") ? dataIcon : smartIcon;

                                        return <span className="deep-dive-icon">{finalIcon}</span>;
                                    })()}
                                    <h2 id="deep-dive-title" className="deep-dive-title">{data.module.name}</h2>
                                    <Tag color={moduleColor}>{data.module.type}</Tag>
                                </div>

                                <div className="deep-dive-stats">
                                    <div className="deep-dive-stat">
                                        <span className="deep-dive-stat-value">{data.stats.total}</span>
                                        <span className="deep-dive-stat-label">
                                            <TeamOutlined /> People
                                        </span>
                                    </div>
                                    <div className="deep-dive-stat">
                                        <span className="deep-dive-stat-value">{data.stats.ics}</span>
                                        <span className="deep-dive-stat-label">
                                            <UserOutlined /> ICs
                                        </span>
                                    </div>
                                    <div className="deep-dive-stat">
                                        <span className="deep-dive-stat-value">{data.stats.leaders}</span>
                                        <span className="deep-dive-stat-label">
                                            <CrownOutlined /> Leaders
                                        </span>
                                    </div>
                                </div>

                                <button
                                    ref={closeButtonRef}
                                    className="deep-dive-close"
                                    onClick={onClose}
                                    aria-label="Close dialog"
                                >
                                    <CloseOutlined />
                                </button>
                            </div>

                            {/* Body - Scrollable */}
                            <div className="deep-dive-body">
                                {/* Sidebar: Submodules */}
                                <div className="deep-dive-sidebar">
                                    <div className="deep-dive-section-title">Submodules</div>
                                    <div className="submodule-list">
                                        {/* "All" Option */}
                                        <div
                                            className={`submodule-item ${selectedSubmoduleId === null ? "selected" : ""}`}
                                            onClick={() => setSelectedSubmoduleId(null)}
                                            style={{ cursor: "pointer" }}
                                        >
                                            <span className="submodule-icon">
                                                <AppstoreOutlined />
                                            </span>
                                            <span className="submodule-name">All Submodules</span>
                                        </div>

                                        {data.submodules.length > 0 ? (
                                            data.submodules.map(sub => (
                                                <div
                                                    key={sub.id}
                                                    className={`submodule-item ${selectedSubmoduleId === sub.id ? "selected" : ""}`}
                                                    onClick={() => setSelectedSubmoduleId(sub.id === selectedSubmoduleId ? null : sub.id)}
                                                    style={{ cursor: "pointer" }}
                                                >
                                                    <span className="submodule-icon">
                                                        {(() => {
                                                            if (sub.icon && sub.icon !== "folder" && sub.icon.trim() !== "") return sub.icon;
                                                            return "📁";
                                                        })()}
                                                    </span>
                                                    <span className="submodule-name">{sub.name}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="empty-submodules">
                                                <p>No submodules defined</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Main: Org Tree */}
                                <div className="deep-dive-main">
                                    <div className="deep-dive-section-title">
                                        Team Structure {selectedSubmoduleId && "(Filtered)"}
                                    </div>

                                    {filteredOrgTree.length > 0 ? (
                                        <ScopedOrgTree nodes={filteredOrgTree} />
                                    ) : (
                                        <div className="empty-tree-message" style={{
                                            padding: 40,
                                            textAlign: 'center',
                                            color: 'var(--text-secondary)',
                                            background: 'var(--surface-sunken)',
                                            borderRadius: 8,
                                            marginTop: 20
                                        }}>
                                            <TeamOutlined style={{ fontSize: 24, marginBottom: 8, opacity: 0.5 }} />
                                            <p>No active team members assigned to this submodule.</p>
                                            <p style={{ fontSize: '0.85em', opacity: 0.7, marginTop: 4 }}>
                                                Check your CSV import to ensure employees are mapped to "{data.submodules.find(s => s.id === selectedSubmoduleId)?.name}".
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </OverlayPortal>
            )}
        </AnimatePresence>
    );
}

// Simple Portal Component to handle DOM placement
function OverlayPortal({ children }: { children: React.ReactNode }) {
    // Check if document is available (SSR safety)
    if (typeof document === "undefined") return null;
    return ReactDOM.createPortal(children, document.body);
}
