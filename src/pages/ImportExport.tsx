import { Typography, Tabs } from "antd";
import {
    CloudUploadOutlined,
    AppstoreOutlined,
    SafetyCertificateOutlined
} from "@ant-design/icons";
import { ModuleManager } from "../components/ModuleManager";
import { OwnershipMatrix } from "../components/OwnershipMatrix";
import { BulkPeopleUpload } from "../components/BulkPeopleUpload";

const { Title, Paragraph } = Typography;

export default function ImportExport() {
    // const { state, dispatch } = useOrgStore(); // Not needed right now in parent level
    // Actually BulkPeopleUpload uses store.

    // Legacy helpers removed. New flow uses BulkPeopleUpload.

    const items = [
        {
            key: '1',
            label: <span><CloudUploadOutlined /> Bulk Upload</span>,
            children: (
                <div style={{ paddingTop: 20 }}>
                    <BulkPeopleUpload />
                </div>
            )
        },
        {
            key: '2',
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
            <Title level={4} style={{ margin: "0 0 16px 0", color: "var(--text-primary)" }}>
                Data Management
            </Title>

            <Tabs defaultActiveKey="1" items={items} />
        </div>
    );
}