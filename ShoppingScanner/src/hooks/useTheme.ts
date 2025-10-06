import { useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { ThemeColors } from '../types/theme';

const lightTheme: ThemeColors = {
  primary: '#4CAF50',
  primaryLight: '#81C784',
  background: '#FFFFFF',
  backgroundLight: '#F5F5F5',
  text: '#000000',
  textLight: '#666666',
  textSecondary: '#666666',
  textInverted: '#FFFFFF',
  border: '#E0E0E0',
  error: '#F44336',
  success: '#34C759',
  warning: '#FF9500',
  accent: '#2196F3',
  surface: '#FFFFFF'
};

const darkTheme: ThemeColors = {
  primary: '#81C784',
  primaryLight: '#A5D6A7',
  background: '#121212',
  backgroundLight: '#1E1E1E',
  text: '#FFFFFF',
  textLight: '#BBBBBB',
  textSecondary: '#AAAAAA',
  textInverted: '#000000',
  border: '#333333',
  error: '#E57373',
  success: '#66BB6A',
  warning: '#FFA726',
  accent: '#64B5F6',
  surface: '#1E1E1E'
};

export const useTheme = () => {
  const colorScheme = useColorScheme();
  const [theme, setTheme] = useState<ThemeColors>(colorScheme === 'dark' ? darkTheme : lightTheme);

  useEffect(() => {
    setTheme(colorScheme === 'dark' ? darkTheme : lightTheme);
  }, [colorScheme]);

  return { theme };
};