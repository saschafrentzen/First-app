import { Theme } from '../types/theme';

export const lightTheme: Theme = {
  dark: false,
  colors: {
    primary: '#007AFF',
    primaryLight: '#B5D6FF',
    background: '#F2F2F7',
    backgroundLight: '#FFFFFF',
    text: '#000000',
    textLight: '#3C3C43',
    textSecondary: '#8E8E93',
    textInverted: '#FFFFFF',
    border: '#C6C6C8',
    error: '#FF3B30',
    success: '#34C759',
    warning: '#FF9500',
    accent: '#5856D6',
    surface: '#FFFFFF'
  }
};

export const darkTheme: Theme = {
  dark: true,
  colors: {
    primary: '#0A84FF',
    primaryLight: '#0A84FF50',
    background: '#000000',
    backgroundLight: '#1C1C1E',
    text: '#FFFFFF',
    textLight: '#EBEBF5',
    textSecondary: '#8E8E93',
    textInverted: '#000000',
    border: '#38383A',
    error: '#FF453A',
    success: '#32D74B',
    warning: '#FF9F0A',
    accent: '#5E5CE6',
    surface: '#1C1C1E'
  }
};