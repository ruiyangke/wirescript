import { createContext, type ReactNode, useContext } from 'react';

// Minimal theme colors for components that need direct color access (e.g., PNG export)
interface ThemeColors {
  bg: string;
  surface: string;
  border: string;
  text: {
    high: string;
    medium: string;
    low: string;
  };
  primary: string;
}

interface Theme {
  name: string;
  colors: ThemeColors;
}

// Hardcoded brutalism theme values (matches globals.css)
const brutalismTheme: Theme = {
  name: 'brutalism',
  colors: {
    bg: '#FFFFFF',
    surface: '#FFFFFF',
    border: '#000000',
    text: {
      high: '#000000',
      medium: '#52525B',
      low: '#737373',
    },
    primary: '#E85D04',
  },
};

interface ThemeContextValue {
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  // Only brutalism theme is supported currently
  const theme = brutalismTheme;

  return (
    <ThemeContext.Provider value={{ theme }}>
      <div data-theme="brutalism">{children}</div>
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
