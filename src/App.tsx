import { useEffect, useMemo, useState } from "react";
import { Layout, Menu, Button } from "antd";
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
import { Login } from "./pages/Login";
import { OrgStoreProvider } from "./state/orgStore";
import { useThemeEffect } from "./state/themeStore";
import { useAuthStore } from "./state/authStore";
import { ThemeToggle } from "./components/ThemeToggle";

const { Header, Sider, Content } = Layout;

type RouteKey = "home" | "dashboard" | "people" | "modules" | "orgchart" | "data";

function AppShell() {
  const [route, setRoute] = useState<RouteKey>("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
      { key: "home", icon: <HomeOutlined />, label: "Home" },
      { key: "dashboard", icon: <DashboardOutlined />, label: "Dashboard" },
      { key: "people", icon: <TeamOutlined />, label: "People & Reporting" },
      { key: "modules", icon: <ApartmentOutlined />, label: "Modules & Ownership" },
      { key: "orgchart", icon: <NodeIndexOutlined />, label: "Org Chart" },
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
      <ThemeToggle />

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

          <div className="brand" style={{ flex: isMobile ? 1 : 'none' }}>
            {isMobile ? "MP Engineering" : "Marketplace Engineering"}
          </div>

          {!isMobile && (
            <>
              <div className="muted" style={{ marginLeft: "auto", fontSize: 12 }}>
                Vertical + Horizontal accountability • Modules • Ownership • Spans
              </div>
              <Button
                type="text"
                icon={<LogoutOutlined />}
                onClick={logout}
                style={{ color: 'var(--text-primary)', marginLeft: '12px' }}
              >
                {user?.email || "Logout"}
              </Button>
            </>
          )}
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
  const { isAuthenticated, checkAuth } = useAuthStore();

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
    <OrgStoreProvider>
      <AppShell />
    </OrgStoreProvider>
  );
}