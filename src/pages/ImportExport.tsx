import { useMemo, useState } from "react";
import { Card, Upload, Button, Space, message, Divider, Typography, Table, Tag } from "antd";
import type { UploadProps } from "antd";
import Papa from "papaparse";
import { useOrgStore } from "../state/orgStore";
import type { ShiptOrgState } from "../domain/types";

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
            return false; // prevent actual upload
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

    return (
        <div>
            <Title level={4} style={{ margin: 0, color: "rgba(255,255,255,0.92)" }}>
                Import / Export
            </Title>
            <Paragraph className="muted" style={{ marginTop: 6 }}>
                Upload CSVs from your org spreadsheet (local-only). Export a JSON snapshot + CSVs anytime.
            </Paragraph>

            <Card className="glass">
                <Space wrap>
                    <Upload {...uploadProps(importEmployees)}>
                        <Button>Import employees.csv</Button>
                    </Upload>
                    <Upload {...uploadProps(importModules)}>
                        <Button>Import modules.csv</Button>
                    </Upload>
                    <Upload {...uploadProps(importOwnership)}>
                        <Button>Import ownership.csv</Button>
                    </Upload>

                    <Divider type="vertical" style={{ height: 28, borderColor: "rgba(255,255,255,0.18)" }} />

                    <Button type="primary" onClick={exportSnapshot}>
                        Download snapshot (JSON)
                    </Button>
                    <Button onClick={exportCsv}>Download CSVs</Button>

                    <Button danger onClick={() => dispatch({ type: "RESET_DEMO" })}>
                        Reset demo data
                    </Button>
                </Space>

                <Divider style={{ borderColor: "rgba(255,255,255,0.14)" }} />

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {schemaHelp.map((s) => (
                        <Tag key={s.file}>
                            <b>{s.file}</b>: {s.columns}
                        </Tag>
                    ))}
                </div>

                <Divider style={{ borderColor: "rgba(255,255,255,0.14)" }} />

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
        </div>
    );
}