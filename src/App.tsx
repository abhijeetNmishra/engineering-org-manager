import { useMemo, useState } from "react";
import { Layout, Menu } from "antd";
import {
  HomeOutlined,
  TeamOutlined,
  ApartmentOutlined,
  DashboardOutlined,
  NodeIndexOutlined,
  ImportOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import {
  Home,
  Dashboard,
  PeopleDirectory,
  ModuleOwnership,
  OrgChart,
  ImportExport,
} from "./pages";
import { OrgStoreProvider } from "./state/orgStore";
import { useThemeEffect } from "./state/themeStore";
import { ThemeToggle } from "./components/ThemeToggle";

const { Header, Sider, Content } = Layout;

type RouteKey = "home" | "dashboard" | "people" | "modules" | "orgchart" | "data";

function AppShell() {
  const [route, setRoute] = useState<RouteKey>("home");

  // Apply theme to document
  useThemeEffect();

  const menuItems: MenuProps["items"] = useMemo(
    () => [
      { key: "home", icon: <HomeOutlined />, label: "Home" },
      { key: "dashboard", icon: <DashboardOutlined />, label: "Dashboard" },
      { key: "people", icon: <TeamOutlined />, label: "People & Reporting" },
      { key: "modules", icon: <ApartmentOutlined />, label: "Modules & Ownership" },
      { key: "orgchart", icon: <NodeIndexOutlined />, label: "Org Chart" },
      { key: "data", icon: <ImportOutlined />, label: "Import / Export" },
    ],
    []
  );

  return (
    <Layout className="app-shell">
      <ThemeToggle />

      <Sider width={252} theme="dark" style={{ background: "rgba(8,12,20,0.85)" }}>
        <div className="sider-title">
          <div className="brand">Shipt Marketplace</div>
          <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
            Org Manager • Demo
          </div>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[route]}
          items={menuItems}
          onClick={(e) => setRoute(e.key as RouteKey)}
          style={{ background: "transparent" }}
        />
      </Sider>

      <Layout>
        <Header className="header-glass" style={{ padding: "0 16px", display: "flex", alignItems: "center" }}>
          <div className="brand">Marketplace Engineering</div>
          <div className="muted" style={{ marginLeft: "auto", fontSize: 12 }}>
            Vertical + Horizontal accountability • Modules • Ownership • Spans
          </div>
        </Header>

        <Content className="content">
          <div className="glass" style={{ padding: 14 }}>
            {route === "home" && <Home onNavigate={(r) => setRoute(r as RouteKey)} />}
            {route === "dashboard" && <Dashboard />}
            {route === "people" && <PeopleDirectory />}
            {route === "modules" && <ModuleOwnership />}
            {route === "orgchart" && <OrgChart />}
            {route === "data" && <ImportExport />}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}

export default function App() {
  return (
    <OrgStoreProvider>
      <AppShell />
    </OrgStoreProvider>
  );
}