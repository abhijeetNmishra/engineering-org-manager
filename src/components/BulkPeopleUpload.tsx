import { useState } from "react";
import { Upload, Button, Card, Typography, Space, Progress, List, Table, Modal, Input, message } from "antd";
import { InboxOutlined, FileTextOutlined, CheckCircleOutlined, WarningOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";
import Papa from "papaparse";
import { useOrgStore } from "../state/orgStore";
import { processEmployeeRows, type BulkUploadRow } from "../utils/csvProcessor";

const { Dragger } = Upload;
const { Title, Paragraph, Text } = Typography;


// Fixed syntax error
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
        // Validation (Fail fast for schema)
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

        // Delegate to pure function
        const result = processEmployeeRows(rows, state);

        dispatch({ type: "IMPORT_STATE", payload: result.newState });

        setProgress(100);
        setProcessing(false);

        const summaryLog = { type: "success" as const, message: `Complete! Created: ${result.createdCount}, Updated: ${result.updatedCount}` };
        setLogs([summaryLog, ...result.logs]);
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
