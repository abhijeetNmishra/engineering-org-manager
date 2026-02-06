import { Tag } from "antd";
import type { OrgTreeNode } from "../domain/moduleDeepDive";
import "./ModuleDeepDiveOverlay.css";

interface ScopedOrgTreeProps {
    nodes: OrgTreeNode[];
}

function TreeNode({ node, depth = 0 }: { node: OrgTreeNode; depth?: number }) {
    const { employee, children } = node;

    return (
        <div className="tree-node-container">
            <div
                className="tree-node"
                style={{ marginLeft: depth * 24 }}
            >
                <div className="tree-node-content">
                    <span className="tree-node-name">{employee.name}</span>
                    <span className="tree-node-title">{employee.title}</span>
                    <Tag
                        className="tree-node-skill"
                        color={employee.primarySkill ? "blue" : "default"}
                    >
                        {employee.primarySkill || "Unassigned"}
                    </Tag>
                </div>
                {children.length > 0 && (
                    <span className="tree-node-count">
                        {children.length} report{children.length !== 1 ? "s" : ""}
                    </span>
                )}
            </div>
            {children.map(child => (
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
