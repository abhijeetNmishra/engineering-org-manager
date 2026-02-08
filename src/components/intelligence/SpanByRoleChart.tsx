import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Empty } from "antd";
import type { SpanSummary } from "../../domain/types";

interface SpanByRoleChartProps {
    data: SpanSummary[];
}

export function SpanByRoleChart({ data }: SpanByRoleChartProps) {
    if (!data || data.length === 0) {
        return <Empty description="No span data available" />;
    }

    // Define a custom tooltip
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const item = payload[0].payload as SpanSummary;
            return (
                <div className="chart-tooltip" style={{ background: "var(--card-bg)", padding: "12px", border: "1px solid var(--border-glass)", borderRadius: "8px" }}>
                    <p className="tooltip-label" style={{ fontWeight: 600, marginBottom: 4 }}>{label}</p>
                    <p className="tooltip-value">Avg Span: {item.avgSpan}</p>
                    <p className="tooltip-detail" style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                        Range: {item.minSpan} - {item.maxSpan} reports
                    </p>
                    <p className="tooltip-detail" style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                        Leaders: {item.leaderCount}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div style={{ width: "100%", height: 300 }}>
            <h4 style={{ marginBottom: 16, color: "var(--text-secondary)" }}>Average Span by Role</h4>
            <ResponsiveContainer>
                <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-glass)" />
                    <XAxis type="number" hide />
                    <YAxis
                        type="category"
                        dataKey="role"
                        width={140}
                        tick={{ fontSize: 11, fill: "var(--text-secondary)" }}
                        interval={0}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
                    <Bar dataKey="avgSpan" radius={[0, 4, 4, 0]} barSize={20}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.avgSpan > 8 ? "#EF4444" : "#3B82F6"} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
