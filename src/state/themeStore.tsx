import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

interface ThemeState {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            theme: 'light',
            toggleTheme: () =>
                set((state) => ({
                    theme: state.theme === 'light' ? 'dark' : 'light',
                })),
            setTheme: (theme) => set({ theme }),
        }),
        {
            name: 'theme-storage',
        }
    )
);

// Hook to apply theme to document
export function useThemeEffect() {
    const theme = useThemeStore((state) => state.theme);

    // Apply theme class to document root
    if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', theme);
    }

    return theme;
}
