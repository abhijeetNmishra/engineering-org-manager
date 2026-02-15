import { useEffect, useMemo, useState } from "react";
import { Layout, Menu, Button, ConfigProvider, theme, Tooltip } from "antd";
import {
  HomeOutlined,
  TeamOutlined,
  ApartmentOutlined,
  DashboardOutlined,
  NodeIndexOutlined,
  ImportOutlined,
  MenuOutlined,
  CloseOutlined,
  LogoutOutlined,
  BulbOutlined,
  BulbFilled,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import {
  PeopleDirectory,
  OrgChart,
  ImportExport,
  OrgOverview,
  Intelligence,
  ManageOrg,
} from "./pages";
import { Login } from "./pages/Login";
import { OrgStoreProvider } from "./state/orgStore";
import { useThemeEffect, useThemeStore } from "./state/themeStore";
import { useAuthStore } from "./state/authStore";
import { ErrorBoundary } from "./components/ErrorBoundary";

const { Header, Sider, Content } = Layout;

type RouteKey = "overview" | "dashboard" | "people" | "modules" | "orgchart" | "data";

const routeLabels: Record<RouteKey, string> = {
  overview: "Org Overview",
  dashboard: "Intelligence Dashboard",
  people: "People Directory",
  orgchart: "Org Chart",
  modules: "Manage Org",
  data: "Import / Export",
};

function AppShell() {
  const [route, setRoute] = useState<RouteKey>("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme: currentThemeMode, toggleTheme } = useThemeStore();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Auth store
  const logout = useAuthStore(state => state.logout);
  const user = useAuthStore(state => state.user);

  // Apply theme to document
  useThemeEffect();

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Close menu when switching to desktop
      if (!mobile) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menuItems: MenuProps["items"] = useMemo(
    () => [
      { key: "overview", icon: <HomeOutlined />, label: "Org Overview" },
      { key: "dashboard", icon: <DashboardOutlined />, label: "Intelligence" },
      { key: "people", icon: <TeamOutlined />, label: "People Directory" },
      { key: "orgchart", icon: <NodeIndexOutlined />, label: "Org Chart" },
      { key: "modules", icon: <ApartmentOutlined />, label: "Manage Org" },
      { key: "data", icon: <ImportOutlined />, label: "Import / Export" },
    ],
    []
  );

  const handleMenuClick = (e: { key: string }) => {
    setRoute(e.key as RouteKey);
    // Close mobile menu after navigation
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <Layout className="app-shell">

      {/* Mobile backdrop */}
      {isMobile && mobileMenuOpen && (
        <div
          className="mobile-sidebar-backdrop active"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <Sider
        width={252}
        theme="dark"
        style={{ background: "rgba(8,12,20,0.85)" }}
        className={isMobile && mobileMenuOpen ? 'mobile-open' : ''}
      >
        <div className="sider-title">
          <div className="brand">Shipt Marketplace</div>
          <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
            Org Manager • Demo
          </div>
          {/* Close button for mobile */}
          {isMobile && mobileMenuOpen && (
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={() => setMobileMenuOpen(false)}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                color: 'white',
                fontSize: 18,
              }}
            />
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[route]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ background: "transparent" }}
        />
      </Sider>

      <Layout>
        <Header className="header-glass" style={{ padding: "0 16px", display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Hamburger menu for mobile */}
          {isMobile && (
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={toggleMobileMenu}
              className="hamburger-menu"
              style={{
                fontSize: 20,
                color: 'var(--text-primary)',
              }}
            />
          )}

          <div className="brand" style={{ flex: 'none' }}>
            {isMobile ? "MP Engineering" : "Marketplace Engineering"}
          </div>

          {!isMobile && (
            <span style={{
              color: 'var(--text-secondary)',
              fontSize: 13,
              fontWeight: 500,
              marginLeft: 4,
            }}>
              / {routeLabels[route]}
            </span>
          )}

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Tooltip title={`Switch to ${currentThemeMode === 'dark' ? 'light' : 'dark'} mode`}>
              <Button
                type="text"
                icon={currentThemeMode === 'dark' ? <BulbOutlined /> : <BulbFilled />}
                onClick={toggleTheme}
                style={{ color: 'var(--text-primary)' }}
              />
            </Tooltip>
            {!isMobile && (
              <Button
                type="text"
                icon={<LogoutOutlined />}
                onClick={logout}
                style={{ color: 'var(--text-primary)' }}
              >
                {user?.email || "Logout"}
              </Button>
            )}
          </div>
        </Header>

        <Content className="content">
          <div className={`glass ${["modules", "orgchart"].includes(route) ? 'fixed-height' : ''}`} style={{ padding: 14 }}>
            {route === "overview" && <OrgOverview />}
            {route === "dashboard" && <Intelligence />}
            {route === "people" && <PeopleDirectory />}
            {route === "modules" && <ManageOrg />}
            {route === "orgchart" && <OrgChart />}
            {route === "data" && <ImportExport />}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}

export default function App() {
  const { isAuthenticated, checkAuth } = useAuthStore();
  const currentTheme = useThemeStore((state) => state.theme);

  // Skip auth in local development (when using npm run dev)
  const isDev = import.meta.env.DEV;

  // Check auth on mount and after storage changes
  useEffect(() => {
    if (!isDev) {
      checkAuth();
    }
  }, [checkAuth, isDev]);

  // Show login page if not authenticated (only in production)
  if (!isDev && (!isAuthenticated || !checkAuth())) {
    return (
      <OrgStoreProvider>
        <Login />
      </OrgStoreProvider>
    );
  }

  // Show authenticated app
  return (
    <ErrorBoundary>
      <OrgStoreProvider>
        <ConfigProvider
          theme={{
            algorithm: currentTheme === "dark" ? theme.darkAlgorithm : theme.defaultAlgorithm,
            token: {
              colorPrimary: "#6B21EF"
            }
          }}
        >
          <AppShell />
        </ConfigProvider>
      </OrgStoreProvider>
    </ErrorBoundary>
  );
}