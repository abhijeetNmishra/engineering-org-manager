import { useMemo, useState } from "react";
import { Card, Upload, Button, Space, message, Divider, Typography, Table, Tag, Tabs } from "antd";
import type { UploadProps } from "antd";
import {
    CloudUploadOutlined,
    AppstoreOutlined,
    PartitionOutlined,
    FileTextOutlined,
    SafetyCertificateOutlined
} from "@ant-design/icons";
import Papa from "papaparse";
import { useOrgStore } from "../state/orgStore";
import type { ShiptOrgState } from "../domain/types";
import { ModuleManager } from "../components/ModuleManager";
import { OwnershipMatrix } from "../components/OwnershipMatrix";

const { Title, Paragraph } = Typography;

function downloadText(filename: string, text: string, mime = "text/plain") {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

export default function ImportExport() {
    const { state, dispatch } = useOrgStore();
    const [preview, setPreview] = useState<any[]>([]);

    const schemaHelp = useMemo(
        () => [
            { file: "employees.csv", columns: "id,name,title,location,managerId,workstreams,notes" },
            { file: "modules.csv", columns: "id,name,workstream,type,parentId,tags" },
            { file: "ownership.csv", columns: "moduleId,ownerId,ownershipType" },
        ],
        []
    );

    const parseCsvFile = (file: File) =>
        new Promise<any[]>((resolve, reject) => {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => resolve(results.data as any[]),
                error: (err) => reject(err),
            });
        });

    const importEmployees = async (file: File) => {
        const rows = await parseCsvFile(file);
        setPreview(rows.slice(0, 10));

        const employees = rows.map((r) => ({
            id: String(r.id ?? "").trim(),
            name: String(r.name ?? "").trim(),
            title: String(r.title ?? "").trim(),
            location: String(r.location ?? "US").trim(),
            managerId: String(r.managerId ?? "").trim() || undefined,
            workstreams: String(r.workstreams ?? "")
                .split("|")
                .map((s) => s.trim())
                .filter(Boolean),
            moduleOwnershipIds: [],
            notes: String(r.notes ?? "").trim() || undefined,
        }));

        const next: ShiptOrgState = { ...state, employees: employees as any };
        dispatch({ type: "IMPORT_STATE", payload: next });
        message.success(`Imported ${employees.length} employees`);
    };

    const importModules = async (file: File) => {
        const rows = await parseCsvFile(file);
        setPreview(rows.slice(0, 10));

        const modules = rows.map((r) => ({
            id: String(r.id ?? "").trim(),
            name: String(r.name ?? "").trim(),
            workstream: String(r.workstream ?? "").trim(),
            type: String(r.type ?? "").trim(),
            parentId: String(r.parentId ?? "").trim() || undefined,
            tags: String(r.tags ?? "")
                .split("|")
                .map((s) => s.trim())
                .filter(Boolean),
        }));

        const next: ShiptOrgState = { ...state, modules: modules as any };
        dispatch({ type: "IMPORT_STATE", payload: next });
        message.success(`Imported ${modules.length} modules`);
    };

    const importOwnership = async (file: File) => {
        const rows = await parseCsvFile(file);
        setPreview(rows.slice(0, 10));

        const ownership = rows.map((r) => ({
            moduleId: String(r.moduleId ?? "").trim(),
            ownerId: String(r.ownerId ?? "").trim(),
            ownershipType: String(r.ownershipType ?? "Contributor").trim(),
        }));

        const next: ShiptOrgState = { ...state, ownership: ownership as any };
        dispatch({ type: "IMPORT_STATE", payload: next });
        message.success(`Imported ${ownership.length} ownership rows`);
    };

    const uploadProps = (handler: (f: File) => Promise<void>): UploadProps => ({
        accept: ".csv",
        multiple: false,
        showUploadList: false,
        beforeUpload: async (file) => {
            try {
                await handler(file as File);
            } catch (e: any) {
                message.error(e?.message || "Import failed");
            }
            return false;
        },
    });

    const exportSnapshot = () => {
        downloadText("shipt-org-snapshot.json", JSON.stringify(state, null, 2), "application/json");
        message.success("Downloaded JSON snapshot");
    };

    const exportCsv = () => {
        const employeesCsv = Papa.unparse(
            state.employees.map((e) => ({
                id: e.id,
                name: e.name,
                title: e.title,
                location: e.location,
                managerId: e.managerId ?? "",
                workstreams: (e.workstreams ?? []).join("|"),
                notes: e.notes ?? "",
            }))
        );

        const modulesCsv = Papa.unparse(
            state.modules.map((m) => ({
                id: m.id,
                name: m.name,
                workstream: m.workstream,
                type: m.type,
                parentId: m.parentId ?? "",
                tags: (m.tags ?? []).join("|"),
            }))
        );

        const ownershipCsv = Papa.unparse(state.ownership);

        downloadText("employees.csv", employeesCsv, "text/csv");
        downloadText("modules.csv", modulesCsv, "text/csv");
        downloadText("ownership.csv", ownershipCsv, "text/csv");
        message.success("Downloaded CSVs");
    };

    // Tab Items
    const items = [
        {
            key: '1',
            label: <span><AppstoreOutlined /> Module Manager</span>,
            children: (
                <div>
                    <Paragraph className="muted">
                        Visual editor for the organization's technical components. Add, rename, or restructure modules.
                    </Paragraph>
                    <ModuleManager />
                </div>
            )
        },
        {
            key: '2',
            label: <span><CloudUploadOutlined /> Bulk Data Tools</span>,
            children: (
                <Card className="glass">
                    <Paragraph className="muted">
                        Upload CSVs from your org spreadsheet (local-only). Export a JSON snapshot + CSVs anytime.
                    </Paragraph>

                    <Space wrap>
                        <Upload {...uploadProps(importEmployees)}>
                            <Button icon={<FileTextOutlined />}>Import employees.csv</Button>
                        </Upload>
                        <Upload {...uploadProps(importModules)}>
                            <Button icon={<PartitionOutlined />}>Import modules.csv</Button>
                        </Upload>
                        <Upload {...uploadProps(importOwnership)}>
                            <Button icon={<AppstoreOutlined />}>Import ownership.csv</Button>
                        </Upload>
                    </Space>

                    <Divider type="vertical" style={{ height: 28 }} />

                    <Space wrap>
                        <Button type="primary" onClick={exportSnapshot}>
                            Download snapshot (JSON)
                        </Button>
                        <Button onClick={exportCsv}>Download CSVs</Button>
                        <Button danger onClick={() => dispatch({ type: "RESET_DEMO" })}>
                            Reset demo data
                        </Button>
                    </Space>

                    <Divider />

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
                        {schemaHelp.map((s) => (
                            <Tag key={s.file}>
                                <b>{s.file}</b>: {s.columns}
                            </Tag>
                        ))}
                    </div>

                    <div className="muted" style={{ marginBottom: 10 }}>
                        Preview (first 10 rows of last import)
                    </div>
                    <Table
                        size="small"
                        rowKey={(_, i) => String(i)}
                        dataSource={preview}
                        columns={(preview[0] ? Object.keys(preview[0]) : ["—"]).map((k) => ({
                            title: k,
                            dataIndex: k,
                        }))}
                        pagination={false}
                        scroll={{ x: true }}
                    />
                </Card>
            )
        },
        {
            key: '3',
            label: <span><SafetyCertificateOutlined /> Ownership Matrix</span>,
            children: (
                <div>
                    <Paragraph className="muted">
                        Assign module owners and define primary/secondary responsibilities. Ensure every critical component has an owner.
                    </Paragraph>
                    <OwnershipMatrix />
                </div>
            )
        }
    ];

    return (
        <div>
            <Title level={4} style={{ margin: "0 0 16px 0", color: "rgba(255,255,255,0.92)" }}>
                Data Management
            </Title>

            <Tabs defaultActiveKey="1" items={items} />
        </div>
    );
}