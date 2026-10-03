import React, { createContext, useContext, useState, useEffect } from 'react';
import { KlikoThemeMode } from '../../../packages/design-system/src/theme';

interface ThemeContextType {
  theme: KlikoThemeMode;
  setTheme: (theme: KlikoThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'obsidian',
  setTheme: () => {},
  toggleTheme: () => {}
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<KlikoThemeMode>(() => {
    return (localStorage.getItem('kliko_theme') as KlikoThemeMode) || 'light-graphite';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('kliko_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'obsidian' ? 'light-graphite' : 'obsidian');
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useKlikoTheme = () => useContext(ThemeContext);
