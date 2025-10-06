import { useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';

interface ThemeColors {
  background: string;
  text: string;
  textSecondary: string;
  border: string;
  primary: string;
  accent: string;
  error: string;
}

const lightTheme: ThemeColors = {
  background: '#FFFFFF',
  text: '#000000',
  textSecondary: '#666666',
  border: '#E0E0E0',
  primary: '#4CAF50',
  accent: '#2196F3',
  error: '#F44336',
};

const darkTheme: ThemeColors = {
  background: '#121212',
  text: '#FFFFFF',
  textSecondary: '#AAAAAA',
  border: '#333333',
  primary: '#81C784',
  accent: '#64B5F6',
  error: '#E57373',
};

export const useTheme = () => {
  const colorScheme = useColorScheme();
  const [theme, setTheme] = useState<ThemeColors>(colorScheme === 'dark' ? darkTheme : lightTheme);

  useEffect(() => {
    setTheme(colorScheme === 'dark' ? darkTheme : lightTheme);
  }, [colorScheme]);

  return { theme };
};