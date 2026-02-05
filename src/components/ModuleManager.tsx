import React, { useMemo, useState } from 'react';
import { Tree, Button, Input, Space, Tooltip, Popconfirm, Modal, Form, Select, Card, Empty, Tag } from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    FolderOutlined,
    FileOutlined,
    AppstoreOutlined
} from '@ant-design/icons';
import { useOrgStore } from '../state/orgStore';
import type { ModuleNode } from '../domain/types';
import type { DataNode } from 'antd/es/tree';



export const ModuleManager: React.FC = () => {
    const { state, dispatch } = useOrgStore();
    const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
    const [selectedKey, setSelectedKey] = useState<string | null>(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingNode, setEditingNode] = useState<ModuleNode | null>(null);
    const [parentForNew, setParentForNew] = useState<string | null>(null);
    const [form] = Form.useForm();

    // Convert flat modules to tree structure
    const treeData = useMemo(() => {
        const buildTree = (parentId?: string): DataNode[] => {
            return state.modules
                .filter(m => m.parentId === parentId || (!parentId && !m.parentId))
                .map(m => {
                    const children = buildTree(m.id);
                    return {
                        key: m.id,
                        title: (
                            <span className="tree-node-title">
                                {m.name}
                                {m.workstream && <Tag style={{ marginLeft: 8, fontSize: 10 }}>{m.workstream}</Tag>}
                            </span>
                        ),
                        icon: children.length > 0 ? <FolderOutlined /> : <FileOutlined />,
                        children: children.length > 0 ? children : undefined,
                        isLeaf: children.length === 0,
                        data: m // Store original data
                    };
                });
        };
        return buildTree(undefined);
    }, [state.modules]);

    // Auto-fill form values based on context
    const initialValues = useMemo(() => {
        if (editingNode) return editingNode;
        if (parentForNew) {
            const parent = state.modules.find(m => m.id === parentForNew);
            return {
                type: parent?.type,
                workstream: parent?.workstream
            };
        }
        return { type: "Vertical" };
    }, [editingNode, parentForNew, state.modules]);

    const handleAdd = (parentId?: string) => {
        setEditingNode(null);
        setParentForNew(parentId || null);
        form.resetFields();
        setIsModalOpen(true);
    };

    const handleEdit = (node: ModuleNode) => {
        setEditingNode(node);
        setParentForNew(null);
        form.setFieldsValue(node);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        dispatch({ type: "DELETE_MODULE", moduleId: id });
    };

    const handleSave = (values: any) => {
        let workstream = editingNode?.workstream;
        let type = values.type || editingNode?.type;

        if (!editingNode) {
            // Creating New
            if (parentForNew) {
                // Submodule: Inherit from parent
                const parent = state.modules.find(m => m.id === parentForNew);
                if (parent) {
                    workstream = parent.workstream;
                    type = parent.type;
                }
            } else {
                // Root: Workstream = Name
                workstream = values.name;
            }
        } else {
            // Editing
            if (!editingNode.parentId) {
                // If renaming Root, update workstream to match
                workstream = values.name;
            }
        }

        if (editingNode) {
            dispatch({
                type: "UPDATE_MODULE",
                moduleId: editingNode.id,
                updates: { ...values, workstream, type }
            });
        } else {
            const newId = `mod-${Date.now()}`;
            const newModule: ModuleNode = {
                id: newId,
                name: values.name,
                workstream: workstream || values.name, // Fallback
                type: type || "Vertical",
                parentId: parentForNew || undefined,
                tags: [],
                description: values.description
            };
            dispatch({ type: "ADD_MODULE", module: newModule });

            if (parentForNew) {
                setExpandedKeys(prev => [...prev, parentForNew]);
            }
        }
        setIsModalOpen(false);
    };

    // ... titleRender code ... (unchanged)
    const titleRender = (nodeData: any) => {
        const m = nodeData.data as ModuleNode;
        // Simplified: Don't show workstream tag if it matches name (Root)
        // Show type tag only on Root
        const isRoot = !m.parentId;

        return (
            <div
                className="tree-node-content"
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}
                onClick={() => setSelectedKey(m.id)}
            >
                <Space>
                    <span style={{ fontWeight: 500 }}>{m.name}</span>
                    {isRoot && m.type === "Horizontal" && <Tag color="orange">Horizontal</Tag>}
                    {isRoot && m.type === "Vertical" && <Tag color="blue">Vertical</Tag>}
                </Space>

                <Space className="node-actions" onClick={e => e.stopPropagation()}>
                    <Tooltip title="Add Submodule">
                        <Button
                            type="text"
                            size="small"
                            icon={<PlusOutlined />}
                            onClick={() => handleAdd(m.id)}
                        />
                    </Tooltip>
                    <Tooltip title="Edit">
                        <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(m)}
                        />
                    </Tooltip>
                    <Popconfirm
                        title="Delete module?"
                        description="This will delete all submodules as well."
                        onConfirm={(e) => handleDelete(m.id, e as any)}
                    >
                        <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            </div>
        );
    };

    const selectedNode = useMemo(() =>
        state.modules.find(m => m.id === selectedKey),
        [state.modules, selectedKey]);

    return (
        <div className="module-manager">
            <Space style={{ marginBottom: 16 }}>
                <Button type="primary" icon={<AppstoreOutlined />} onClick={() => handleAdd()}>
                    Add Root Module (Workstream)
                </Button>

                <Button
                    icon={<PlusOutlined />}
                    disabled={!selectedKey}
                    onClick={() => selectedKey && handleAdd(selectedKey)}
                >
                    Add Submodule
                </Button>

                <Button
                    icon={<EditOutlined />}
                    disabled={!selectedKey}
                    onClick={() => selectedNode && handleEdit(selectedNode)}
                >
                    Edit Selected
                </Button>
            </Space>

            <Card className="glass" style={{ minHeight: 400 }}>
                {state.modules.length === 0 ? (
                    <Empty description="No modules found. Add one to get started." />
                ) : (
                    <Tree
                        treeData={treeData}
                        showIcon
                        blockNode
                        titleRender={titleRender as any}
                        expandedKeys={expandedKeys}
                        onExpand={setExpandedKeys}
                        selectedKeys={selectedKey ? [selectedKey] : []}
                    />
                )}
            </Card>

            <Modal
                title={editingNode ? "Edit Module" : parentForNew ? "Add Submodule" : "Add Root Module (Workstream)"}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={() => form.submit()}
                destroyOnClose
            >
                <Form form={form} layout="vertical" onFinish={handleSave} initialValues={initialValues} preserve={false}>
                    {/* Show Parent Context when adding submodule */}
                    {parentForNew && (
                        <Form.Item label="Parent Module (Workstream)">
                            <Input
                                disabled
                                value={state.modules.find(m => m.id === parentForNew)?.name + " (" + state.modules.find(m => m.id === parentForNew)?.workstream + ")"}
                                style={{ color: 'rgba(255,255,255,0.7)', cursor: 'default' }}
                            />
                        </Form.Item>
                    )}

                    <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                        <Input placeholder={parentForNew ? "e.g. Shopping Cart" : "e.g. Checkout"} />
                    </Form.Item>

                    {/* Only show Type for Root modules */}
                    {!parentForNew && (
                        <Form.Item name="type" label="Type" rules={[{ required: true }]}>
                            <Select options={[
                                { label: "Vertical (Feature)", value: "Vertical" },
                                { label: "Horizontal (Platform)", value: "Horizontal" }
                            ]} />
                        </Form.Item>
                    )}

                    <Form.Item name="description" label="Description">
                        <Input.TextArea rows={2} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};
