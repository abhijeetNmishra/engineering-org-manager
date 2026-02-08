import { List, Avatar, Tooltip, Empty } from "antd";
import { UserOutlined, WarningOutlined } from "@ant-design/icons";
import type { SpanRow } from "../../domain/orgMetrics";
import { severityTagColor } from "../../domain/orgMetrics";

interface LeaderSpanListProps {
    data: SpanRow[];
    onLeaderClick?: (leaderId: string) => void;
}

export function LeaderSpanList({ data, onLeaderClick }: LeaderSpanListProps) {
    if (!data || data.length === 0) {
        return <Empty description="No leaders found" />;
    }

    // Sort by direct reports desc
    const sortedData = [...data].sort((a, b) => b.directReports - a.directReports);

    return (
        <div style={{ height: "100%", maxHeight: 400, overflowY: "auto", padding: "0 20px" }}>

            <List
                itemLayout="horizontal"
                dataSource={sortedData}
                renderItem={(item) => (
                    <List.Item
                        className="leader-list-item"
                        style={{
                            cursor: "pointer",
                            borderBottom: "1px solid var(--border-glass)",
                            padding: "10px 0"
                        }}
                        onClick={() => onLeaderClick?.(item.leaderId)}
                    >
                        <List.Item.Meta
                            avatar={<Avatar icon={<UserOutlined />} style={{ background: item.severity === "risk" ? "#EF4444" : "var(--primary-color)" }} />}
                            title={
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{item.leaderName}</span>
                                    <span style={{
                                        fontWeight: 700,
                                        color: item.severity === "risk" ? "#EF4444" : item.severity === "warn" ? "#F59E0B" : "var(--text-secondary)"
                                    }}>
                                        {item.directReports}
                                    </span>
                                </div>
                            }
                            description={
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{item.leaderTitle}</span>
                                    {item.severity !== "ok" && (
                                        <Tooltip title={item.flags.join(", ")}>
                                            <WarningOutlined style={{ color: severityTagColor(item.severity), fontSize: 12 }} />
                                        </Tooltip>
                                    )}
                                </div>
                            }
                        />
                    </List.Item>
                )}
            />
        </div>
    );
}
