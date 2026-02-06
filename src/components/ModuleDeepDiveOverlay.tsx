import React, { useEffect, useMemo, useRef } from "react";
import ReactDOM from "react-dom";
import { Tag } from "antd";
import { CloseOutlined, TeamOutlined, UserOutlined, CrownOutlined } from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import { useOrgStore } from "../state/orgStore";
import { getModuleDeepDive } from "../domain/moduleDeepDive";
import { getModuleColor } from "../domain/orgMetrics";
import { ScopedOrgTree } from "./ScopedOrgTree";
import "./ModuleDeepDiveOverlay.css";

interface ModuleDeepDiveOverlayProps {
    moduleId: string | null;
    onClose: () => void;
}

export function ModuleDeepDiveOverlay({ moduleId, onClose }: ModuleDeepDiveOverlayProps) {
    const { state } = useOrgStore();
    const scrollYRef = useRef<number>(0);
    const closeButtonRef = useRef<HTMLButtonElement>(null);

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
                                    {data.module.icon && (
                                        <span className="deep-dive-icon">{data.module.icon}</span>
                                    )}
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
                                    {data.submodules.length > 0 ? (
                                        <div className="submodule-list">
                                            {data.submodules.map(sub => (
                                                <div key={sub.id} className="submodule-item">
                                                    <span className="submodule-icon">
                                                        {sub.icon || "📁"}
                                                    </span>
                                                    <span className="submodule-name">{sub.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="empty-submodules">
                                            <p>No submodules defined</p>
                                        </div>
                                    )}
                                </div>

                                {/* Main: Org Tree */}
                                <div className="deep-dive-main">
                                    <div className="deep-dive-section-title">Team Structure</div>
                                    <ScopedOrgTree nodes={data.orgTree} />
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
