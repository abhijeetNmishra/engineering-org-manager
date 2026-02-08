import { useState } from "react";
import { Tag } from "antd";
import { CaretRightOutlined, CaretDownOutlined } from "@ant-design/icons";
import type { OrgTreeNode } from "../domain/moduleDeepDive";
import "./ModuleDeepDiveOverlay.css";

interface ScopedOrgTreeProps {
    nodes: OrgTreeNode[];
}

function TreeNode({ node, depth = 0 }: { node: OrgTreeNode; depth?: number }) {
    const { employee, children } = node;
    const hasChildren = children.length > 0;

    // Auto-expand if has reports (User request)
    const [expanded, setExpanded] = useState(hasChildren);

    return (
        <div className="tree-node-container">
            <div
                className={`tree-node ${hasChildren ? "clickable" : ""}`}
                style={{ marginLeft: depth * 24 }}
                onClick={(e) => {
                    if (hasChildren) {
                        e.stopPropagation();
                        setExpanded(!expanded);
                    }
                }}
            >
                <div className="tree-node-content">
                    {/* Expand/Collapse Icon */}
                    <span className="tree-caret" style={{ width: 20, display: 'inline-block', textAlign: 'center', marginRight: 4 }}>
                        {hasChildren ? (
                            expanded ? <CaretDownOutlined style={{ fontSize: 10 }} /> : <CaretRightOutlined style={{ fontSize: 10 }} />
                        ) : <span />}
                    </span>

                    <span className="tree-node-name">{employee.name}</span>
                    <span className="tree-node-title">{employee.title}</span>
                    <Tag
                        className="tree-node-skill"
                        color={employee.primarySkill ? "blue" : "default"}
                    >
                        {employee.primarySkill || "Unassigned"}
                    </Tag>
                </div>
                {hasChildren && (
                    <span className="tree-node-count">
                        {children.length} report{children.length !== 1 ? "s" : ""}
                    </span>
                )}
            </div>

            {/* Recursive Children */}
            {expanded && children.map(child => (
                <TreeNode key={child.employee.id} node={child} depth={depth + 1} />
            ))}
        </div>
    );
}

export function ScopedOrgTree({ nodes }: ScopedOrgTreeProps) {
    if (nodes.length === 0) {
        return (
            <div className="empty-tree">
                <p>No people assigned yet</p>
            </div>
        );
    }

    return (
        <div className="scoped-org-tree">
            {nodes.map(node => (
                <TreeNode key={node.employee.id} node={node} />
            ))}
        </div>
    );
}
