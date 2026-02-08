import { motion } from "framer-motion";
import { Tooltip } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import type { CompositionMetric } from "../../domain/types";

interface CompositionTileGridProps {
    title: string;
    metrics: CompositionMetric[];
    onTileClick?: (metric: CompositionMetric) => void;
    loading?: boolean;
}

export function CompositionTileGrid({ title, metrics, onTileClick }: CompositionTileGridProps) {
    // Sort by count descending
    const sortedMetrics = [...metrics].sort((a, b) => b.count - a.count);

    return (
        <div className="composition-section" style={{ marginBottom: 24 }}>
            <div className="section-header" style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>
                    {title}
                </h3>
                <Tooltip title={`Distribution of ${title.toLowerCase()} across the organization`}>
                    <InfoCircleOutlined style={{ marginLeft: 8, color: "var(--text-muted)" }} />
                </Tooltip>
            </div>

            <div
                className="tile-grid"
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                    gap: "16px"
                }}
            >
                {sortedMetrics.map((metric, index) => (
                    <motion.div
                        key={metric.label}
                        className="composition-tile"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => onTileClick?.(metric)}
                        style={{
                            background: "var(--card-bg)",
                            border: "1px solid var(--border-glass)",
                            borderTop: `4px solid ${metric.color || "var(--primary-color)"}`,
                            borderRadius: "12px",
                            padding: "16px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: onTileClick ? "pointer" : "default",
                            position: "relative",
                            overflow: "hidden"
                        }}
                        whileHover={{ y: -4, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
                    >
                        {/* Progress circle background/border effect could go here */}

                        <div
                            className="metric-value"
                            style={{
                                fontSize: "24px",
                                fontWeight: 700,
                                color: metric.color || "var(--primary-color)",
                                marginBottom: "4px"
                            }}
                        >
                            {metric.count}
                        </div>

                        <div
                            className="metric-label"
                            style={{
                                fontSize: "13px",
                                color: "var(--text-secondary)",
                                textAlign: "center",
                                lineHeight: 1.2,
                                marginBottom: "4px"
                            }}
                        >
                            {metric.label}
                        </div>

                        <div
                            className="metric-percent"
                            style={{
                                fontSize: "12px",
                                fontWeight: 500,
                                color: "var(--text-muted)",
                                background: "rgba(255,255,255,0.05)",
                                padding: "2px 8px",
                                borderRadius: "10px"
                            }}
                        >
                            {metric.percentage}%
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
