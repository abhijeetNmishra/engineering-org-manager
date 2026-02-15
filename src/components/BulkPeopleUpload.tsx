import { useState } from "react";
import { Upload, Button, Card, Typography, Space, Progress, List, Table, Modal, Input, message } from "antd";
import { InboxOutlined, FileTextOutlined, CheckCircleOutlined, WarningOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";
import Papa from "papaparse";
import { useOrgStore } from "../state/orgStore";
import type { ShiptOrgState, Employee, ModuleNode, EmployeeStatus, Ownership } from "../domain/types";

const { Dragger } = Upload;
const { Title, Paragraph, Text } = Typography;

interface BulkUploadRow {
    "Full Name": string;
    "Email": string;
    "Role": string;
    "Primary Skill": string;
    "Workstream": string;
    "Status"?: string;
    "Reports To"?: string;
    "Location"?: string;
    "Tenure"?: string;
    "Secondary Skills"?: string;
    "Submodules"?: string;
    "Notes"?: string;
}

export function BulkPeopleUpload() {
    const { state, dispatch } = useOrgStore();
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [logs, setLogs] = useState<{ type: "success" | "warning" | "error"; message: string }[]>([]);

    // Danger Zone State
    const [showResetEmployeesModal, setShowResetEmployeesModal] = useState(false);
    const [showResetModulesModal, setShowResetModulesModal] = useState(false);
    const [resetValidationText, setResetValidationText] = useState("");

    const handleResetEmployees = () => {
        if (resetValidationText !== "DELETE ALL EMPLOYEES") return;
        dispatch({ type: "RESET_EMPLOYEES" });
        message.success("All employees have been deleted.");
        setShowResetEmployeesModal(false);
        setResetValidationText("");
    };

    const handleResetModules = () => {
        if (resetValidationText !== "DELETE ALL WORKSTREAMS") return;
        dispatch({ type: "RESET_MODULES" });
        message.success("All workstreams and submodules have been deleted.");
        setShowResetModulesModal(false);
        setResetValidationText("");
    };

    const handleUpload = async (file: File) => {
        setProcessing(true);
        setProgress(10);
        setLogs([]);

        Papa.parse<BulkUploadRow>(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                processRows(results.data);
            },
            error: (err) => {
                setLogs([{ type: "error", message: `Parse Error: ${err.message}` }]);
                setProcessing(false);
            }
        });
    };

    const processRows = (rows: BulkUploadRow[]) => {
        let updatedCount = 0;
        let createdCount = 0;
        const newLogs: typeof logs = [];

        // 1. Validation (Fail fast for schema)
        if (rows.length === 0) {
            setLogs([{ type: "error", message: "File is empty" }]);
            setProcessing(false);
            return;
        }

        const requiredCols = ["Full Name", "Email", "Role", "Workstream"];
        const firstRow = rows[0];
        const missingCols = requiredCols.filter(col => !(col in firstRow));

        if (missingCols.length > 0) {
            setLogs([{ type: "error", message: `Missing required columns: ${missingCols.join(", ")}` }]);
            setProcessing(false);
            return;
        }

        // Clone state for mutation
        const nextEmployees = [...state.employees];
        const nextModules = [...state.modules];
        const emailToIdMap = new Map<string, string>();

        // Build email map from existing
        nextEmployees.forEach(e => {
            if (e.email) emailToIdMap.set(e.email.toLowerCase(), e.id);
        });

        // 2. Process Structure (Workstreams & Submodules)
        const workstreamMap = new Map<string, string>(); // Name -> ID

        // Index existing modules (workstreams = top-level modules without parentId)
        nextModules.forEach(m => {
            if (!m.parentId) {
                workstreamMap.set(m.name, m.id);
            }
        });

        rows.forEach((row) => {
            // Normalize inputs
            const workstreamName = row["Workstream"]?.trim();
            const submodulesStr = row["Submodules"]?.trim();

            if (!workstreamName) return;

            // Ensure Workstream Module Exists
            if (!workstreamMap.has(workstreamName)) {
                const newId = `ws-${workstreamName.toLowerCase().replace(/\s+/g, '-')}`;
                const newModule: ModuleNode = {
                    id: newId,
                    name: workstreamName,
                    workstream: workstreamName, // It defines itself
                    type: "Vertical", // Default to Vertical
                    tags: ["Imported"],
                    icon: "folder" // Default icon
                };
                nextModules.push(newModule);
                workstreamMap.set(workstreamName, newId);
                newLogs.push({ type: "success", message: `Created new Workstream: ${workstreamName}` });
            }

            const workstreamId = workstreamMap.get(workstreamName)!;

            // Ensure Submodules Exist
            if (submodulesStr) {
                const subs = submodulesStr.split(",").map(s => s.trim()).filter(Boolean);
                subs.forEach(subName => {
                    // Check if exists under this parent
                    const exists = nextModules.some(m => m.name === subName && m.parentId === workstreamId);
                    if (!exists) {
                        const subId = `mod-${subName.toLowerCase().replace(/\s+/g, '-')}-${Math.random().toString(36).substr(2, 4)}`;
                        nextModules.push({
                            id: subId,
                            name: subName,
                            workstream: workstreamName,
                            parentId: workstreamId,
                            type: "Vertical", // Inherit
                            tags: ["Imported"]
                        });
                    }
                });
            }
        });

        setProgress(50);

        // 3. Process People Upsert & ID Resolution
        const upsertMap = new Map<string, Employee>(); // Email -> Employee Object
        const emailToManagerEmail = new Map<string, string>(); // Email -> Manager Email
        const newOwnership: Ownership[] = [...(state.ownership || [])];

        rows.forEach(row => {
            const email = row["Email"]?.trim().toLowerCase();
            if (!email) return;

            const existingId = emailToIdMap.get(email);
            const id = existingId || `emp-${Math.random().toString(36).substr(2, 9)}`;

            // Map the intent
            if (row["Reports To"]) {
                emailToManagerEmail.set(email, row["Reports To"].trim().toLowerCase());
            }

            // Find existing object to preserve fields
            const existingEmp = nextEmployees.find(e => e.id === existingId);

            // Default baseline if new
            const baseEmp: Partial<Employee> = existingEmp || {
                id,
                moduleOwnershipIds: [],
                workstreams: [],
                secondarySkills: []
            };

            const statusRaw = row["Status"]?.toLowerCase();
            let status: EmployeeStatus = "active";
            if (statusRaw === "open") status = "open";
            else if (statusRaw?.includes("leave")) status = "on_leave";

            const name = row["Full Name"]?.trim() || baseEmp.name || "Unknown";
            const title = row["Role"]?.trim() || baseEmp.title || "Contributor";
            const primarySkill = row["Primary Skill"]?.trim() || baseEmp.primarySkill || "Generalist";
            const location = (row["Location"]?.trim() as any) || baseEmp.location || "US";
            const tenure = row["Tenure"] ? parseInt(row["Tenure"]) : baseEmp.tenure || 0;
            const secondarySkills = row["Secondary Skills"]?.split(",").map(s => s.trim()).filter(Boolean) || baseEmp.secondarySkills || [];
            const notes = row["Notes"]?.trim() || baseEmp.notes;
            const workstreams = row["Workstream"] ? [row["Workstream"].trim()] : (baseEmp.workstreams || []);

            // Resolve submodule names -> IDs for this employee
            const submodulesStr = row["Submodules"]?.trim();
            const workstreamName = row["Workstream"]?.trim();
            const workstreamId = workstreamName ? workstreamMap.get(workstreamName) : undefined;
            let resolvedSubmoduleIds: string[] = baseEmp.moduleOwnershipIds || [];

            if (submodulesStr && workstreamId) {
                const subNames = submodulesStr.split(",").map(s => s.trim()).filter(Boolean);
                resolvedSubmoduleIds = subNames
                    .map(subName => {
                        const mod = nextModules.find(m => m.name === subName && m.parentId === workstreamId);
                        return mod?.id;
                    })
                    .filter((id): id is string => !!id);

                // Create ownership records for this employee -> submodule
                resolvedSubmoduleIds.forEach(modId => {
                    const alreadyExists = newOwnership.some(o => o.moduleId === modId && o.ownerId === id);
                    if (!alreadyExists) {
                        newOwnership.push({ moduleId: modId, ownerId: id, ownershipType: "Contributor" });
                    }
                });
            }

            const newEmp: Employee = {
                id,
                moduleOwnershipIds: resolvedSubmoduleIds,
                managerId: baseEmp.managerId, // Will be updated in validation pass
                email: row["Email"]?.trim(), // Keep original case
                name,
                title,
                primarySkill,
                location,
                status,
                tenure,
                secondarySkills,
                notes,
                workstreams
            };

            if (existingId) updatedCount++;
            else createdCount++;

            upsertMap.set(email, newEmp);

            // Also update the global ID map so subsequent rows (reports) can find this person
            emailToIdMap.set(email, id);
        });

        // 4. Resolve Managers
        upsertMap.forEach((emp, email) => {
            const managerEmail = emailToManagerEmail.get(email);
            if (managerEmail) {
                const managerId = emailToIdMap.get(managerEmail);
                if (managerId) {
                    emp.managerId = managerId;
                } else {
                    newLogs.push({ type: "warning", message: `Could not find manager with email: ${managerEmail} for ${emp.name}` });
                }
            }
        });

        // 5. Commit to State
        // Remove old versions of upserted people from nextEmployees
        const finalEmployees = nextEmployees.filter(e => {
            const email = e.email?.toLowerCase();
            return !email || !upsertMap.has(email);
        });

        // Add all from upsertMap
        upsertMap.forEach(emp => finalEmployees.push(emp));

        // Log ownership mapping summary
        const existingOwnershipCount = state.ownership?.length || 0;
        const newMappingsCount = newOwnership.length - existingOwnershipCount;
        if (newMappingsCount > 0) {
            newLogs.push({ type: "success", message: `Created ${newMappingsCount} submodule ownership mapping(s) from the Submodules column.` });
        }

        const newState: ShiptOrgState = {
            ...state,
            employees: finalEmployees,
            modules: nextModules,
            ownership: newOwnership
        };

        dispatch({ type: "IMPORT_STATE", payload: newState });

        setProgress(100);
        setProcessing(false);
        newLogs.unshift({ type: "success", message: `Complete! Created: ${createdCount}, Updated: ${updatedCount}` });
        setLogs(newLogs);
    };

    const uploadProps: UploadProps = {
        name: 'file',
        multiple: false,
        accept: '.csv',
        showUploadList: false,
        beforeUpload: (file) => {
            handleUpload(file);
            return false;
        },
    };

    const schemaData = [
        {
            key: '1',
            col1: "Full Name", ex1: "Jane Doe",
            col2: "Email", ex2: "jane@example.com",
            col3: "Role", ex3: "Senior Engineer"
        },
        {
            key: '2',
            col1: "Primary Skill", ex1: "Backend",
            col2: "Workstream", ex2: "MP Engineering",
            col3: "Status", ex3: "Active"
        },
        {
            key: '3',
            col1: "Reports To", ex1: "manager@example.com",
            col2: "Location", ex2: "US",
            col3: "Tenure", ex3: "24"
        },
        {
            key: '4',
            col1: "Secondary Skills", ex1: "React, Node",
            col2: "Submodules", ex2: "Search, Browse",
            col3: "Notes", ex3: "High performer"
        }
    ];

    const columns = [
        { title: 'Column', dataIndex: 'col1', render: (t: string) => <Text strong>{t}</Text> },
        { title: 'Example', dataIndex: 'ex1', render: (t: string) => <Text type="secondary">{t}</Text> },
        { title: 'Column', dataIndex: 'col2', render: (t: string) => <Text strong>{t}</Text> },
        { title: 'Example', dataIndex: 'ex2', render: (t: string) => <Text type="secondary">{t}</Text> },
        { title: 'Column', dataIndex: 'col3', render: (t: string) => <Text strong>{t}</Text> },
        { title: 'Example', dataIndex: 'ex3', render: (t: string) => <Text type="secondary">{t}</Text> },
    ];

    // Replace the Danger Zone and Modals part:
    return (
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
            <Card className="glass-card">
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                    {/* ... (Keep Header and Upload logic same) ... */}
                    <div style={{ textAlign: "center" }}>
                        <Title level={3}>Bulk People Upload</Title>
                        <Paragraph type="secondary" style={{ maxWidth: 600, margin: "0 auto 20px" }}>
                            Upload a single CSV to update your entire organization. We'll automatically identify existing people by email and create any missing Workstreams or Submodules.
                        </Paragraph>

                        <div style={{ background: "rgba(0,0,0,0.03)", padding: 16, borderRadius: 8, marginBottom: 20, textAlign: "left" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                <span style={{ fontWeight: 600, color: "#6B21EF" }}>Required Format (CSV)</span>
                                <Button
                                    type="link"
                                    icon={<FileTextOutlined />}
                                    onClick={() => {
                                        const headers = ["Full Name", "Email", "Role", "Primary Skill", "Workstream", "Status", "Reports To", "Location", "Tenure", "Secondary Skills", "Submodules", "Notes"];
                                        const exampleRows = [
                                            ["Jane Doe", "jane@example.com", "Senior Engineer", "Backend", "MP Engineering", "Active", "manager@example.com", "US", "24", "React, Node", "Search, Browse", "High performer"],
                                            ["John Smith", "john@example.com", "Engineering Manager", "Full Stack", "Checkout", "Active", "", "US", "36", "Python, AWS", "Payments", "Team lead"]
                                        ];
                                        const csvContent = [headers.join(","), ...exampleRows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");
                                        const blob = new Blob([csvContent], { type: "text/csv" });
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement("a");
                                        a.href = url;
                                        a.download = "org_upload_template.csv";
                                        a.click();
                                        URL.revokeObjectURL(url);
                                    }}
                                >
                                    Download Template
                                </Button>
                            </div>
                            <Table
                                dataSource={schemaData}
                                columns={columns}
                                pagination={false}
                                size="small"
                                showHeader={false}
                                bordered
                            />
                        </div>
                    </div>

                    <Dragger {...uploadProps} style={{ padding: 40, background: "rgba(255,255,255,0.02)", border: "2px dashed rgba(255,255,255,0.2)" }}>
                        <p className="ant-upload-drag-icon">
                            <InboxOutlined style={{ color: "#6B21EF", fontSize: 48 }} />
                        </p>
                        <p className="ant-upload-text">Click or drag file to this area to upload</p>
                        <p className="ant-upload-hint">
                            Ensure "Email" column is present. "Workstream" and "Role" are required for new records.
                        </p>
                    </Dragger>

                    {processing && <Progress percent={progress} status="active" strokeColor="#6B21EF" />}

                    {logs.length > 0 && (
                        <List
                            header={<div>Upload Results</div>}
                            bordered
                            dataSource={logs}
                            renderItem={(item) => (
                                <List.Item>
                                    {item.type === "success" && <CheckCircleOutlined style={{ color: "#52c41a", marginRight: 8 }} />}
                                    {item.type === "warning" && <WarningOutlined style={{ color: "#faad14", marginRight: 8 }} />}
                                    {item.type === "error" && <WarningOutlined style={{ color: "#ff4d4f", marginRight: 8 }} />}
                                    <Text>{item.message}</Text>
                                </List.Item>
                            )}
                            style={{ maxHeight: 300, overflow: "auto", background: "rgba(0,0,0,0.2)" }}
                        />
                    )}

                    <div style={{ marginTop: 40, borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 20 }}>
                        <Title level={5} type="danger">Danger Zone</Title>
                        <Paragraph type="secondary">
                            These actions are irreversible. Please type the confirmation phrase exactly to proceed.
                        </Paragraph>
                        <Space wrap>
                            <Button danger onClick={() => { setShowResetEmployeesModal(true); setResetValidationText(""); }}>
                                Delete All Employees
                            </Button>
                            <Button danger onClick={() => { setShowResetModulesModal(true); setResetValidationText(""); }}>
                                Delete All Workstreams
                            </Button>
                        </Space>
                    </div>

                    {/* Reset Employees Modal */}
                    <Modal
                        title={<span style={{ color: "#cf1322" }}>⚠️ Irreversible: Delete All Employees</span>}
                        open={showResetEmployeesModal}
                        onOk={handleResetEmployees}
                        onCancel={() => setShowResetEmployeesModal(false)}
                        okText="Delete All Employees"
                        okType="danger"
                        okButtonProps={{ disabled: resetValidationText !== "DELETE ALL EMPLOYEES" }}
                    >
                        <Paragraph>
                            This will <b>permanently delete ALL employee records</b>. Workstreams and Modules will be preserved.
                        </Paragraph>
                        <Paragraph>
                            Type <b>DELETE ALL EMPLOYEES</b> to confirm.
                        </Paragraph>
                        <Input
                            placeholder="Type DELETE ALL EMPLOYEES"
                            value={resetValidationText}
                            onChange={e => setResetValidationText(e.target.value)}
                        />
                    </Modal>

                    {/* Reset Modules Modal */}
                    <Modal
                        title={<span style={{ color: "#cf1322" }}>⚠️ Irreversible: Delete All Workstreams</span>}
                        open={showResetModulesModal}
                        onOk={handleResetModules}
                        onCancel={() => setShowResetModulesModal(false)}
                        okText="Delete All Workstreams"
                        okType="danger"
                        okButtonProps={{ disabled: resetValidationText !== "DELETE ALL WORKSTREAMS" }}
                    >
                        <Paragraph>
                            This will <b>permanently delete ALL workstreams and submodules</b>. Employees will remain but be unassigned.
                        </Paragraph>
                        <Paragraph>
                            Type <b>DELETE ALL WORKSTREAMS</b> to confirm.
                        </Paragraph>
                        <Input
                            placeholder="Type DELETE ALL WORKSTREAMS"
                            value={resetValidationText}
                            onChange={e => setResetValidationText(e.target.value)}
                        />
                    </Modal>
                </Space>
            </Card>
        </div>
    );
}
