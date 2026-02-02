import { useThemeStore } from '../state/themeStore';
import { BulbOutlined, BulbFilled } from '@ant-design/icons';

export function ThemeToggle() {
    const { theme, toggleTheme } = useThemeStore();
    const isDark = theme === 'dark';

    return (
        <div
            className="theme-toggle"
            onClick={toggleTheme}
            title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        >
            {isDark ? (
                <BulbOutlined style={{ fontSize: 20 }} />
            ) : (
                <BulbFilled style={{ fontSize: 20 }} />
            )}
        </div>
    );
}
