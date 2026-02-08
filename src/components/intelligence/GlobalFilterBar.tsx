import { Select, Button } from "antd";
import { ClearOutlined, FilterOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";

export interface DashboardFilters {
    leaderId: string | null;
    workstream: string | null;
    location: string | null;
    status: string | null;
}

interface GlobalFilterBarProps {
    filters: DashboardFilters;
    onChange: (filters: DashboardFilters) => void;
    options: {
        leaders: { label: string, value: string }[];
        workstreams: { label: string, value: string }[];
        locations: { label: string, value: string }[];
    };
}

export function GlobalFilterBar({ filters, onChange, options }: GlobalFilterBarProps) {
    const hasActiveFilters = Object.values(filters).some(v => v !== null);

    const updateFilter = (key: keyof DashboardFilters, value: string | null) => {
        onChange({ ...filters, [key]: value });
    };

    const clearFilters = () => {
        onChange({
            leaderId: null,
            workstream: null,
            location: null,
            status: null,
        });
    };

    return (
        <motion.div
            className="global-filter-bar"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
                background: "var(--card-bg)",
                padding: "12px 20px",
                borderRadius: "12px",
                marginBottom: "24px",
                border: "1px solid var(--border-glass)",
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
            }}
        >
            <div style={{ display: "flex", alignItems: "center", marginRight: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>
                <FilterOutlined style={{ marginRight: "8px" }} />
                Filters:
            </div>

            <Select
                placeholder="Filter by Leader"
                allowClear
                showSearch
                style={{ width: 240 }}
                value={filters.leaderId}
                onChange={(val) => updateFilter("leaderId", val)}
                options={options.leaders}
                filterOption={(input, option) =>
                    (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                }
            />

            <Select
                placeholder="Workstream"
                allowClear
                style={{ width: 180 }}
                value={filters.workstream}
                onChange={(val) => updateFilter("workstream", val)}
                options={options.workstreams}
            />

            <Select
                placeholder="Location"
                allowClear
                style={{ width: 140 }}
                value={filters.location}
                onChange={(val) => updateFilter("location", val)}
                options={options.locations}
            />

            <Select
                placeholder="Status"
                allowClear
                style={{ width: 140 }}
                value={filters.status}
                onChange={(val) => updateFilter("status", val)}
                options={[
                    { label: "Active", value: "active" },
                    { label: "On Leave", value: "on_leave" },
                    { label: "Open Role", value: "open" }
                ]}
            />

            {hasActiveFilters && (
                <Button
                    type="text"
                    icon={<ClearOutlined />}
                    onClick={clearFilters}
                    style={{ color: "var(--text-secondary)", marginLeft: "auto" }}
                >
                    Clear All
                </Button>
            )}
        </motion.div>
    );
}
